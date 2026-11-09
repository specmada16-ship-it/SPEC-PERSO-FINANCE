// syncCore.js — logique pure de fusion (aucune dépendance, testable seule)

export const KEYS = [
  "txs", "bal", "env", "sub", "ir", "max", "sinks", "re",
  "currency", "lang", "seuils", "coussin", "tomb",
];

// Les soldes (bal/max) sont dérivés de ces clés
const BAL_RELEVANT = ["txs", "env", "sub", "ir"];

export function hash(v) {
  const s = JSON.stringify(v === undefined ? null : v);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36) + "." + s.length.toString(36);
}

export const hashes = (d) => Object.fromEntries(KEYS.map((k) => [k, hash(d[k])]));

const union = (a, b) => [...new Set([...(a || []), ...(b || [])])];

function unionById(a, b) {
  const seen = new Set();
  const out = [];
  for (const x of [...(a || []), ...(b || [])]) {
    if (!x || seen.has(x.id)) continue;
    seen.add(x.id);
    out.push(x);
  }
  return out;
}

// Règle des barres de progression, appliquée à chaque revenu (une seule définition pour toute l'app).
// nb = soldes, nm = références (max) — modifiés en place.
//  - revenu normal : la référence ne baisse jamais ; elle monte si le nouveau solde la dépasse.
//    Si l'enveloppe était vide (solde <= 0) ou sans référence : nouveau cycle → barre à 100 %.
//  - reset = true (case cochée à l'ajout du revenu) : TOUTES les barres repartent à 100 %.
export function applyIncome(nb, nm, split, amount, envIds, reset) {
  Object.entries(split || {}).forEach(([k, p]) => {
    if (!p) return;
    const prev = nb[k] || 0;
    nb[k] = prev + (amount * p) / 100;
    nm[k] = prev <= 0 || !nm[k] ? nb[k] : Math.max(nm[k], nb[k]);
  });
  if (reset) (envIds || []).forEach((id) => { nm[id] = Math.max(0, nb[id] || 0); });
}

// Rejoue toutes les transactions depuis zéro — miroir exact de recalcBal() dans App.jsx
export function recalcPure(txs, envelopes, subcats, incomeRules) {
  const nb = {};
  envelopes.forEach((e) => (nb[e.id] = 0));
  const nm = {};
  const ordered = txs
    .map((tx, i) => ({ tx, i }))
    .sort((a, b) => {
      const d = new Date(a.tx.date) - new Date(b.tx.date);
      return d !== 0 ? d : b.i - a.i;
    })
    .map((o) => o.tx);
  ordered.forEach((tx) => {
    if (tx.type === "income") {
      const rule = incomeRules[tx.incomeType];
      if (rule) applyIncome(nb, nm, rule.split, tx.amount, envelopes.map((e) => e.id), tx.resetBars);
    } else if (tx.directEnvelopeId) {
      nb[tx.directEnvelopeId] = (nb[tx.directEnvelopeId] || 0) - tx.amount;
    } else {
      const sc = subcats.find((s) => s.id === tx.subcatId);
      if (sc?.envelopeId && !tx.fallbackOnly)
        nb[sc.envelopeId] = (nb[sc.envelopeId] || 0) - tx.amount;
      if (tx.fallbackEnvId && tx.fallbackCovered)
        nb[tx.fallbackEnvId] = (nb[tx.fallbackEnvId] || 0) - tx.fallbackCovered;
    }
  });
  return { bal: nb, max: nm };
}

// Quand les deux côtés ont modifié la même clé
function combine(k, l, r) {
  if (k === "txs")
    return unionById(l, r).sort((a, b) => new Date(b.date) - new Date(a.date));
  if (k === "env" || k === "sub") return unionById(l, r);
  if (k === "ir") return { ...(r || {}), ...(l || {}) };
  return l !== undefined ? l : r; // le local gagne
}

// Fusion 3 voies par clé. baseKeys = hashes par clé de la dernière synchro (ou null).
export function mergeData(local, remote, baseKeys) {
  const out = {};
  out.tomb = union(local.tomb, remote.tomb);

  for (const k of KEYS) {
    if (k === "tomb" || k === "bal" || k === "max") continue;
    const l = local[k];
    const r = remote[k];
    const hl = hash(l);
    const hr = hash(r);
    let v;
    if (hl === hr) v = l;
    else {
      const hb = baseKeys ? baseKeys[k] : undefined;
      const lChanged = hb === undefined || hl !== hb;
      const rChanged = hb === undefined || hr !== hb;
      if (lChanged && !rChanged) v = l;
      else if (rChanged && !lChanged) v = r;
      else v = combine(k, l, r);
    }
    if (v !== undefined) out[k] = v;
  }

  // Une transaction supprimée quelque part reste supprimée
  if (out.txs) {
    const dead = new Set(out.tomb);
    out.txs = out.txs.filter((t) => !dead.has(t.id));
  }

  // Soldes : on réutilise ceux d'un côté s'il est cohérent, sinon on recalcule
  const same = (x) => BAL_RELEVANT.every((k) => hash(out[k]) === hash(x[k]));
  if (same(remote) && remote.bal !== undefined) {
    out.bal = remote.bal;
    if (remote.max !== undefined) out.max = remote.max;
  } else if (same(local) && local.bal !== undefined) {
    out.bal = local.bal;
    if (local.max !== undefined) out.max = local.max;
  } else {
    const c = recalcPure(out.txs || [], out.env || [], out.sub || [], out.ir || {});
    out.bal = c.bal;
    out.max = c.max;
  }
  return out;
}
