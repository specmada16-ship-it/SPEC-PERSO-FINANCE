// sync.js — synchronisation cloud (Supabase) en mode "local-first"
// localStorage reste la source principale ; le cloud sert de copie partagée entre appareils
// et entre comptes (profils partagés par code d'invitation).
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
const DETACH_KEY = "sf_sync_detached"; // profils partagés dont l'accès a été retiré : copie locale gardée, plus de synchro

// Un profil d'un autre compte porte l'id local  "<id du propriétaire>~<id du profil>".
// Ainsi deux comptes peuvent avoir chacun un profil "default" sans collision sur l'appareil.
const SEP = "~";
export const isShared = (pid) => String(pid).includes(SEP);
const localId = (owner, id, me) => (owner === me ? id : owner + SEP + id);
const splitId = (pid) => {
  const i = pid.indexOf(SEP);
  return { owner: pid.slice(0, i), id: pid.slice(i + 1) };
};

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
// replace = true : la copie locale devient EXACTEMENT celle du cloud (les clés absentes du cloud sont effacées,
// sinon d'anciennes clés restées sur l'appareil feraient croire à une modification locale).
function writeData(pid, d, replace = false) {
  for (const k of KEYS) {
    if (d[k] !== undefined) wr(pk(pid, k), d[k]);
    else if (replace) localStorage.removeItem(pk(pid, k));
  }
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
  wr(DETACH_KEY, []);
  localStorage.removeItem(UID_KEY);
}

// ── Une passe de synchro. Retourne true s'il faut recommencer (conflit détecté). ─
async function pass(user, out) {
  const me = user.id;
  if (rd(UID_KEY, null) !== me) {
    wr(META_KEY, {});
    wr(PDEL_KEY, []);
    wr(DETACH_KEY, []);
    wr(UID_KEY, me);
  }

  // 1. Suppressions en attente : ses propres profils sont supprimés, un profil partagé est simplement quitté
  const pdel = rd(PDEL_KEY, []);
  if (pdel.length) {
    const own = pdel.filter((p) => !isShared(p));
    if (own.length) {
      const { error } = await supabase.from(TABLE).delete().eq("user_id", me).in("id", own);
      if (error) throw error;
    }
    for (const p of pdel.filter(isShared)) {
      const { owner, id } = splitId(p);
      const { error } = await supabase
        .from("profile_members")
        .delete()
        .eq("user_id", me)
        .eq("owner_id", owner)
        .eq("profile_id", id);
      if (error) throw error;
    }
    wr(PDEL_KEY, []);
  }

  // 2. Liste légère des profils visibles (les siens + ceux qu'on a rejoints), sans les données
  const { data: rows, error } = await supabase.from(TABLE).select("user_id,id,name,updated_at");
  if (error) throw error;
  rows.forEach((r) => (r.lid = localId(r.user_id, r.id, me)));
  const meta = rd(META_KEY, {});
  const detached = new Set(rd(DETACH_KEY, []));
  rows.forEach((r) => detached.delete(r.lid)); // ré-invité : on resynchronise

  // 3. On ne télécharge les données que des profils modifiés ailleurs
  const need = rows.filter((r) => !meta[r.lid] || meta[r.lid].at !== r.updated_at);
  const full = {};
  if (need.length) {
    const res = await supabase
      .from(TABLE)
      .select("user_id,id,data")
      .in("id", [...new Set(need.map((r) => r.id))]);
    if (res.error) throw res.error;
    res.data.forEach((x) => (full[localId(x.user_id, x.id, me)] = x.data || {}));
  }

  // 4. Plan (aucune écriture locale ici)
  const profiles = rd(PROFILES_KEY, []);
  const remoteIds = new Set(rows.map((r) => r.lid));
  const plans = [];

  for (const r of rows) {
    const lp = profiles.find((p) => p.id === r.lid);
    const m = meta[r.lid];
    const remoteChanged = !m || m.at !== r.updated_at;
    const ref = { id: r.lid, owner: r.user_id, cid: r.id }; // cid = id dans le cloud

    if (!lp) {
      plans.push({ ...ref, kind: "create", name: r.name, data: full[r.lid] || {}, at: r.updated_at });
      continue;
    }
    const local = readData(r.lid);
    const lh = hashes(local);
    const dirty = !m || lp.name !== m.name || KEYS.some((k) => lh[k] !== m.keys[k]);

    if (!remoteChanged && !dirty) continue;
    if (!remoteChanged) {
      plans.push({ ...ref, kind: "push", name: lp.name, data: local, prevAt: r.updated_at, lh });
      continue;
    }
    const remoteData = full[r.lid] || {};
    if (!dirty || isPristine(r.lid, local)) {
      plans.push({ ...ref, kind: "adopt", name: r.name, data: remoteData, at: r.updated_at, lh });
      continue;
    }
    const merged = mergeData(local, remoteData, m ? m.keys : null);
    const name = !m || lp.name !== m.name ? lp.name : r.name;
    plans.push({ ...ref, kind: "merge", name, data: merged, prevAt: r.updated_at, lh });
  }

  let remaining = profiles.length;
  for (const p of profiles) {
    if (remoteIds.has(p.id) || detached.has(p.id)) continue;
    const m = meta[p.id];
    const local = readData(p.id);
    const lh = hashes(local);
    const dirty = !m || p.name !== m.name || KEYS.some((k) => lh[k] !== m.keys[k]);
    if (isShared(p.id)) {
      // Accès retiré, ou profil supprimé par son propriétaire : on ne pousse JAMAIS un profil qui n'est pas à nous
      if (m && !dirty && remaining > 1) {
        remaining--;
        plans.push({ id: p.id, kind: "remove" });
      } else {
        plans.push({ id: p.id, kind: "detach" }); // modifications non envoyées : on garde la copie locale
      }
      continue;
    }
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
      ? await supabase
          .from(TABLE)
          .update(body)
          .eq("user_id", pl.owner)
          .eq("id", pl.cid)
          .eq("updated_at", pl.prevAt)
          .select("updated_at")
      : await supabase.from(TABLE).insert({ ...body, id: pl.id, user_id: me }).select("updated_at");
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
    if (pl.kind === "detach") {
      detached.add(pl.id);
      out.detached.push(pl.id);
      continue;
    }
    if (pl.kind === "remove") {
      removeProfileLocal(pl.id);
      list = list.filter((p) => p.id !== pl.id);
      delete metaNow[pl.id];
      out.removed.push(pl.id);
      continue;
    }
    if (pl.kind === "create") {
      writeData(pl.id, pl.data, true);
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
      writeData(pl.id, pl.data, pl.kind === "adopt");
      if (pl.kind === "adopt") wr(`sf_ob_${pl.id}`, true);
      list = list.map((p) => (p.id === pl.id ? { ...p, name: pl.name } : p));
      out.changed.push(pl.id);
    }
    metaNow[pl.id] = stamp(pl.data, pl.name, pl.at);
  }
  wr(PROFILES_KEY, list);
  wr(META_KEY, metaNow);
  wr(DETACH_KEY, [...detached]);
  out.profiles = list;
  return conflict;
}

export async function syncAll() {
  if (!supabase) return { skipped: true };
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { skipped: true };
  const out = { changed: [], created: [], removed: [], detached: [], pushed: 0, profiles: null, conflict: false };
  for (let i = 0; i < 3; i++) {
    if (!(await pass(session.user, out))) return out;
  }
  out.conflict = true;
  return out;
}

// ── Partage de profils (code d'invitation) ───────────────────────────────────
// Le propriétaire génère un code (12 caractères, valable 48 h, usage unique).
export async function createInvite(pid) {
  const { data, error } = await supabase.rpc("create_invite", { p_profile_id: pid });
  if (error) throw error;
  return data;
}
// Affichage "a8ab-4bec-b71d"
export const formatCode = (c) => String(c || "").replace(/(.{4})(?=.)/g, "$1-");

// L'autre personne rejoint avec le code. Retourne l'id local du profil (à ouvrir après une synchro).
export async function joinWithCode(code) {
  const { data, error } = await supabase.rpc("join_with_code", { p_code: code });
  if (error) throw error;
  return data.owner_id + SEP + data.profile_id;
}
// Propriétaire : qui a accès à ce profil ? → [{ user_id, email }]
export async function listMembers(pid) {
  const { data, error } = await supabase.rpc("list_members", { p_profile_id: pid });
  if (error) throw error;
  return data || [];
}
// Propriétaire : retirer quelqu'un du profil
export async function removeMember(pid, userId) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("not_authenticated");
  const { error } = await supabase
    .from("profile_members")
    .delete()
    .eq("owner_id", session.user.id)
    .eq("profile_id", pid)
    .eq("user_id", userId);
  if (error) throw error;
}
