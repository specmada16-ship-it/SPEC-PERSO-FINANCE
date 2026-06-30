import { useState, useEffect, useMemo } from "react";

// ─── RESPONSIVE HOOK ──────────────────────────────────────────────────────────
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 900 : false
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isDesktop;
}

const T = { bg:"#020303", card:"#060E08", card2:"#0A1A0C", border:"#122416", text:"#E8FFD4", accent:"#B4FF00", accentD:"#A6FF1A", green:"#5FD34A", sub:"#3A6040", muted:"#080F09" };
const CURRENCY = "Ar";
const SEUILS = { alerte:20000, blocage:8000 };

const DEFAULT_ENVELOPES = [
  { id:"survie",       label:"Survie",       color:"#F87171", bg:"#1A0808" },
  { id:"tresorerie",   label:"Trésorerie",   color:"#B4FF00", bg:"#141005", system:true },
  { id:"operationnel", label:"Opérationnel", color:"#B4FF00", bg:"#061510" },
  { id:"differable",   label:"Différable",   color:"#94A3B8", bg:"#0A0D12" },
];
const DEFAULT_SUBCATS = [
  { id:"repas",label:"Repas",envelopeId:"survie" },
  { id:"transport",label:"Transport",envelopeId:"survie" },
  { id:"eau",label:"Eau",envelopeId:"survie" },
  { id:"elec",label:"Électricité",envelopeId:"survie" },
  { id:"hygiene",label:"Hygiène",envelopeId:"survie" },
  { id:"tel",label:"Téléphone",envelopeId:"survie" },
  { id:"medic",label:"Médicament",envelopeId:"survie" },
  { id:"loyer_dep",label:"Loyer",envelopeId:"survie" },
  { id:"reserve",label:"Mise en réserve",envelopeId:"tresorerie" },
  { id:"data",label:"Data",envelopeId:"operationnel" },
  { id:"deplacement",label:"Déplacement client",envelopeId:"operationnel" },
  { id:"impression",label:"Impression",envelopeId:"operationnel" },
  { id:"materiel",label:"Matériel",envelopeId:"operationnel" },
  { id:"repas_pro",label:"Repas session",envelopeId:"operationnel" },
  { id:"fournitures",label:"Fournitures",envelopeId:"operationnel" },
  { id:"sortie",label:"Sortie",envelopeId:"differable" },
  { id:"loisirs",label:"Loisirs",envelopeId:"differable" },
  { id:"vetements",label:"Vêtements",envelopeId:"differable" },
  { id:"cadeaux",label:"Cadeaux",envelopeId:"differable" },
  { id:"autre_dif",label:"Autre",envelopeId:"differable" },
];
const DEFAULT_INCOME_RULES = {
  loyer:      { label:"Loyer",        icon:"🏠", color:"#B4FF00", split:{ survie:60,tresorerie:30,operationnel:10,differable:0 } },
  prestation: { label:"Prestation",   icon:"🎙️", color:"#A78BFA", split:{ survie:0,tresorerie:50,operationnel:30,differable:20 } },
  autre:      { label:"Autre revenu", icon:"💵", color:"#F472B6", split:{ survie:0,tresorerie:50,operationnel:30,differable:20 } },
};
const RECUR_OPTIONS = [
  { id:"none",label:"Aucun" },{ id:"weekly",label:"Chaque semaine" },
  { id:"monthly",label:"Chaque mois" },{ id:"yearly",label:"Chaque année" },
];

// ─── SHARED NAV ITEMS (used by both mobile bottom nav and desktop sidebar) ────
const NAV_ITEMS = [
  {id:"home", label:"Accueil", svg:(c)=>(
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )},
  {id:"history", label:"Historique", svg:(c)=>(
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>
    </svg>
  )},
  {id:"add", label:"Ajouter", big:true},
  {id:"recurring", label:"Récurrents", svg:(c)=>(
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
    </svg>
  )},
  {id:"categories", label:"Catégories", svg:(c)=>(
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h10M4 18h6"/>
    </svg>
  )},
];

const fmt  = n => new Intl.NumberFormat("fr-FR").format(Math.round(n||0))+" "+CURRENCY;
const fmtD = iso => new Date(iso).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});
const uid  = () => Math.random().toString(36).slice(2,8);
const load = (k,d) => { try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch{ return d; } };
const save = (k,v) => { try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} };

// ─── PROFILE UTILS ────────────────────────────────────────────────────────────
const pload = (pid,k,d) => load(`p_${pid}_${k}`,d);
const psave = (pid,k,v) => save(`p_${pid}_${k}`,v);

function makeDefaultProfile(name) {
  const id = uid();
  return { id, name };
}

const DEFAULT_PROFILES = [{ id:"default", name:"Perso" }];

// ─── LINE CHART ───────────────────────────────────────────────────────────────
function LineChart({ txs, filter }) {
  const points = useMemo(()=>{
    const now=new Date(), days=filter==="week"?7:filter==="month"?30:365, pts=[];
    for(let i=days;i>=0;i--){
      const d=new Date(now); d.setDate(d.getDate()-i);
      const dt=txs.filter(t=>new Date(t.date).toDateString()===d.toDateString());
      pts.push({ date:d, inc:dt.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0), exp:dt.filter(t=>t.type==="expense").reduce((a,t)=>a+t.amount,0), label:d.toLocaleDateString("fr-FR",{day:"numeric",month:"short"}) });
    }
    let bal=0,out=[];
    for(let i=pts.length-1;i>=0;i--) bal+=pts[i].inc-pts[i].exp;
    let r=bal; for(const p of pts){ r+=p.inc-p.exp; out.push({...p,bal:r}); }
    return out;
  },[txs,filter]);
  if(!points.length) return <div style={{textAlign:"center",color:T.sub,fontSize:13,padding:"20px 0"}}>Pas encore de données</div>;
  const vals=points.map(p=>p.bal), mn=Math.min(...vals), mx=Math.max(...vals), range=mx-mn||1;
  const W=340,H=100,P=8;
  const toX=i=>(i/(points.length-1||1))*(W-P*2)+P;
  const toY=v=>H-P-((v-mn)/range)*(H-P*2);
  const pathD=points.map((p,i)=>`${i===0?"M":"L"}${toX(i)},${toY(p.bal)}`).join(" ");
  const step=Math.ceil(points.length/5);
  return (
    <div style={{overflowX:"auto"}}>
      <svg width={W} height={H+24} style={{display:"block",margin:"0 auto"}}>
        <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#B4FF00" stopOpacity="0.3"/><stop offset="100%" stopColor="#B4FF00" stopOpacity="0"/></linearGradient></defs>
        <path d={pathD+` L${toX(points.length-1)},${H} L${toX(0)},${H} Z`} fill="url(#lg)"/>
        <path d={pathD} fill="none" stroke="#B4FF00" strokeWidth="2" strokeLinejoin="round"/>
        {points.map((p,i)=><circle key={i} cx={toX(i)} cy={toY(p.bal)} r="2" fill="#B4FF00"/>)}
        {points.filter((_,i)=>i%step===0||i===points.length-1).map((p,i)=>(
          <text key={i} x={toX(points.indexOf(p))} y={H+16} textAnchor="middle" fontSize="8" fill={T.sub}>{p.label}</text>
        ))}
      </svg>
    </div>
  );
}

// ─── ENVELOPE PROGRESS BAR ────────────────────────────────────────────────────
function EnvBar({ env, balance, maxBalance }) {
  const pct = maxBalance > 0 ? Math.min(100, Math.round((balance / maxBalance) * 100)) : 0;
  const barColor = pct > 50 ? env.color : pct > 20 ? "#B4FF00" : "#F87171";
  return (
    <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px"}}>
      <div style={{width:42,height:42,borderRadius:13,background:env.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <div style={{width:14,height:14,borderRadius:"50%",background:env.color}}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
          <span style={{fontSize:14,fontWeight:600,color:T.text}}>{env.label}</span>
          <span style={{fontSize:13,fontWeight:800,color:env.color}}>{fmt(balance)}</span>
        </div>
        <div style={{height:5,background:T.muted,borderRadius:4,overflow:"hidden"}}>
          <div style={{height:"100%",width:pct+"%",background:barColor,borderRadius:4,transition:"width .4s ease"}}/>
        </div>
        <div style={{fontSize:10,color:T.sub,marginTop:3}}>{pct}% restant</div>
      </div>
    </div>
  );
}

// ─── TX ROW ───────────────────────────────────────────────────────────────────
function TxRow({ tx, onDelete, subcats, envelopes, incomeRules, last }) {
  const [open,setOpen]=useState(false);
  const isInc=tx.type==="income";
  const sc=subcats.find(s=>s.id===tx.subcatId);
  const env=envelopes.find(e=>e.id===sc?.envelopeId);
  const rule=incomeRules[tx.incomeType];
  return (
    <div>
      <div onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",cursor:"pointer",borderBottom:(!last||open)?`1px solid ${T.border}`:"none"}}>
        <div style={{width:42,height:42,borderRadius:13,background:isInc?"#061510":(env?.bg||"#0A0D12"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
          {isInc?rule?.icon:"💸"}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {tx.label||(isInc?rule?.label:sc?.label||"Dépense")}
          </div>
          <div style={{fontSize:12,color:T.sub,display:"flex",gap:6,alignItems:"center"}}>
            {!isInc&&env&&<span style={{color:env.color,fontSize:8}}>●</span>}
            {!isInc&&<span>{sc?.label}</span>}
            <span>{fmtD(tx.date)}</span>
            {tx.recur&&tx.recur!=="none"&&<span style={{color:"#B4FF00"}}>🔄</span>}
          </div>
        </div>
        <div style={{fontSize:15,fontWeight:800,color:isInc?"#B4FF00":"#F87171",flexShrink:0,fontFamily:"monospace"}}>{isInc?"+":"−"}{fmt(tx.amount)}</div>
      </div>
      {open&&(
        <div style={{background:"#040806",padding:"10px 16px",borderBottom:`1px solid ${T.border}`}}>
          {tx.note&&<div style={{fontSize:12,color:T.sub,marginBottom:6}}>📝 {tx.note}</div>}
          {isInc&&rule&&<div style={{fontSize:12,marginBottom:6}}>{Object.entries(rule.split).filter(([,p])=>p>0).map(([k,p])=>{ const e=envelopes.find(x=>x.id===k); return <span key={k} style={{marginRight:8,color:e?.color}}>{e?.label} {fmt(tx.amount*p/100)}</span>; })}</div>}
          {tx.recur&&tx.recur!=="none"&&<div style={{fontSize:12,color:"#B4FF00",marginBottom:6}}>🔄 {RECUR_OPTIONS.find(r=>r.id===tx.recur)?.label}</div>}
          <button onClick={()=>onDelete(tx.id)} style={{fontSize:12,color:"#F87171",background:"none",border:"none",cursor:"pointer",padding:0,fontWeight:700}}>🗑 Supprimer</button>
        </div>
      )}
    </div>
  );
}

// ─── SPLIT EDITOR ─────────────────────────────────────────────────────────────
function SplitEditor({ ruleKey, rule, envelopes, setIncomeRules }) {
  const [splits,setSplits]=useState({...rule.split});
  const total=Object.values(splits).reduce((a,v)=>a+(parseFloat(v)||0),0);
  const valid=Math.round(total)===100;
  function apply(){ if(!valid) return; setIncomeRules(r=>({...r,[ruleKey]:{...r[ruleKey],split:Object.fromEntries(Object.entries(splits).map(([k,v])=>[k,parseFloat(v)||0]))}})); }
  return (
    <div style={{background:"#060E08",borderRadius:12,padding:"12px 14px",border:`1px solid ${T.border}`,marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span>{rule.icon}</span>
        <span style={{fontSize:13,fontWeight:700,color:rule.color}}>{rule.label}</span>
        <span style={{marginLeft:"auto",fontSize:12,fontWeight:700,color:valid?"#34D399":"#F87171"}}>{Math.round(total)}% / 100%</span>
      </div>
      {envelopes.map(env=>(
        <div key={env.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:env.color,flexShrink:0}}/>
          <span style={{fontSize:12,color:T.text,flex:1}}>{env.label}</span>
          <input type="number" min="0" max="100" value={splits[env.id]??0} onChange={e=>setSplits(s=>({...s,[env.id]:e.target.value}))}
            style={{width:52,padding:"4px 8px",borderRadius:8,border:`1px solid ${T.border}`,background:"#040806",color:T.text,fontSize:13,fontWeight:700,outline:"none",textAlign:"center"}}/>
          <span style={{fontSize:12,color:T.sub}}>%</span>
        </div>
      ))}
      <button onClick={apply} disabled={!valid} style={{width:"100%",padding:"8px 0",borderRadius:10,border:"none",background:valid?"#B4FF00":T.muted,color:valid?"#fff":T.sub,fontSize:13,fontWeight:700,cursor:valid?"pointer":"not-allowed",marginTop:4}}>
        {valid?"✓ Appliquer":"Total doit être 100%"}
      </button>
    </div>
  );
}

// ─── SINKING FUND CARD ────────────────────────────────────────────────────────
function SinkingCard({ fund, onDelete, onAdd, tresorerie, totalAlloue }) {
  const [addAmt,setAddAmt]=useState("");
  const pct=Math.min(100,Math.round((fund.current/fund.goal)*100));
  const remaining=fund.goal-fund.current;
  const monthsLeft=fund.monthly>0?Math.ceil(remaining/fund.monthly):null;
  // Disponible = trésorerie totale - déjà alloué dans tous les SF
  const sfDisponible = Math.max(0, tresorerie - totalAlloue);
  const inputAmt = parseFloat(addAmt)||0;
  // Validation: versement ne peut pas dépasser (sfDisponible + ce qui est déjà dans ce fund)
  // i.e. on ne peut pas verser plus que ce qui est libre dans la trésorerie
  const canAdd = inputAmt > 0 && inputAmt <= sfDisponible && inputAmt <= (fund.goal - fund.current);
  const errMsg = inputAmt > sfDisponible
    ? `Max disponible : ${fmt(sfDisponible)}`
    : inputAmt > (fund.goal - fund.current)
    ? `Dépasse l'objectif`
    : null;

  return (
    <div style={{background:"#080F09",borderRadius:14,padding:"14px 16px",border:`1px solid ${T.border}`,marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:T.text}}>{fund.icon} {fund.label}</div>
          {monthsLeft&&pct<100&&<div style={{fontSize:11,color:T.sub,marginTop:2}}>~{monthsLeft} mois restants</div>}
        </div>
        <button onClick={()=>onDelete(fund.id)} style={{background:"none",border:"none",color:"#F87171",cursor:"pointer",fontSize:16,padding:0}}>×</button>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:13,fontWeight:800,color:"#B4FF00"}}>{fmt(fund.current)}</span>
        <span style={{fontSize:12,color:T.sub}}>/ {fmt(fund.goal)}</span>
      </div>
      <div style={{height:6,background:T.muted,borderRadius:4,marginBottom:4,overflow:"hidden"}}>
        <div style={{height:"100%",width:pct+"%",background:pct>=100?"#5FD34A":"#B4FF00",borderRadius:4,transition:"width .4s"}}/>
      </div>
      <div style={{fontSize:11,color:T.sub,marginBottom:pct<100?10:0}}>{pct}% atteint{pct>=100?" ✅":""}</div>
      {pct<100&&(
        <>
          <div style={{display:"flex",gap:6,marginBottom:errMsg?4:0}}>
            <input
              value={addAmt}
              onChange={e=>setAddAmt(e.target.value)}
              type="number"
              placeholder={sfDisponible>0?`Max ${fmt(sfDisponible)}`:"Trésorerie épuisée"}
              disabled={sfDisponible<=0}
              style={{flex:1,padding:"7px 10px",borderRadius:9,border:`1px solid ${errMsg?"#F87171":canAdd?"#B4FF00":T.border}`,background:"#040806",color:sfDisponible>0?T.text:T.sub,fontSize:13,outline:"none"}}
            />
            <button
              onClick={()=>{ if(!canAdd) return; onAdd(fund.id,inputAmt); setAddAmt(""); }}
              disabled={!canAdd}
              style={{padding:"7px 14px",borderRadius:9,border:"none",background:canAdd?"#B4FF00":T.muted,color:canAdd?"#050607":T.sub,fontSize:12,fontWeight:700,cursor:canAdd?"pointer":"not-allowed",transition:"all .15s"}}
            >+</button>
          </div>
          {errMsg&&<div style={{fontSize:11,color:"#F87171",marginBottom:6}}>{errMsg}</div>}
        </>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const isDesktop = useIsDesktop();

  // ── Profile system ──────────────────────────────────────────────────────────
  const [profiles,setProfiles]  = useState(()=>load("sf_profiles",DEFAULT_PROFILES));
  const [activeId,setActiveId]  = useState(()=>load("sf_active","default"));
  const [showProfiles,setShowP] = useState(false);
  const [newPName,setNPN]       = useState("");

  const pid = activeId; // shorthand
  const activeProfile = profiles.find(p=>p.id===pid)||profiles[0];

  // ── Per-profile state (reloaded when profile switches) ──────────────────────
  const [tab,setTab]           = useState("home");
  const [txs,setTxs]           = useState(()=>pload(pid,"txs",[]));
  const [bal,setBal]           = useState(()=>pload(pid,"bal",{survie:0,tresorerie:0,operationnel:0,differable:0}));
  const [envelopes,setEnv]     = useState(()=>{
    const envs = pload(pid,"env",DEFAULT_ENVELOPES);
    const TRES = { id:"tresorerie", label:"Trésorerie", color:"#B4FF00", bg:"#141005", system:true };
    // Re-inject tresorerie if it was deleted, always enforce system flag
    const hasTres = envs.some(e=>e.id==="tresorerie");
    const restored = hasTres ? envs : [TRES, ...envs];
    return restored.map(e=>e.id==="tresorerie"?{...e,system:true}:e);
  });
  const [subcats,setSub]       = useState(()=>pload(pid,"sub",DEFAULT_SUBCATS));
  const [incomeRules,setIR]    = useState(()=>pload(pid,"ir",DEFAULT_INCOME_RULES));
  const [envMax,setEnvMax]     = useState(()=>pload(pid,"max",{}));
  const [sinkFunds,setSF]      = useState(()=>pload(pid,"sinks",[]));

  // Add form
  const [addMode,setAddMode]   = useState("expense");
  const [amount,setAmount]     = useState("");
  const [incomeType,setIT]     = useState("prestation");
  const [subcatId,setScId]     = useState(DEFAULT_SUBCATS[0].id);
  const [label,setLabel]       = useState("");
  const [note,setNote]         = useState("");
  const [showNote,setShowNote] = useState(false);
  const [recur,setRecur]       = useState("none");
  const [txDate,setTxDate]     = useState(new Date().toISOString().slice(0,10));

  // Category manager
  const [newEnvLabel,setNEL]   = useState("");
  const [newEnvColor,setNEC]   = useState("#B4FF00");
  const [newScLabel,setNSL]    = useState("");
  const [newScEnv,setNSE]      = useState("");
  const [editingEnv,setEEv]    = useState(null);
  const [editingLabel,setEL]   = useState("");
  const [editingColor,setEC]   = useState(null); // id of env being color-edited
  const [showReset,setShowReset] = useState(false);
  const [importMsg,setImportMsg] = useState("");
  const [showBackup,setShowBackup] = useState(false);
  const [catTab,setCatTab]     = useState("envelopes");

  // History filters
  const [hPeriod,setHPeriod]   = useState("all");
  const [hDateFrom,setHDF]     = useState("");
  const [hDateTo,setHDT]       = useState("");
  const [hType,setHType]       = useState("all");
  const [hEnv,setHEnv]         = useState("all");
  const [hSubcat,setHSC]       = useState("all");
  const [chartPeriod,setCP]    = useState("month");

  // New sinking fund form
  const [sfLabel,setSFL]       = useState("");
  const [sfIcon,setSFI]        = useState("🎯");
  const [sfGoal,setSFG]        = useState("");
  const [sfMonthly,setSFM]     = useState("");

  // New income rule form
  const [newIRLabel,setNIRL]   = useState("");
  const [newIRIcon,setNIRI]    = useState("💰");
  const [newIRSplit,setNIRS]   = useState(()=>Object.fromEntries(DEFAULT_ENVELOPES.map(e=>[e.id,0])));

  // Recurring expenses
  const [recurExp,setRE]       = useState(()=>pload(pid,"re",[]));
  const [reLabel,setREL]       = useState("");
  const [reAmt,setREA]         = useState("");
  const [rePeriod,setREP]      = useState("monthly");
  const [reScId,setRESC]       = useState("");
  const [reNextDate,setREND]   = useState(new Date().toISOString().slice(0,10));

  // Save profiles list + active
  useEffect(()=>{ save("sf_profiles",profiles); },[profiles]);
  useEffect(()=>{ save("sf_active",activeId); },[activeId]);

  // Save per-profile data
  useEffect(()=>{ psave(pid,"txs",txs); },[txs,pid]);
  useEffect(()=>{ psave(pid,"bal",bal); },[bal,pid]);
  useEffect(()=>{ psave(pid,"env",envelopes); },[envelopes,pid]);
  useEffect(()=>{ psave(pid,"sub",subcats); },[subcats,pid]);
  useEffect(()=>{ psave(pid,"ir",incomeRules); },[incomeRules,pid]);
  useEffect(()=>{ psave(pid,"max",envMax); },[envMax,pid]);
  useEffect(()=>{ psave(pid,"sinks",sinkFunds); },[sinkFunds,pid]);
  useEffect(()=>{ psave(pid,"re",recurExp); },[recurExp,pid]);

  // When profile switches — reload all data for new profile
  function switchProfile(id) {
    setActiveId(id);
    setTab("home");
    setShowP(false);
    setTxs(pload(id,"txs",[]));
    setBal(pload(id,"bal",{survie:0,tresorerie:0,operationnel:0,differable:0}));
    const _envs = pload(id,"env",DEFAULT_ENVELOPES);
    const _TRES = { id:"tresorerie", label:"Trésorerie", color:"#B4FF00", bg:"#141005", system:true };
    const _hasTres = _envs.some(e=>e.id==="tresorerie");
    const _restored = _hasTres ? _envs : [_TRES,..._envs];
    setEnv(_restored.map(e=>e.id==="tresorerie"?{...e,system:true}:e));
    setSub(pload(id,"sub",DEFAULT_SUBCATS));
    setIR(pload(id,"ir",DEFAULT_INCOME_RULES));
    setEnvMax(pload(id,"max",{}));
    setSF(pload(id,"sinks",[]));
    setRE(pload(id,"re",[]));
    setAmount(""); setLabel(""); setNote("");
  }

  // Always protect system envelopes
  const TRES_DEFAULT = { id:"tresorerie", label:"Trésorerie", color:"#B4FF00", bg:"#141005", system:true };
  function safeSetEnv(updater) {
    setEnv(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      // Re-inject tresorerie if missing, always enforce system flag
      const hasTres = next.some(e=>e.id==="tresorerie");
      const restored = hasTres ? next : [TRES_DEFAULT,...next];
      return restored.map(e=>e.id==="tresorerie"?{...e,system:true}:e);
    });
  }

  function resetProfile() {
    const TRES = { id:"tresorerie", label:"Trésorerie", color:"#B4FF00", bg:"#141005", system:true };
    setBal({survie:0,tresorerie:0,operationnel:0,differable:0});
    safeSetEnv(DEFAULT_ENVELOPES);
    setSub(DEFAULT_SUBCATS);
    setIR(DEFAULT_INCOME_RULES);
    setEnvMax({});
    setSF([]);
    setRE([]);
    setTxs([]);
    setShowReset(false);
  }

  // ── EXPORT / IMPORT — per profile backup (works for ANY profile, not just active) ──
  function exportProfileById(profileId, profileName) {
    const data = {
      app: "spec-finance",
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: { id: profileId, name: profileName },
      data: {
        txs:    pload(profileId,"txs",[]),
        bal:    pload(profileId,"bal",{survie:0,tresorerie:0,operationnel:0,differable:0}),
        env:    pload(profileId,"env",DEFAULT_ENVELOPES),
        sub:    pload(profileId,"sub",DEFAULT_SUBCATS),
        ir:     pload(profileId,"ir",DEFAULT_INCOME_RULES),
        max:    pload(profileId,"max",{}),
        sinks:  pload(profileId,"sinks",[]),
        re:     pload(profileId,"re",[]),
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = profileName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    a.href = url;
    a.download = `spec-finance-${safeName}-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importProfileById(profileId, file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.data) { setImportMsg("Fichier invalide."); return; }
        const d = parsed.data;
        const TRES = { id:"tresorerie", label:"Trésorerie", color:"#B4FF00", bg:"#141005", system:true };
        let envs = d.env || DEFAULT_ENVELOPES;
        if (!envs.some(x=>x.id==="tresorerie")) envs = [TRES, ...envs];
        envs = envs.map(x=>x.id==="tresorerie"?{...x,system:true}:x);

        // Save directly to that profile's storage
        psave(profileId,"txs", d.txs || []);
        psave(profileId,"bal", d.bal || {survie:0,tresorerie:0,operationnel:0,differable:0});
        psave(profileId,"env", envs);
        psave(profileId,"sub", d.sub || DEFAULT_SUBCATS);
        psave(profileId,"ir",  d.ir || DEFAULT_INCOME_RULES);
        psave(profileId,"max", d.max || {});
        psave(profileId,"sinks", d.sinks || []);
        psave(profileId,"re",  d.re || []);

        // If importing into the currently active profile, refresh in-memory state too
        if (profileId === activeId) {
          setTxs(d.txs || []);
          setBal(d.bal || {survie:0,tresorerie:0,operationnel:0,differable:0});
          setEnv(envs);
          setSub(d.sub || DEFAULT_SUBCATS);
          setIR(d.ir || DEFAULT_INCOME_RULES);
          setEnvMax(d.max || {});
          setSF(d.sinks || []);
          setRE(d.re || []);
        }
        setImportMsg("✓ Importé avec succès.");
        setTimeout(()=>setImportMsg(""), 3000);
      } catch (err) {
        setImportMsg("Erreur de lecture du fichier.");
      }
    };
    reader.readAsText(file);
  }

  function createProfile() {
    if(!newPName.trim()) return;
    const np = makeDefaultProfile(newPName.trim());
    setProfiles(p=>[...p,np]);
    setNPN("");
    switchProfile(np.id);
  }

  function deleteProfile(id) {
    if(profiles.length<=1) return;
    const remaining = profiles.filter(p=>p.id!==id);
    setProfiles(remaining);
    if(activeId===id) switchProfile(remaining[0].id);
  }

  // Calculate disponible from all non-system envelopes, defaulting missing keys to 0
  const disponible = envelopes
    .filter(e=>!e.system)
    .reduce((a,e)=>a+(bal[e.id]||0), 0);
  const amt = parseFloat(amount)||0;

  let sColor="#34D399",sBg="#061510",sMsg="✅ Situation stable";
  if(disponible<=SEUILS.blocage){sColor="#F87171";sBg="#1A0808";sMsg="🔴 Blocage — Survie uniquement";}
  else if(disponible<=SEUILS.alerte){sColor="#B4FF00";sBg="#141005";sMsg="🟡 Alerte — Relancer un client";}

  function submit() {
    if(!amt) return;
    const tx={ id:uid(), date:new Date(txDate).toISOString(), type:addMode, amount:amt, label, note, incomeType, subcatId, recur };
    const nb={...bal}, nm={...envMax};
    if(addMode==="income"){
      const rule=incomeRules[incomeType];
      Object.entries(rule.split).forEach(([k,p])=>{
        if(p){
          nb[k]=(nb[k]||0)+amt*p/100;
          // RESET: new max = new balance after income
          nm[k]=nb[k];
        }
      });
    } else {
      const sc=subcats.find(s=>s.id===subcatId);
      if(sc?.envelopeId) nb[sc.envelopeId]=Math.max(0,(nb[sc.envelopeId]||0)-amt);
    }
    setBal(nb); setEnvMax(nm); setTxs([tx,...txs]);
    setAmount(""); setLabel(""); setNote(""); setShowNote(false); setRecur("none");
    setTxDate(new Date().toISOString().slice(0,10)); setTab("home");
  }

  function recalcBal(remainingTxs) {
    // Start from zero, replay all transactions
    const nb = {};
    envelopes.forEach(e => nb[e.id] = 0);
    const nm = {};
    remainingTxs.forEach(tx => {
      if(tx.type==="income") {
        const rule = incomeRules[tx.incomeType];
        if(rule) Object.entries(rule.split).forEach(([k,p]) => {
          if(p) {
            nb[k] = (nb[k]||0) + tx.amount*p/100;
            // track max per envelope
            if((nb[k]||0) > (nm[k]||0)) nm[k] = nb[k];
          }
        });
      } else {
        const sc = subcats.find(s=>s.id===tx.subcatId);
        if(sc?.envelopeId) nb[sc.envelopeId] = Math.max(0,(nb[sc.envelopeId]||0) - tx.amount);
      }
    });
    // Keep sinking funds deducted from tresorerie
    const sfTotal = sinkFunds.reduce((a,f)=>a+f.current, 0);
    nb.tresorerie = Math.max(0, (nb.tresorerie||0) - sfTotal);
    setBal(nb);
    setEnvMax(nm);
  }

  function deleteTx(txId) {
    const remaining = txs.filter(t=>t.id!==txId);
    setTxs(remaining);
    recalcBal(remaining);
  }

  function addSinkingFund() {
    if(!sfLabel.trim()||!parseFloat(sfGoal)) return;
    setSF([...sinkFunds,{ id:uid(), label:sfLabel.trim(), icon:sfIcon, goal:parseFloat(sfGoal), current:0, monthly:parseFloat(sfMonthly)||0 }]);
    setSFL(""); setSFG(""); setSFM(""); setSFI("🎯");
  }
  function addToSink(sfId, amount) {
    const totalAlloue = sinkFunds.reduce((a,f)=>a+f.current, 0);
    const sfDisponible = Math.max(0, (bal.tresorerie||0) - totalAlloue);
    if(amount > sfDisponible) return;
    setSF(sinkFunds.map(f=>f.id===sfId?{...f,current:Math.min(f.goal,f.current+amount)}:f));
    setBal(b=>({...b,tresorerie:Math.max(0,(b.tresorerie||0)-amount)}));
  }
  function deleteSink(sfId) {
    const f=sinkFunds.find(x=>x.id===sfId);
    if(f) setBal(b=>({...b,tresorerie:Math.max(0,(b.tresorerie||0)+f.current)})); // refund to tresorerie
    setSF(sinkFunds.filter(x=>x.id!==sfId));
  }

  // Recurring expenses functions
  function addRecurExp() {
    const a = parseFloat(reAmt);
    if(!reLabel.trim()||!a||!reScId) return;
    setRE(r=>[...r,{ id:uid(), label:reLabel.trim(), amount:a, period:rePeriod, subcatId:reScId, nextDate:reNextDate, active:true }]);
    setREL(""); setREA(""); setRESC(""); setREND(new Date().toISOString().slice(0,10));
  }
  function deleteRecurExp(id) { setRE(r=>r.filter(x=>x.id!==id)); }
  function toggleRecurExp(id) { setRE(r=>r.map(x=>x.id===id?{...x,active:!x.active}:x)); }
  function payRecurExp(re) {
    // Apply as a regular expense transaction
    const tx={ id:uid(), date:new Date().toISOString(), type:"expense", amount:re.amount, label:re.label, note:"Récurrent", incomeType:"", subcatId:re.subcatId, recur:re.period };
    const sc=subcats.find(s=>s.id===re.subcatId);
    const nb={...bal};
    if(sc?.envelopeId) nb[sc.envelopeId]=Math.max(0,(nb[sc.envelopeId]||0)-re.amount);
    setBal(nb); setTxs(t=>[tx,...t]);
    // Advance next date
    const next=new Date(re.nextDate);
    if(re.period==="weekly") next.setDate(next.getDate()+7);
    else if(re.period==="monthly") next.setMonth(next.getMonth()+1);
    else if(re.period==="yearly") next.setFullYear(next.getFullYear()+1);
    setRE(r=>r.map(x=>x.id===re.id?{...x,nextDate:next.toISOString().slice(0,10)}:x));
  }

  // Days until next payment
  function daysUntil(dateStr) {
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff/(1000*60*60*24));
  }

  // History filter
  const filteredTxs = useMemo(()=>{
    const now=new Date();
    return txs.filter(tx=>{
      const d=new Date(tx.date);
      if(hType!=="all"&&tx.type!==hType) return false;
      // Specific date range
      if(hDateFrom){ const df=new Date(hDateFrom); df.setHours(0,0,0,0); if(d<df) return false; }
      if(hDateTo){ const dt=new Date(hDateTo); dt.setHours(23,59,59,999); if(d>dt) return false; }
      // Period presets (only if no custom date set)
      if(!hDateFrom&&!hDateTo){
        if(hPeriod==="day"){ if(d.toDateString()!==now.toDateString()) return false; }
        else if(hPeriod==="week"){ const w=new Date(now); w.setDate(w.getDate()-7); if(d<w) return false; }
        else if(hPeriod==="month"){ if(d.getMonth()!==now.getMonth()||d.getFullYear()!==now.getFullYear()) return false; }
        else if(hPeriod==="year"){ if(d.getFullYear()!==now.getFullYear()) return false; }
      }
      if(hEnv!=="all"&&tx.type==="expense"){ const sc=subcats.find(s=>s.id===tx.subcatId); if(sc?.envelopeId!==hEnv) return false; }
      if(hSubcat!=="all"&&tx.type==="expense"&&tx.subcatId!==hSubcat) return false;
      return true;
    });
  },[txs,hPeriod,hDateFrom,hDateTo,hType,hEnv,hSubcat,subcats]);

  const grouped=filteredTxs.reduce((acc,tx)=>{ const d=new Date(tx.date).toDateString(); if(!acc[d]) acc[d]=[]; acc[d].push(tx); return acc; },{});

  function pressKey(k) {
    if(k==="⌫"){ setAmount(a=>a.slice(0,-1)||""); return; }
    if(k==="."&&amount.includes(".")) return;
    if(amount.length>=10) return;
    setAmount(a=>a+k);
  }

  const inp={ width:"100%",padding:"10px 14px",borderRadius:12,border:`1px solid ${T.border}`,fontSize:14,color:T.text,background:T.card2,boxSizing:"border-box",outline:"none" };

  function SplitPreview() {
    if(!amt) return null;
    const rule=incomeRules[incomeType];
    return (
      <div style={{background:T.card2,borderRadius:12,padding:"12px 14px",border:`1px solid ${T.border}`}}>
        <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:10}}>RÉPARTITION AUTOMATIQUE</div>
        {Object.entries(rule.split).map(([key,pct])=>{
          if(!pct) return null;
          const env=envelopes.find(e=>e.id===key); if(!env) return null;
          return (
            <div key={key} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,color:"#CBD5E1",fontWeight:600}}>● <span style={{color:env.color}}>{env.label}</span> {pct}%</span>
                <span style={{fontSize:12,fontWeight:800,color:env.color}}>{fmt(amt*pct/100)}</span>
              </div>
              <div style={{height:3,background:T.muted,borderRadius:4}}><div style={{height:"100%",width:pct+"%",background:env.color,borderRadius:4}}/></div>
            </div>
          );
        })}
      </div>
    );
  }

  // Subcats filtered by selected envelope for history
  const filteredSubcats = hEnv==="all" ? subcats : subcats.filter(s=>s.envelopeId===hEnv);

  return (
    <div style={{fontFamily:"'SF Pro Display','Space Grotesk',-apple-system,sans-serif",background:T.bg,minHeight:"100vh",color:T.text,display:"flex"}}>

      {/* ══ DESKTOP SIDEBAR ═══════════════════════════════════════════════════ */}
      {isDesktop && (
        <div style={{width:220,flexShrink:0,height:"100vh",position:"sticky",top:0,background:"#060E08",borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",padding:"28px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:32,padding:"0 8px"}}>
            <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#B4FF00,#5FD34A)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#020303",flexShrink:0}}>SF</div>
            <div style={{fontSize:15,fontWeight:800,color:T.text}}>Spec Finance</div>
          </div>

          {NAV_ITEMS.filter(t=>!t.big).map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              display:"flex",alignItems:"center",gap:12,padding:"11px 12px",borderRadius:12,border:"none",cursor:"pointer",
              background:tab===t.id?"#0B1A12":"transparent",color:tab===t.id?"#B4FF00":T.sub,marginBottom:4,position:"relative",
              fontSize:14,fontWeight:tab===t.id?700:500,textAlign:"left",
            }}>
              {t.svg(tab===t.id?"#B4FF00":T.sub)}
              {t.label}
              {t.id==="recurring"&&recurExp.some(r=>r.active&&daysUntil(r.nextDate)<=3)&&(
                <span style={{position:"absolute",top:8,right:10,width:6,height:6,borderRadius:"50%",background:"#F87171"}}/>
              )}
            </button>
          ))}

          <button onClick={()=>setTab("add")} style={{marginTop:16,padding:"12px 0",borderRadius:12,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#B4FF00,#5FD34A)",color:"#020303",fontSize:14,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#020303" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ajouter
          </button>

          <div style={{flex:1}}/>

          <button onClick={()=>setShowP(true)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,border:`1px solid ${T.border}`,background:"#040806",cursor:"pointer",color:T.text}}>
            <div style={{width:26,height:26,borderRadius:8,background:"#B4FF00",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#020303",flexShrink:0}}>{activeProfile.name[0].toUpperCase()}</div>
            <span style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeProfile.name}</span>
          </button>
        </div>
      )}

      {/* ══ MAIN CONTENT AREA ═════════════════════════════════════════════════ */}
      <div style={{flex:1,maxWidth:isDesktop?720:430,margin:isDesktop?"0 auto":"0 auto",width:"100%",display:"flex",flexDirection:"column",minHeight:"100vh"}}>

      {/* ══ HOME ══════════════════════════════════════════════════════════════ */}
      {/* ══ PROFILE SWITCHER OVERLAY ═════════════════════════════════════════ */}
      {showProfiles&&(
        <div style={{position:"fixed",inset:0,background:"rgba(2,3,3,0.95)",zIndex:200,display:"flex",flexDirection:"column",maxWidth:430,margin:"0 auto"}}>
          <div style={{padding:"52px 20px 20px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{fontSize:22,fontWeight:800,color:T.text}}>Profils</div>
              <button onClick={()=>setShowP(false)} style={{background:"none",border:"none",color:T.sub,fontSize:24,cursor:"pointer",padding:0}}>×</button>
            </div>
            <div style={{fontSize:12,color:T.sub}}>Chaque profil a ses propres données</div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
            {profiles.map(p=>(
              <div key={p.id}>
                <div onClick={()=>switchProfile(p.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",background:activeId===p.id?"#0A1A0C":T.card,borderRadius:14,marginBottom:4,border:`1.5px solid ${activeId===p.id?"#B4FF00":T.border}`,cursor:"pointer"}}>
                  <div style={{width:40,height:40,borderRadius:12,background:activeId===p.id?"#B4FF00":"#0F2415",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                    <span style={{fontSize:16,fontWeight:800,color:activeId===p.id?"#020303":"#B4FF00"}}>{p.name[0].toUpperCase()}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,color:activeId===p.id?"#B4FF00":T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                    <div style={{fontSize:11,color:T.sub}}>{activeId===p.id?"Actif":"Appuyer pour switcher"}</div>
                  </div>
                  {activeId===p.id&&<span style={{color:"#B4FF00",fontSize:18,flexShrink:0}}>✓</span>}

                  {/* Export icon */}
                  <button onClick={e=>{e.stopPropagation();exportProfileById(p.id,p.name);}} title="Exporter" style={{background:"none",border:"none",color:T.sub,cursor:"pointer",padding:6,flexShrink:0,display:"flex"}}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </button>

                  {/* Import icon */}
                  <label onClick={e=>e.stopPropagation()} title="Importer" style={{background:"none",border:"none",color:T.sub,cursor:"pointer",padding:6,flexShrink:0,display:"flex"}}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <input type="file" accept="application/json" style={{display:"none"}} onChange={e=>{ if(e.target.files[0]) importProfileById(p.id,e.target.files[0]); e.target.value=""; }}/>
                  </label>

                  {profiles.length>1&&activeId!==p.id&&(
                    <button onClick={e=>{e.stopPropagation();deleteProfile(p.id);}} style={{background:"none",border:"none",color:"#F87171",fontSize:18,cursor:"pointer",padding:"0 2px",flexShrink:0}}>×</button>
                  )}
                </div>
                {importMsg&&p.id===activeId&&(
                  <div style={{fontSize:11,color:importMsg.startsWith("✓")?"#B4FF00":"#F87171",marginBottom:10,paddingLeft:4,fontWeight:600}}>{importMsg}</div>
                )}
              </div>
            ))}

            <div style={{background:T.card,borderRadius:14,padding:"14px 16px",border:`1px solid ${T.border}`,marginTop:8}}>
              <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:10}}>NOUVEAU PROFIL</div>
              <div style={{display:"flex",gap:8}}>
                <input value={newPName} onChange={e=>setNPN(e.target.value)} placeholder="Nom du profil (ex: Famille)"
                  style={{flex:1,padding:"10px 12px",borderRadius:10,border:`1px solid ${T.border}`,background:"#040806",color:T.text,fontSize:14,outline:"none"}}
                  onKeyDown={e=>e.key==="Enter"&&createProfile()}/>
                <button onClick={createProfile} style={{padding:"10px 16px",borderRadius:10,border:"none",background:"#B4FF00",color:"#020303",fontSize:14,fontWeight:800,cursor:"pointer"}}>+</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==="home"&&(
        <div style={{flex:1,overflowY:"auto",paddingBottom:90}}>
          <div style={{background:"linear-gradient(160deg,#060E08,#020303)",padding:"52px 20px 24px",borderBottom:`1px solid ${T.border}`}}>
            {/* Profile switcher button */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <button onClick={()=>setShowP(true)} style={{display:"flex",alignItems:"center",gap:8,background:"#0A1A0C",border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 12px 5px 6px",cursor:"pointer"}}>
                <div style={{width:24,height:24,borderRadius:8,background:"#B4FF00",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:12,fontWeight:800,color:"#020303"}}>{activeProfile?.name[0].toUpperCase()}</span>
                </div>
                <span style={{fontSize:13,fontWeight:700,color:T.text}}>{activeProfile?.name}</span>
                <span style={{fontSize:11,color:T.sub}}>▾</span>
              </button>
              <div style={{fontSize:11,color:T.sub,letterSpacing:1}}>{profiles.length} profil{profiles.length>1?"s":""}</div>
            </div>
            <div style={{fontSize:11,color:T.sub,letterSpacing:2,fontWeight:700,marginBottom:6}}>SOLDE DISPONIBLE</div>
            <div style={{fontSize:46,fontWeight:900,letterSpacing:-2,lineHeight:1,marginBottom:6,color:disponible<=SEUILS.blocage?"#F87171":disponible<=SEUILS.alerte?"#B4FF00":T.text}}>{fmt(disponible)}</div>
            <div style={{fontSize:13,color:T.sub}}>Trésorerie : <span style={{color:"#B4FF00",fontWeight:700}}>{fmt(bal.tresorerie||0)}</span></div>
          </div>
          <div style={{padding:"16px 16px 0"}}>
            {disponible<=SEUILS.alerte&&(
              <div style={{background:sBg,border:`1px solid ${sColor}40`,borderRadius:12,padding:"10px 14px",marginBottom:16}}>
                <div style={{fontSize:13,color:sColor,fontWeight:700}}>{sMsg}</div>
                <div style={{fontSize:12,color:sColor+"AA"}}>Seuil : {fmt(disponible<=SEUILS.blocage?SEUILS.blocage:SEUILS.alerte)}</div>
              </div>
            )}

            {/* Chart */}
            <div style={{background:"#060E08",borderRadius:16,padding:"16px",marginBottom:20,border:`1px solid ${T.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text}}>Évolution du solde</div>
                <div style={{display:"flex",gap:4}}>
                  {[["week","7j"],["month","30j"],["year","1an"]].map(([id,lbl])=>(
                    <button key={id} onClick={()=>setCP(id)} style={{padding:"4px 8px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:chartPeriod===id?"#B4FF00":"#080F09",color:chartPeriod===id?"#fff":T.sub}}>{lbl}</button>
                  ))}
                </div>
              </div>
              <LineChart txs={txs} filter={chartPeriod}/>
            </div>

            {/* Envelopes with progress bars — trésorerie excluded */}
            <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:8}}>ENVELOPPES</div>
            <div style={{background:"#060E08",borderRadius:16,overflow:"hidden",marginBottom:16,border:`1px solid ${T.border}`}}>
              {envelopes.filter(e=>e.id!=="tresorerie").map((env,i,arr)=>(
                <div key={env.id} style={{borderBottom:i<arr.length-1?`1px solid ${T.border}`:undefined}}>
                  <EnvBar env={env} balance={bal[env.id]||0} maxBalance={envMax[env.id]||bal[env.id]||0}/>
                </div>
              ))}
            </div>

            {/* Trésorerie separate */}
            <div style={{background:T.card,borderRadius:16,padding:"14px 16px",marginBottom:20,border:`1px solid ${T.border}`}}>
              {(()=>{
                const totalAlloue=sinkFunds.reduce((a,f)=>a+f.current,0);
                const sfDispo=Math.max(0,(bal.tresorerie||0)-totalAlloue);
                return (
                  <>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:"#B4FF00"}}>🟡 Trésorerie</div>
                        <div style={{fontSize:11,color:T.sub,marginTop:2}}>Réserve intouchable</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:20,fontWeight:900,color:"#B4FF00"}}>{fmt(bal.tresorerie||0)}</div>
                      </div>
                    </div>
                    {sinkFunds.length>0&&(
                      <div style={{background:"#040806",borderRadius:10,padding:"10px 12px",marginBottom:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        <div>
                          <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1,marginBottom:2}}>ALLOUÉ SF</div>
                          <div style={{fontSize:14,fontWeight:800,color:"#F87171"}}>{fmt(totalAlloue)}</div>
                        </div>
                        <div>
                          <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1,marginBottom:2}}>DISPONIBLE SF</div>
                          <div style={{fontSize:14,fontWeight:800,color:sfDispo>0?"#B4FF00":T.sub}}>{fmt(sfDispo)}</div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
              {/* Sinking funds */}
              {sinkFunds.length>0&&(
                <div style={{marginTop:10}}>
                  <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:8}}>SINKING FUNDS</div>
                  {sinkFunds.map((f,i)=>{
                    const totalAlloue=sinkFunds.reduce((a,x)=>a+x.current,0);
                    return <SinkingCard key={f.id} fund={f} onDelete={deleteSink} onAdd={addToSink} tresorerie={bal.tresorerie||0} totalAlloue={totalAlloue}/>;
                  })}
                </div>
              )}
              <button onClick={()=>setTab("sinking")} style={{width:"100%",marginTop:8,padding:"9px 0",borderRadius:10,border:`1px solid ${T.border}`,background:"none",color:"#B4FF00",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Nouveau Sinking Fund</button>
            </div>

            {/* Recent */}
            {txs.length>0&&(
              <>
                <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:8}}>RÉCENT</div>
                <div style={{background:T.card,borderRadius:16,overflow:"hidden",border:`1px solid ${T.border}`,marginBottom:8}}>
                  {txs.slice(0,3).map((tx,i)=><TxRow key={tx.id} tx={tx} onDelete={deleteTx} subcats={subcats} envelopes={envelopes} incomeRules={incomeRules} last={i===Math.min(2,txs.length-1)}/>)}
                </div>
                {txs.length>3&&<button onClick={()=>setTab("history")} style={{width:"100%",padding:"12px 0",background:"none",border:"none",color:"#B4FF00",fontSize:14,fontWeight:700,cursor:"pointer"}}>Voir tout →</button>}
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ ADD ══════════════════════════════════════════════════════════════ */}
      {tab==="add"&&(
        <div style={{flex:1,overflowY:"auto",paddingBottom:90}}>
          <div style={{background:"#060E08",borderBottom:`1px solid ${T.border}`,padding:"52px 16px 14px"}}>
            <div style={{display:"flex",background:"#040806",borderRadius:12,padding:3,marginBottom:14}}>
              {[["expense","💸 Dépense","#F87171"],["income","💰 Revenu","#34D399"]].map(([m,lbl,c])=>(
                <button key={m} onClick={()=>setAddMode(m)} style={{flex:1,padding:"9px 0",borderRadius:10,border:"none",cursor:"pointer",background:addMode===m?c+"20":"transparent",color:addMode===m?c:T.sub,fontSize:14,fontWeight:700,boxShadow:addMode===m?`inset 0 0 0 1.5px ${c}60`:"none"}}>{lbl}</button>
              ))}
            </div>
            <div style={{textAlign:"center",padding:"6px 0 14px"}}>
              <div style={{fontSize:10,color:T.sub,letterSpacing:2,fontWeight:700,marginBottom:4}}>MONTANT</div>
              <div style={{fontSize:48,fontWeight:900,color:amount?T.text:T.border,letterSpacing:-2,lineHeight:1}}>
                {amount||"0"} <span style={{fontSize:20,color:T.sub,fontWeight:600}}>{CURRENCY}</span>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:2,marginBottom:12}}>
              {["1","2","3","4","5","6","7","8","9",".",0,"⌫"].map((k,i)=>(
                <button key={i} onClick={()=>pressKey(String(k))} style={{padding:"15px 0",fontSize:k==="⌫"?20:22,fontWeight:600,background:k==="⌫"?"#040806":"#080F09",border:`1px solid ${T.border}`,borderRadius:10,cursor:"pointer",color:k==="⌫"?"#F87171":T.text}}>{k}</button>
              ))}
            </div>
            <button onClick={submit} disabled={!amt} style={{width:"100%",padding:"14px 0",borderRadius:14,border:"none",cursor:amt?"pointer":"not-allowed",background:!amt?T.muted:addMode==="income"?"linear-gradient(135deg,#5FD34A,#B4FF00)":"linear-gradient(90deg,#DC2626,#F87171)",color:amt?"#fff":T.sub,fontSize:16,fontWeight:800}}>
              {addMode==="income"?"Enregistrer le revenu":"Enregistrer la dépense"}
            </button>
          </div>
          <div style={{padding:"16px 16px 0"}}>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>DATE</div>
              <input type="date" value={txDate} onChange={e=>setTxDate(e.target.value)} style={{...inp,colorScheme:"dark"}}/>
            </div>
            {addMode==="income"?(
              <>
                <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:8}}>TYPE DE REVENU</div>
                <div style={{display:"flex",gap:6,marginBottom:14}}>
                  {Object.entries(incomeRules).map(([k,r])=>(
                    <button key={k} onClick={()=>setIT(k)} style={{flex:1,padding:"9px 4px",borderRadius:11,border:`1.5px solid ${incomeType===k?r.color:T.border}`,background:incomeType===k?r.color+"18":"#060E08",color:incomeType===k?r.color:T.sub,fontSize:11,fontWeight:700,cursor:"pointer"}}>{r.icon} {r.label}</button>
                  ))}
                </div>
                <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:8}}>RENOUVELLEMENT</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                  {RECUR_OPTIONS.map(ro=>(
                    <button key={ro.id} onClick={()=>setRecur(ro.id)} style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${recur===ro.id?"#B4FF00":T.border}`,background:recur===ro.id?"#B4FF0018":"#060E08",color:recur===ro.id?"#B4FF00":T.sub,fontSize:12,fontWeight:600,cursor:"pointer"}}>{ro.label}</button>
                  ))}
                </div>
                <div style={{marginBottom:14}}><SplitPreview/></div>
              </>
            ):(
              <>
                <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:8}}>CATÉGORIE</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                  {subcats.map(sc=>{ const env=envelopes.find(e=>e.id===sc.envelopeId); const active=subcatId===sc.id; return (
                    <button key={sc.id} onClick={()=>setScId(sc.id)} style={{padding:"7px 13px",borderRadius:20,border:`1.5px solid ${active?env?.color||T.border:T.border}`,background:active?(env?.bg||"#061510"):"#060E08",color:active?(env?.color||T.text):T.sub,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:env?.color||T.sub,display:"inline-block",flexShrink:0}}/>{sc.label}
                    </button>
                  );})}
                </div>
              </>
            )}
            <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Description (optionnel)" style={{...inp,marginBottom:8}}/>
            {!showNote
              ?<button onClick={()=>setShowNote(true)} style={{fontSize:13,color:"#B4FF00",background:"none",border:"none",cursor:"pointer",padding:0,fontWeight:700,marginBottom:16}}>+ Ajouter une note</button>
              :<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note..." style={{...inp,marginBottom:16}}/>
            }
          </div>
        </div>
      )}

      {/* ══ HISTORY ══════════════════════════════════════════════════════════ */}
      {tab==="history"&&(
        <div style={{flex:1,overflowY:"auto",paddingBottom:90}}>
          <div style={{padding:"52px 16px 0"}}>
            <div style={{fontSize:28,fontWeight:800,color:T.text,marginBottom:14}}>Historique</div>

            {/* PÉRIODE PRESET */}
            <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>PÉRIODE</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
              {[["all","Tout"],["day","Jour"],["week","Semaine"],["month","Mois"],["year","Année"]].map(([id,lbl])=>(
                <button key={id} onClick={()=>{ setHPeriod(id); setHDF(""); setHDT(""); }} style={{padding:"5px 11px",borderRadius:20,border:`1px solid ${hPeriod===id&&!hDateFrom&&!hDateTo?"#B4FF00":T.border}`,background:hPeriod===id&&!hDateFrom&&!hDateTo?"#B4FF0022":T.card2,color:hPeriod===id&&!hDateFrom&&!hDateTo?"#B4FF00":T.sub,fontSize:12,fontWeight:600,cursor:"pointer"}}>{lbl}</button>
              ))}
            </div>

            {/* DATE PRÉCISE */}
            <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>DATE PRÉCISE</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              <div>
                <div style={{fontSize:10,color:T.sub,marginBottom:4}}>Du</div>
                <input type="date" value={hDateFrom} onChange={e=>{ setHDF(e.target.value); setHPeriod("all"); }} style={{...inp,padding:"8px 10px",fontSize:12,colorScheme:"dark"}}/>
              </div>
              <div>
                <div style={{fontSize:10,color:T.sub,marginBottom:4}}>Au</div>
                <input type="date" value={hDateTo} onChange={e=>{ setHDT(e.target.value); setHPeriod("all"); }} style={{...inp,padding:"8px 10px",fontSize:12,colorScheme:"dark"}}/>
              </div>
            </div>
            {(hDateFrom||hDateTo)&&(
              <button onClick={()=>{ setHDF(""); setHDT(""); }} style={{fontSize:12,color:"#F87171",background:"none",border:"none",cursor:"pointer",padding:0,fontWeight:600,marginBottom:10}}>× Effacer les dates</button>
            )}

            {/* TYPE */}
            <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>TYPE</div>
            <div style={{display:"flex",gap:5,marginBottom:10}}>
              {[["all","Tous"],["income","Revenus"],["expense","Dépenses"]].map(([id,lbl])=>(
                <button key={id} onClick={()=>setHType(id)} style={{padding:"5px 11px",borderRadius:20,border:`1px solid ${hType===id?"#B4FF00":T.border}`,background:hType===id?"#B4FF0022":T.card2,color:hType===id?"#B4FF00":T.sub,fontSize:12,fontWeight:600,cursor:"pointer"}}>{lbl}</button>
              ))}
            </div>

            {/* ENVELOPPE */}
            <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>ENVELOPPE</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
              <button onClick={()=>{ setHEnv("all"); setHSC("all"); }} style={{padding:"5px 11px",borderRadius:20,border:`1px solid ${hEnv==="all"?"#B4FF00":T.border}`,background:hEnv==="all"?"#B4FF0022":T.card2,color:hEnv==="all"?"#B4FF00":T.sub,fontSize:12,fontWeight:600,cursor:"pointer"}}>Toutes</button>
              {envelopes.map(env=>(
                <button key={env.id} onClick={()=>{ setHEnv(env.id); setHSC("all"); }} style={{padding:"5px 11px",borderRadius:20,border:`1px solid ${hEnv===env.id?env.color:T.border}`,background:hEnv===env.id?env.color+"22":"#060E08",color:hEnv===env.id?env.color:T.sub,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                  <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:env.color,marginRight:5,verticalAlign:"middle"}}/>{env.label}
                </button>
              ))}
            </div>

            {/* SOUS-CATÉGORIE */}
            {hType!=="income"&&(
              <>
                <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>SOUS-CATÉGORIE</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:16}}>
                  <button onClick={()=>setHSC("all")} style={{padding:"5px 11px",borderRadius:20,border:`1px solid ${hSubcat==="all"?"#B4FF00":T.border}`,background:hSubcat==="all"?"#B4FF0022":T.card2,color:hSubcat==="all"?"#B4FF00":T.sub,fontSize:12,fontWeight:600,cursor:"pointer"}}>Toutes</button>
                  {filteredSubcats.map(sc=>{ const env=envelopes.find(e=>e.id===sc.envelopeId); return (
                    <button key={sc.id} onClick={()=>setHSC(sc.id)} style={{padding:"5px 11px",borderRadius:20,border:`1px solid ${hSubcat===sc.id?env?.color||"#B4FF00":T.border}`,background:hSubcat===sc.id?(env?.color||"#B4FF00")+"22":"#060E08",color:hSubcat===sc.id?env?.color||"#B4FF00":T.sub,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                      <span style={{width:5,height:5,borderRadius:"50%",background:env?.color||T.sub,display:"inline-block"}}/>{sc.label}
                    </button>
                  );})}
                </div>
              </>
            )}

            {filteredTxs.length===0&&<div style={{background:T.card,borderRadius:16,padding:32,textAlign:"center",color:T.sub,fontSize:15,border:`1px solid ${T.border}`}}>Aucune transaction</div>}
            {Object.entries(grouped).map(([date,list])=>(
              <div key={date} style={{marginBottom:18}}>
                <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:6,paddingLeft:4}}>{fmtD(list[0].date).toUpperCase()}</div>
                <div style={{background:T.card,borderRadius:16,overflow:"hidden",border:`1px solid ${T.border}`}}>
                  {list.map((tx,i)=><TxRow key={tx.id} tx={tx} onDelete={deleteTx} subcats={subcats} envelopes={envelopes} incomeRules={incomeRules} last={i===list.length-1}/>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ SINKING FUND PAGE ═════════════════════════════════════════════════ */}
      {tab==="sinking"&&(
        <div style={{flex:1,overflowY:"auto",paddingBottom:90}}>
          <div style={{padding:"52px 16px 0"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <button onClick={()=>setTab("home")} style={{background:"none",border:"none",color:T.sub,fontSize:20,cursor:"pointer",padding:0}}>←</button>
              <div style={{fontSize:24,fontWeight:800,color:T.text}}>Sinking Funds</div>
            </div>

            {sinkFunds.map((f,i)=>{
                    const totalAlloue=sinkFunds.reduce((a,x)=>a+x.current,0);
                    return <SinkingCard key={f.id} fund={f} onDelete={deleteSink} onAdd={addToSink} tresorerie={bal.tresorerie||0} totalAlloue={totalAlloue}/>;
                  })}

            <div style={{background:"#060E08",borderRadius:16,padding:"16px",border:`1px solid ${T.border}`,marginTop:16}}>
              <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:12}}>NOUVEAU SINKING FUND</div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <input value={sfIcon} onChange={e=>setSFI(e.target.value)} placeholder="🎯" style={{...inp,width:52,textAlign:"center",fontSize:20,padding:"8px 4px"}}/>
                <input value={sfLabel} onChange={e=>setSFL(e.target.value)} placeholder="Nom (ex: Laptop)" style={{...inp,flex:1}}/>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>OBJECTIF (Ar)</div>
                <input type="number" value={sfGoal} onChange={e=>setSFG(e.target.value)} placeholder="500 000" style={inp}/>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>VERSEMENT MENSUEL (Ar)</div>
                <input type="number" value={sfMonthly} onChange={e=>setSFM(e.target.value)} placeholder="50 000" style={inp}/>
              </div>
              {sfGoal&&sfMonthly&&parseFloat(sfMonthly)>0&&(
                <div style={{background:T.muted,borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:12,color:"#B4FF00"}}>
                  🎯 Atteint en ~{Math.ceil(parseFloat(sfGoal)/parseFloat(sfMonthly))} mois
                </div>
              )}
              <button onClick={addSinkingFund} style={{width:"100%",padding:"12px 0",borderRadius:12,border:"none",background:"#B4FF00",color:"#050607",fontSize:14,fontWeight:800,cursor:"pointer"}}>+ Créer le Sinking Fund</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CATEGORIES ════════════════════════════════════════════════════════ */}
      {tab==="categories"&&(
        <div style={{flex:1,overflowY:"auto",paddingBottom:90}}>
          <div style={{padding:"52px 16px 0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:28,fontWeight:800,color:T.text}}>Catégories</div>
              <button onClick={()=>setShowReset(true)} style={{padding:"6px 12px",borderRadius:10,border:`1px solid #F8717160`,background:"#1A080820",color:"#F87171",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                Réinitialiser
              </button>
            </div>

            {/* Reset confirmation modal */}
            {showReset&&(
              <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
                <div style={{background:"#0B1A12",borderRadius:20,padding:24,border:`1px solid #F8717160`,maxWidth:320,width:"100%"}}>
                  <div style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:8}}>Réinitialiser le profil ?</div>
                  <div style={{fontSize:13,color:T.sub,marginBottom:20,lineHeight:1.5}}>
                    Toutes les transactions, enveloppes, sinking funds et dépenses récurrentes seront supprimées. Cette action est irréversible.
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>setShowReset(false)} style={{flex:1,padding:"11px 0",borderRadius:12,border:`1px solid ${T.border}`,background:"none",color:T.text,fontSize:14,fontWeight:700,cursor:"pointer"}}>Annuler</button>
                    <button onClick={resetProfile} style={{flex:1,padding:"11px 0",borderRadius:12,border:"none",background:"#F87171",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer"}}>Réinitialiser</button>
                  </div>
                </div>
              </div>
            )}
            <div style={{display:"flex",background:"#040806",borderRadius:12,padding:3,marginBottom:20}}>
              {[["envelopes","Enveloppes"],["splits","Répartition %"]].map(([id,lbl])=>(
                <button key={id} onClick={()=>setCatTab(id)} style={{flex:1,padding:"9px 0",borderRadius:10,border:"none",cursor:"pointer",background:catTab===id?"#B4FF00":"transparent",color:catTab===id?"#fff":T.sub,fontSize:13,fontWeight:700}}>{lbl}</button>
              ))}
            </div>

            {catTab==="envelopes"&&(
              <>
                <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:10}}>ENVELOPPES</div>
                <div style={{background:T.card,borderRadius:16,overflow:"hidden",border:`1px solid ${T.border}`,marginBottom:16}}>
                  {envelopes.map((env,i)=>(
                    <div key={env.id}>
                      <div style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:(i<envelopes.length-1&&editingColor!==env.id)?`1px solid ${T.border}`:undefined}}>
                        {/* Color dot — tap to edit color */}
                        <div
                          onClick={()=>setEC(editingColor===env.id?null:env.id)}
                          style={{width:22,height:22,borderRadius:"50%",background:env.color,flexShrink:0,cursor:"pointer",border:editingColor===env.id?`2px solid ${T.text}`:"2px solid transparent",transition:"border .15s"}}
                        />
                        {editingEnv===env.id&&!env.system?(
                          <input value={editingLabel} onChange={e=>setEL(e.target.value)}
                            onBlur={()=>{ safeSetEnv(envelopes.map(x=>x.id===env.id?{...x,label:editingLabel}:x)); setEEv(null); }}
                            autoFocus style={{...inp,flex:1,padding:"4px 8px",fontSize:14}}/>
                        ):(
                          <div style={{flex:1}} onClick={()=>{ if(!env.system){ setEEv(env.id); setEL(env.label); } }}>
                            <div style={{fontSize:14,fontWeight:600,color:T.text,display:"flex",alignItems:"center",gap:6}}>
                              {env.label}
                              {env.system&&<span style={{fontSize:9,color:T.sub,background:T.muted,padding:"2px 6px",borderRadius:6,fontWeight:700,letterSpacing:0.5}}>SYSTÈME</span>}
                            </div>
                            {!env.system&&<div style={{fontSize:10,color:T.sub,marginTop:1}}>Tap sur le point pour changer la couleur</div>}
                            {env.system&&<div style={{fontSize:10,color:T.sub,marginTop:1}}>Non modifiable — rôle réservé</div>}
                          </div>
                        )}
                        {env.system
                          ? <span style={{fontSize:11,color:T.sub,padding:"0 4px",fontWeight:600}}>🔒</span>
                          : <button onClick={()=>{ if(envelopes.length<=1) return; safeSetEnv(envelopes.filter(x=>x.id!==env.id)); setSub(subcats.filter(s=>s.envelopeId!==env.id)); }} style={{background:"none",border:"none",cursor:"pointer",color:"#F87171",fontSize:18,padding:"0 4px"}}>×</button>
                        }
                      </div>
                      {/* Color picker inline */}
                      {editingColor===env.id&&(
                        <div style={{padding:"10px 16px 14px",background:"#040806",borderBottom:`1px solid ${T.border}`}}>
                          <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:8}}>CHOISIR UNE COULEUR</div>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                            {["#F87171","#FBBF24","#34D399","#B4FF00","#60A5FA","#A78BFA","#F472B6","#FB923C","#94A3B8","#E2E8F0","#818CF8","#2DD4BF"].map(c=>(
                              <button key={c} onClick={()=>{
                                safeSetEnv(envelopes.map(x=>x.id===env.id?{...x,color:c,bg:c+"22"}:x));
                              }} style={{width:28,height:28,borderRadius:"50%",background:c,border:env.color===c?`3px solid ${T.text}`:"3px solid transparent",cursor:"pointer",flexShrink:0}}/>
                            ))}
                            {/* Custom color */}
                            <div style={{position:"relative",width:28,height:28}}>
                              <input type="color" value={env.color}
                                onChange={e=>safeSetEnv(envelopes.map(x=>x.id===env.id?{...x,color:e.target.value,bg:e.target.value+"22"}:x))}
                                style={{width:"100%",height:"100%",borderRadius:"50%",border:"none",cursor:"pointer",padding:0,background:"none"}}/>
                            </div>
                          </div>
                          <button onClick={()=>setEC(null)} style={{fontSize:12,color:"#B4FF00",background:"none",border:"none",cursor:"pointer",fontWeight:700}}>✓ Fermer</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{background:"#060E08",borderRadius:16,padding:"14px 16px",border:`1px solid ${T.border}`,marginBottom:24}}>
                  <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:10}}>NOUVELLE ENVELOPPE</div>
                  <input value={newEnvLabel} onChange={e=>setNEL(e.target.value)} placeholder="Nom" style={{...inp,marginBottom:10}}/>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <span style={{fontSize:12,color:T.sub}}>Couleur :</span>
                    <input type="color" value={newEnvColor} onChange={e=>setNEC(e.target.value)} style={{width:36,height:36,borderRadius:8,border:"none",background:"none",cursor:"pointer"}}/>
                    <span style={{width:20,height:20,borderRadius:"50%",background:newEnvColor,display:"inline-block"}}/>
                  </div>
                  <button onClick={()=>{ if(!newEnvLabel.trim()) return; const id=uid(); safeSetEnv([...envelopes,{id,label:newEnvLabel.trim(),color:newEnvColor,bg:newEnvColor+"22"}]); setBal(b=>({...b,[id]:0})); setNEL(""); setNEC("#B4FF00"); }} style={{width:"100%",padding:"10px 0",borderRadius:12,border:"none",background:"#B4FF00",color:"#050607",fontSize:14,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
                </div>
                {envelopes.map(env=>{
                  const scs=subcats.filter(s=>s.envelopeId===env.id);
                  return (
                    <div key={env.id} style={{marginBottom:20}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <span style={{width:10,height:10,borderRadius:"50%",background:env.color,display:"inline-block"}}/>
                        <span style={{fontSize:11,color:env.color,fontWeight:700,letterSpacing:1.5}}>{env.label.toUpperCase()}</span>
                      </div>
                      <div style={{background:T.card,borderRadius:16,overflow:"hidden",border:`1px solid ${T.border}`,marginBottom:10}}>
                        {scs.length===0&&<div style={{padding:"12px 16px",fontSize:13,color:T.sub}}>Aucune sous-catégorie</div>}
                        {scs.map((sc,i)=>(
                          <div key={sc.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<scs.length-1?`1px solid ${T.border}`:undefined}}>
                            <span style={{width:8,height:8,borderRadius:"50%",background:env.color,flexShrink:0}}/>
                            <div style={{flex:1,fontSize:14,color:T.text}}>{sc.label}</div>
                            <button onClick={()=>setSub(subcats.filter(x=>x.id!==sc.id))} style={{background:"none",border:"none",cursor:"pointer",color:"#F87171",fontSize:18,padding:"0 4px"}}>×</button>
                          </div>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <input value={newScEnv===env.id?newScLabel:""} onChange={e=>{setNSL(e.target.value);setNSE(env.id);}} placeholder={`+ Sous-catégorie ${env.label}`} style={{...inp,flex:1,fontSize:13}} onFocus={()=>setNSE(env.id)}/>
                        <button onClick={()=>{ if(!newScLabel.trim()||newScEnv!==env.id) return; setSub([...subcats,{id:uid(),label:newScLabel.trim(),envelopeId:env.id}]); setNSL(""); setNSE(""); }} style={{padding:"10px 14px",borderRadius:12,border:"none",background:env.color,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",flexShrink:0}}>+</button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            {catTab==="splits"&&(
              <>
                {/* ── Existing income types ── */}
                <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>TYPES DE REVENUS</div>
                <div style={{fontSize:12,color:T.sub,marginBottom:12}}>Modifie, ajoute ou supprime un type. Total répartition = 100%.</div>
                {Object.entries(incomeRules).map(([k,r])=>(
                  <div key={k} style={{marginBottom:16}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:18}}>{r.icon}</span>
                        <span style={{fontSize:14,fontWeight:700,color:T.text}}>{r.label}</span>
                      </div>
                      {Object.keys(incomeRules).length>1&&(
                        <button onClick={()=>setIR(rules=>{ const n={...rules}; delete n[k]; return n; })} style={{background:"none",border:"none",color:"#F87171",fontSize:18,cursor:"pointer",padding:"0 4px"}}>×</button>
                      )}
                    </div>
                    <SplitEditor key={k} ruleKey={k} rule={r} envelopes={envelopes} setIncomeRules={setIR}/>
                  </div>
                ))}

                {/* ── Add new income type ── */}
                <div style={{background:"#060E08",borderRadius:14,padding:"14px 16px",border:`1px solid ${T.border}`,marginTop:8}}>
                  <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:12}}>NOUVEAU TYPE DE REVENU</div>
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:11,color:T.sub,marginBottom:6}}>NOM</div>
                    <input value={newIRLabel} onChange={e=>setNIRL(e.target.value)} placeholder="Ex: Dividendes, Location..." style={{width:"100%",padding:"9px 12px",borderRadius:10,border:`1px solid ${T.border}`,background:"#040806",color:T.text,fontSize:14,outline:"none",boxSizing:"border-box"}}/>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11,color:T.sub,marginBottom:8}}>ICÔNE</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {["💰","🏠","🎙️","💵","📦","🎵","📷","🖥️","✍️","🎬","📱","🔧","🏦","🎯","💼","🌐"].map(ic=>(
                        <button key={ic} onClick={()=>setNIRI(ic)} style={{width:36,height:36,borderRadius:9,border:`1.5px solid ${newIRIcon===ic?"#B4FF00":T.border}`,background:newIRIcon===ic?"#B4FF0018":"#040806",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{ic}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11,color:T.sub,marginBottom:6}}>RÉPARTITION PAR DÉFAUT</div>
                    {envelopes.map(env=>(
                      <div key={env.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                        <span style={{width:8,height:8,borderRadius:"50%",background:env.color,flexShrink:0}}/>
                        <span style={{fontSize:12,color:T.text,flex:1}}>{env.label}</span>
                        <input type="number" min="0" max="100" value={newIRSplit[env.id]??0}
                          onChange={e=>setNIRS(s=>({...s,[env.id]:e.target.value}))}
                          style={{width:52,padding:"4px 8px",borderRadius:8,border:`1px solid ${T.border}`,background:"#040806",color:T.text,fontSize:13,fontWeight:700,outline:"none",textAlign:"center"}}/>
                        <span style={{fontSize:12,color:T.sub}}>%</span>
                      </div>
                    ))}
                    {(()=>{ const tot=Object.values(newIRSplit).reduce((a,v)=>a+(parseFloat(v)||0),0); return (
                      <div style={{fontSize:11,color:Math.round(tot)===100?"#B4FF00":"#F87171",marginTop:4,fontWeight:700}}>{Math.round(tot)}% / 100%</div>
                    ); })()}
                  </div>
                  <button onClick={()=>{
                    if(!newIRLabel.trim()) return;
                    const tot=Object.values(newIRSplit).reduce((a,v)=>a+(parseFloat(v)||0),0);
                    if(Math.round(tot)!==100) return;
                    const k=uid();
                    const split=Object.fromEntries(Object.entries(newIRSplit).map(([k,v])=>[k,parseFloat(v)||0]));
                    setIR(r=>({...r,[k]:{label:newIRLabel.trim(),icon:newIRIcon,color:"#B4FF00",split}}));
                    setNIRL(""); setNIRI("💰"); setNIRS(Object.fromEntries(envelopes.map(e=>[e.id,0])));
                  }} style={{width:"100%",padding:"10px 0",borderRadius:12,border:"none",background:"#B4FF00",color:"#020303",fontSize:14,fontWeight:800,cursor:"pointer"}}>
                    + Ajouter ce type
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ RECURRING EXPENSES ═════════════════════════════════════════════ */}
      {tab==="recurring"&&(
        <div style={{flex:1,overflowY:"auto",paddingBottom:90}}>
          <div style={{padding:"52px 16px 0"}}>
            <div style={{fontSize:28,fontWeight:800,color:T.text,marginBottom:4}}>Récurrents</div>
            <div style={{fontSize:13,color:T.sub,marginBottom:20}}>Abonnements & factures fixes</div>

            {/* Summary */}
            {recurExp.filter(r=>r.active).length>0&&(
              <div style={{background:"#060E08",borderRadius:14,padding:"12px 16px",border:`1px solid ${T.border}`,marginBottom:20,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1,marginBottom:3}}>TOTAL / MOIS</div>
                  <div style={{fontSize:18,fontWeight:800,color:"#F87171"}}>
                    {fmt(recurExp.filter(r=>r.active).reduce((a,r)=>{
                      if(r.period==="weekly") return a+r.amount*4.33;
                      if(r.period==="monthly") return a+r.amount;
                      if(r.period==="yearly") return a+r.amount/12;
                      return a;
                    },0))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1,marginBottom:3}}>ACTIFS</div>
                  <div style={{fontSize:18,fontWeight:800,color:"#B4FF00"}}>{recurExp.filter(r=>r.active).length}</div>
                </div>
              </div>
            )}

            {/* List */}
            {recurExp.length===0&&(
              <div style={{background:"#060E08",borderRadius:14,padding:32,textAlign:"center",color:T.sub,fontSize:14,border:`1px solid ${T.border}`,marginBottom:20}}>
                Aucune dépense récurrente
              </div>
            )}
            {recurExp.length>0&&(
              <div style={{marginBottom:20}}>
                {recurExp.map(re=>{
                  const sc=subcats.find(s=>s.id===re.subcatId);
                  const env=envelopes.find(e=>e.id===sc?.envelopeId);
                  const days=daysUntil(re.nextDate);
                  const urgent=days<=3&&days>=0;
                  const overdue=days<0;
                  return (
                    <div key={re.id} style={{background:"#060E08",borderRadius:14,padding:"14px 16px",border:`1.5px solid ${overdue?"#F87171":urgent?"#FBBF24":T.border}`,marginBottom:10,opacity:re.active?1:0.5}}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:15,fontWeight:700,color:T.text}}>{re.label}</div>
                          <div style={{fontSize:11,color:T.sub,marginTop:2,display:"flex",gap:8,alignItems:"center"}}>
                            {env&&<span style={{color:env.color}}>● {env.label}</span>}
                            <span>{sc?.label}</span>
                            <span>· {RECUR_OPTIONS.find(r=>r.id===re.period)?.label}</span>
                          </div>
                        </div>
                        <div style={{fontSize:17,fontWeight:800,color:"#F87171",marginLeft:8}}>{fmt(re.amount)}</div>
                      </div>
                      {/* Next date */}
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                        <div style={{fontSize:12,color:overdue?"#F87171":urgent?"#FBBF24":T.sub}}>
                          {overdue?`En retard de ${Math.abs(days)}j`:days===0?"Aujourd'hui !":urgent?`Dans ${days}j`:`Prochain : ${new Date(re.nextDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}`}
                        </div>
                        {(overdue||urgent)&&<div style={{width:8,height:8,borderRadius:"50%",background:overdue?"#F87171":"#FBBF24",animation:"pulse 1s infinite"}}/>}
                      </div>
                      {/* Actions */}
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>payRecurExp(re)} disabled={!re.active} style={{flex:1,padding:"8px 0",borderRadius:10,border:"none",background:re.active?"#B4FF00":T.muted,color:re.active?"#020303":T.sub,fontSize:12,fontWeight:700,cursor:re.active?"pointer":"default"}}>
                          ✓ Payer maintenant
                        </button>
                        <button onClick={()=>toggleRecurExp(re.id)} style={{padding:"8px 12px",borderRadius:10,border:`1px solid ${T.border}`,background:"none",color:re.active?"#FBBF24":T.sub,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                          {re.active?"Pause":"Activer"}
                        </button>
                        <button onClick={()=>deleteRecurExp(re.id)} style={{padding:"8px 10px",borderRadius:10,border:"none",background:"#1A0808",color:"#F87171",fontSize:13,cursor:"pointer"}}>×</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add new recurring */}
            <div style={{background:"#060E08",borderRadius:14,padding:"16px",border:`1px solid ${T.border}`}}>
              <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:12}}>NOUVELLE DÉPENSE RÉCURRENTE</div>
              <input value={reLabel} onChange={e=>setREL(e.target.value)} placeholder="Nom (ex: Netflix, JIRAMA...)" style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${T.border}`,background:"#040806",color:T.text,fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
              <input value={reAmt} onChange={e=>setREA(e.target.value)} type="number" placeholder="Montant (Ar)" style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${T.border}`,background:"#040806",color:T.text,fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
              <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>FRÉQUENCE</div>
              <div style={{display:"flex",gap:6,marginBottom:10}}>
                {RECUR_OPTIONS.filter(r=>r.id!=="none").map(ro=>(
                  <button key={ro.id} onClick={()=>setREP(ro.id)} style={{flex:1,padding:"7px 4px",borderRadius:10,border:`1px solid ${rePeriod===ro.id?"#B4FF00":T.border}`,background:rePeriod===ro.id?"#B4FF0018":"#040806",color:rePeriod===ro.id?"#B4FF00":T.sub,fontSize:11,fontWeight:600,cursor:"pointer"}}>{ro.label.replace("Chaque ","")}</button>
                ))}
              </div>
              <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>CATÉGORIE</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
                {subcats.filter(s=>s.envelopeId!=="tresorerie").map(sc=>{
                  const env=envelopes.find(e=>e.id===sc.envelopeId);
                  const active=reScId===sc.id;
                  return (
                    <button key={sc.id} onClick={()=>setRESC(sc.id)} style={{padding:"5px 10px",borderRadius:20,border:`1.5px solid ${active?env?.color||"#B4FF00":T.border}`,background:active?(env?.bg||T.muted):"#040806",color:active?(env?.color||T.text):T.sub,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                      <span style={{width:5,height:5,borderRadius:"50%",background:env?.color||T.sub,display:"inline-block"}}/>{sc.label}
                    </button>
                  );
                })}
              </div>
              <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>PREMIÈRE ÉCHÉANCE</div>
              <input type="date" value={reNextDate} onChange={e=>setREND(e.target.value)} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${T.border}`,background:"#040806",color:T.text,fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:12,colorScheme:"dark"}}/>
              <button onClick={addRecurExp} style={{width:"100%",padding:"12px 0",borderRadius:12,border:"none",background:reLabel&&reAmt&&reScId?"#B4FF00":T.muted,color:reLabel&&reAmt&&reScId?"#020303":T.sub,fontSize:14,fontWeight:800,cursor:reLabel&&reAmt&&reScId?"pointer":"not-allowed"}}>
                + Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ BOTTOM NAV — MOBILE ONLY ══════════════════════════════════════════ */}
      {!isDesktop && (
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(2,3,3,0.98)",backdropFilter:"blur(24px)",borderTop:`1px solid ${T.border}`,display:"flex",paddingBottom:18,paddingTop:10,zIndex:100}}>
        {NAV_ITEMS.map(t=>t.big?(
          <div key="add" style={{flex:1,display:"flex",justifyContent:"center"}}>
            <button onClick={()=>setTab("add")} style={{width:50,height:50,borderRadius:16,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#B4FF00,#5FD34A)",boxShadow:"0 4px 20px #B4FF0060",display:"flex",alignItems:"center",justifyContent:"center",marginTop:-10}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#020303" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        ):(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",position:"relative"}}>
            {t.svg(tab===t.id?"#B4FF00":T.sub)}
            {t.id==="recurring"&&recurExp.some(r=>r.active&&daysUntil(r.nextDate)<=3)&&(
              <span style={{position:"absolute",top:0,right:"18%",width:6,height:6,borderRadius:"50%",background:"#F87171"}}/>
            )}
            <span style={{fontSize:9,fontWeight:tab===t.id?700:400,color:tab===t.id?"#B4FF00":T.sub}}>{t.label}</span>
          </button>
        ))}
      </div>
      )}
      </div>
    </div>
  );
}
