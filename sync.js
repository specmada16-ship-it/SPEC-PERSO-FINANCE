// sync.js — synchronisation cloud (Supabase) en mode "local-first"
// localStorage reste la source principale ; le cloud sert de copie partagée entre appareils.
import { createClient } from "@supabase/supabase-js";
import { KEYS, hashes, mergeData } from "./syncCore.js";

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY_ = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const cloudEnabled = Boolean(URL_ && KEY_);
export const supabase = cloudEnabled ? createClient(URL_, KEY_) : null;

const TABLE = "profiles_data";
const META_KEY = "sf_sync_meta";      // { [profileId]: { at, name, keys } } = état à la dernière synchro
const PDEL_KEY = "sf_sync_pdel";      // profils supprimés localement, à supprimer aussi dans le cloud
const UID_KEY = "sf_sync_uid";        // compte auquel appartiennent les métadonnées
const PROFILES_KEY = "sf_profiles";

const rd = (k, d) => {
  try {
    const v = localStorage.getItem(k);
    return v === null ? d : JSON.parse(v);
  } catch {
    return d;
  }
};
const wr = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const pk = (pid, k) => `p_${pid}_${k}`;

function readData(pid) {
  const d = {};
  for (const k of KEYS) {
    const v = rd(pk(pid, k), undefined);
    if (v !== undefined) d[k] = v;
  }
  return d;
}
function writeData(pid, d) {
  for (const k of KEYS) if (d[k] !== undefined) wr(pk(pid, k), d[k]);
}
function removeProfileLocal(pid) {
  for (const k of KEYS) localStorage.removeItem(pk(pid, k));
  localStorage.removeItem(`sf_ob_${pid}`);
}
const stamp = (data, name, at) => ({ at, name, keys: hashes(data) });

// Profil jamais configuré et vide (appareil neuf) → on adopte le cloud sans fusionner
function isPristine(pid, local) {
  return !rd(`sf_ob_${pid}`, false) && (!local.txs || local.txs.length === 0);
}

// ── API utilisée par App.jsx ───────────────────────────────────────────────────
export function addTombstones(pid, ids) {
  if (!ids || !ids.length) return;
  const t = new Set(rd(pk(pid, "tomb"), []));
  ids.forEach((i) => t.add(i));
  wr(pk(pid, "tomb"), [...t]);
}
export function queueProfileDelete(pid) {
  const l = rd(PDEL_KEY, []);
  if (!l.includes(pid)) wr(PDEL_KEY, [...l, pid]);
}
export function resetSyncState() {
  wr(META_KEY, {});
  wr(PDEL_KEY, []);
  localStorage.removeItem(UID_KEY);
}

// ── Une passe de synchro. Retourne true s'il faut recommencer (conflit détecté). ─
async function pass(user, out) {
  if (rd(UID_KEY, null) !== user.id) {
    wr(META_KEY, {});
    wr(PDEL_KEY, []);
    wr(UID_KEY, user.id);
  }

  // 1. Suppressions de profils en attente
  const pdel = rd(PDEL_KEY, []);
  if (pdel.length) {
    const { error } = await supabase.from(TABLE).delete().in("id", pdel);
    if (error) throw error;
    wr(PDEL_KEY, []);
  }

  // 2. Liste légère des profils distants (sans les données)
  const { data: rows, error } = await supabase.from(TABLE).select("id,name,updated_at");
  if (error) throw error;
  const meta = rd(META_KEY, {});

  // 3. On ne télécharge les données que des profils modifiés ailleurs
  const needData = rows.filter((r) => !meta[r.id] || meta[r.id].at !== r.updated_at).map((r) => r.id);
  const full = {};
  if (needData.length) {
    const res = await supabase.from(TABLE).select("id,data").in("id", needData);
    if (res.error) throw res.error;
    res.data.forEach((x) => (full[x.id] = x.data || {}));
  }

  // 4. Plan (aucune écriture locale ici)
  const profiles = rd(PROFILES_KEY, []);
  const remoteIds = new Set(rows.map((r) => r.id));
  const plans = [];

  for (const r of rows) {
    const lp = profiles.find((p) => p.id === r.id);
    const m = meta[r.id];
    const remoteChanged = !m || m.at !== r.updated_at;

    if (!lp) {
      plans.push({ id: r.id, kind: "create", name: r.name, data: full[r.id] || {}, at: r.updated_at });
      continue;
    }
    const local = readData(r.id);
    const lh = hashes(local);
    const dirty = !m || lp.name !== m.name || KEYS.some((k) => lh[k] !== m.keys[k]);

    if (!remoteChanged && !dirty) continue;
    if (!remoteChanged) {
      plans.push({ id: r.id, kind: "push", name: lp.name, data: local, prevAt: r.updated_at, lh });
      continue;
    }
    const remoteData = full[r.id] || {};
    if (!dirty || isPristine(r.id, local)) {
      plans.push({ id: r.id, kind: "adopt", name: r.name, data: remoteData, at: r.updated_at, lh });
      continue;
    }
    const merged = mergeData(local, remoteData, m ? m.keys : null);
    const name = !m || lp.name !== m.name ? lp.name : r.name;
    plans.push({ id: r.id, kind: "merge", name, data: merged, prevAt: r.updated_at, lh });
  }

  let remaining = profiles.length;
  for (const p of profiles) {
    if (remoteIds.has(p.id)) continue;
    const m = meta[p.id];
    const local = readData(p.id);
    const lh = hashes(local);
    const dirty = !m || p.name !== m.name || KEYS.some((k) => lh[k] !== m.keys[k]);
    if (m && !dirty && remaining > 1) {
      remaining--;
      plans.push({ id: p.id, kind: "remove" }); // supprimé depuis un autre appareil
    } else if (!isPristine(p.id, local)) {
      plans.push({ id: p.id, kind: "push", name: p.name, data: local, prevAt: null, lh });
    }
  }

  // 5. Envoi (avec contrôle : on n'écrase que la version qu'on a vue)
  let conflict = false;
  for (const pl of plans) {
    if (pl.kind !== "push" && pl.kind !== "merge") continue;
    const body = { name: pl.name, data: pl.data, updated_at: new Date().toISOString() };
    const res = pl.prevAt
      ? await supabase.from(TABLE).update(body).eq("id", pl.id).eq("updated_at", pl.prevAt).select("updated_at")
      : await supabase.from(TABLE).insert({ ...body, id: pl.id, user_id: user.id }).select("updated_at");
    if (res.error) {
      if (res.error.code === "23505") {
        conflict = true;
        pl.failed = true;
        continue;
      }
      throw res.error;
    }
    if (!res.data || !res.data.length) {
      conflict = true;
      pl.failed = true;
      continue;
    }
    pl.at = res.data[0].updated_at;
    out.pushed++;
  }

  // 6. Écriture locale, d'un seul bloc synchrone
  let list = rd(PROFILES_KEY, []);
  const metaNow = rd(META_KEY, {});
  for (const pl of plans) {
    if (pl.failed) continue;
    if (pl.kind === "remove") {
      removeProfileLocal(pl.id);
      list = list.filter((p) => p.id !== pl.id);
      delete metaNow[pl.id];
      out.removed.push(pl.id);
      continue;
    }
    if (pl.kind === "create") {
      writeData(pl.id, pl.data);
      wr(`sf_ob_${pl.id}`, true);
      if (!list.some((p) => p.id === pl.id)) list = [...list, { id: pl.id, name: pl.name }];
      metaNow[pl.id] = stamp(pl.data, pl.name, pl.at);
      out.created.push(pl.id);
      continue;
    }
    if (pl.kind === "adopt" || pl.kind === "merge") {
      // L'utilisateur a modifié le profil pendant la synchro → on ne l'écrase pas, on recommence
      const cur = hashes(readData(pl.id));
      if (KEYS.some((k) => cur[k] !== pl.lh[k])) {
        conflict = true;
        continue;
      }
      writeData(pl.id, pl.data);
      if (pl.kind === "adopt") wr(`sf_ob_${pl.id}`, true);
      list = list.map((p) => (p.id === pl.id ? { ...p, name: pl.name } : p));
      out.changed.push(pl.id);
    }
    metaNow[pl.id] = stamp(pl.data, pl.name, pl.at);
  }
  wr(PROFILES_KEY, list);
  wr(META_KEY, metaNow);
  out.profiles = list;
  return conflict;
}

export async function syncAll() {
  if (!supabase) return { skipped: true };
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { skipped: true };
  const out = { changed: [], created: [], removed: [], pushed: 0, profiles: null, conflict: false };
  for (let i = 0; i < 3; i++) {
    if (!(await pass(session.user, out))) return out;
  }
  out.conflict = true;
  return out;
}
