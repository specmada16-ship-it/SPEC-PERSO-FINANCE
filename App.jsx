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
// ─── SEUILS ───────────────────────────────────────────────────────────────────
const SEUILS_KEY = "seuils";
const SEUILS_PRESETS = [
  { id:"simple",  label:"Vie simple",  desc:"Peu de charges fixes — célibataire, pas de loyer, peu d'abonnements",  emoji:"🌱", alerte:35000,  blocage:15000 },
  { id:"active",  label:"Vie active",  desc:"Charges moyennes — foyer 2 personnes, loyer, quelques abonnements",     emoji:"⚡", alerte:60000,  blocage:25000 },
  { id:"chargee", label:"Vie chargée", desc:"Beaucoup de charges — famille, enfants, loyer + abonnements importants", emoji:"🔥", alerte:100000, blocage:50000 },
  { id:"custom",  label:"Personnalisé", desc:"Définis tes propres seuils selon ta situation",                         emoji:"✏️", alerte:null,   blocage:null  },
];
// Runtime SEUILS — overridden per-profile in App component
let SEUILS = { alerte:60000, blocage:25000 };

const CURRENCIES = [
  { code:"Ar",   label:"Ariary — Madagascar (Ar)",         symbol:"Ar" },
  { code:"XOF",  label:"Franc CFA UEMOA — Afrique de l'Ouest (XOF)", symbol:"XOF" },
  { code:"XAF",  label:"Franc CFA CEMAC — Afrique Centrale (XAF)",   symbol:"XAF" },
  { code:"EUR",  label:"Euro — La Réunion / Mayotte (€)",  symbol:"€" },
  { code:"MUR",  label:"Roupie mauricienne — Maurice (Rs)", symbol:"Rs" },
  { code:"KMF",  label:"Franc comorien — Comores (KMF)",  symbol:"KMF" },
  { code:"DJF",  label:"Franc djiboutien — Djibouti (Fdj)", symbol:"Fdj" },
  { code:"SCR",  label:"Roupie seychelloise — Seychelles (SR)", symbol:"SR" },
  { code:"USD",  label:"Dollar US ($)",                        symbol:"$" },
];

// fmt is now a closure — call makeFmt(currency) to get a formatter
const makeFmt = (cur) => (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n||0))+" "+cur;

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

let fmt = makeFmt("Ar"); // default, overridden per-profile at runtime
const fmtD = iso => new Date(iso).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});
const uid  = () => Math.random().toString(36).slice(2,8);
const load = (k,d) => { try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch{ return d; } };
const save = (k,v) => { try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} };

// ─── PIN LOCK ─────────────────────────────────────────────────────────────────
// Chaque utilisateur crée son propre code au premier lancement.
// Aucun code par défaut — si aucun code n'est stocké, on affiche l'écran de création.
const PIN_KEY = "sf_pin";
const UNLOCKED_KEY = "sf_unlocked";

// ─── LICENCE ──────────────────────────────────────────────────────────────────
// Codes valides — ajoute ici les codes générés sur Gumroad après chaque vente.
// Format libre : 8-12 caractères alphanumériques, ex: "SF-A1B2C3D4"
// L'utilisateur entre son code une fois → débloqué définitivement sur cet appareil.
const VALID_LICENSES = [
  "SF-DEMO2024",   // ← code de démo / test
  // Ajoute ici les codes Gumroad au fur et à mesure des ventes
];
const LICENSE_KEY = "sf_licensed";

function LicenseScreen({ onUnlock }) {
  const [input, setInput]   = useState("");
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState(false);

  function check() {
    const code = input.trim().toUpperCase();
    if (!code) return;
    if (VALID_LICENSES.map(c=>c.toUpperCase()).includes(code)) {
      save(LICENSE_KEY, true);
      setSuccess(true);
      setTimeout(onUnlock, 900);
    } else {
      setError("Code invalide. Vérifie ton email de confirmation Gumroad.");
      setTimeout(() => setError(""), 3000);
    }
  }

  return (
    <div style={{position:"fixed",inset:0,background:"#020303",zIndex:2000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,fontFamily:"'Space Grotesk','Inter',-apple-system,sans-serif"}}>
      <div style={{width:"100%",maxWidth:380,display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{width:64,height:64,borderRadius:18,overflow:"hidden",marginBottom:28}}><img src="/icon-192.png" alt="Kajy" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>

        {success ? (
          <>
            <div style={{fontSize:36,marginBottom:12}}>✅</div>
            <div style={{fontSize:18,fontWeight:800,color:"#B4FF00"}}>Accès débloqué !</div>
          </>
        ) : (
          <>
            <div style={{fontSize:19,fontWeight:800,color:"#E8FFD4",marginBottom:6,textAlign:"center"}}>Bienvenue sur Kajy</div>
            <div style={{fontSize:13,color:"#3A6040",marginBottom:8,textAlign:"center"}}>Entre ton code de licence pour accéder à l'app.</div>
            <div style={{fontSize:12,color:"#1E3D22",marginBottom:28,textAlign:"center"}}>
              Tu peux obtenir un code en contactant le vendeur via WhatsApp.
            </div>

            <input
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&check()}
              placeholder="Ex : SF-A1B2C3D4"
              autoCapitalize="characters"
              style={{width:"100%",padding:"14px 16px",borderRadius:12,border:`1.5px solid ${error?"#F87171":"#1E3D22"}`,background:"#060E08",color:"#E8FFD4",fontSize:16,fontWeight:700,outline:"none",textAlign:"center",letterSpacing:2,marginBottom:12,boxSizing:"border-box"}}
            />

            {error && (
              <div style={{fontSize:12,color:"#F87171",marginBottom:12,textAlign:"center"}}>{error}</div>
            )}

            <button onClick={check} style={{width:"100%",padding:"14px 0",borderRadius:12,border:"none",background:"#B4FF00",color:"#020303",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:20}}>
              Déverrouiller →
            </button>

            <div style={{fontSize:11,color:"#122416",textAlign:"center",lineHeight:1.6}}>
              Code reçu après confirmation du paiement.<br/>
              Problème ? Contacte-nous via WhatsApp.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LockScreen({ onUnlock }) {
  const hasPin = !!load(PIN_KEY, null);
  // mode: "create" (no pin yet) | "confirm" (confirming new pin) | "enter" (pin exists)
  const [mode, setMode]   = useState(hasPin ? "enter" : "create");
  const [input, setInput] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState(false);

  function press(d) {
    if (input.length >= 4) return;
    setError(false);
    const next = input + d;
    setInput(next);
    if (next.length === 4) setTimeout(() => handleComplete(next), 150);
  }
  function del() { setInput(i => i.slice(0, -1)); setError(false); }

  function handleComplete(code) {
    if (mode === "create") {
      setNewPin(code);
      setInput("");
      setMode("confirm");
      return;
    }
    if (mode === "confirm") {
      if (code === newPin) {
        save(PIN_KEY, code);
        save(UNLOCKED_KEY, true);
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => { setInput(""); setError(false); setMode("create"); setNewPin(""); }, 600);
      }
      return;
    }
    if (mode === "enter") {
      const stored = load(PIN_KEY, null);
      if (code === stored) {
        save(UNLOCKED_KEY, true);
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => { setInput(""); setError(false); }, 500);
      }
    }
  }

  const title = mode === "create"  ? "Crée ton code PIN"
              : mode === "confirm" ? "Confirme ton code"
              : "Ton code PIN";
  const sub   = mode === "create"  ? "Ce code protège l'accès à ton app."
              : mode === "confirm" ? "Entre à nouveau le même code."
              : "Entre ton code pour continuer.";

  return (
    <div style={{position:"fixed",inset:0,background:"#020303",zIndex:1000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Space Grotesk','Inter',-apple-system,sans-serif"}}>
      <div style={{width:64,height:64,borderRadius:18,overflow:"hidden",marginBottom:24}}><img src="/icon-192.png" alt="Kajy" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
      <div style={{fontSize:19,fontWeight:800,color:"#E8FFD4",marginBottom:6}}>{title}</div>
      <div style={{fontSize:13,color:"#3A6040",marginBottom:32}}>{sub}</div>

      <div style={{display:"flex",gap:14,marginBottom:40}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{
            width:16,height:16,borderRadius:"50%",
            background: i<input.length ? (error?"#F87171":"#B4FF00") : "transparent",
            border:`2px solid ${error?"#F87171":i<input.length?"#B4FF00":"#1E3D22"}`,
            transition:"all .15s",
          }}/>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18,width:260}}>
        {["1","2","3","4","5","6","7","8","9","","0","del"].map((k,i)=>{
          if (k === "") return <div key={i}/>;
          if (k === "del") return (
            <button key={i} onClick={del} style={{height:64,borderRadius:"50%",border:"none",background:"none",color:"#E8FFD4",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8FFD4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
              </svg>
            </button>
          );
          return (
            <button key={i} onClick={()=>press(k)} style={{height:64,width:64,borderRadius:"50%",border:"1px solid #122416",background:"#060E08",color:"#E8FFD4",fontSize:24,fontWeight:600,cursor:"pointer"}}>{k}</button>
          );
        })}
      </div>
    </div>
  );
}

function ChangePinScreen({ onClose }) {
  const [step, setStep] = useState("current"); // "current" | "new" | "confirm" | "done"
  const [input, setInput] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState(false);

  function press(d) {
    if (input.length >= 4) return;
    setError(false);
    const next = input + d;
    setInput(next);
    if (next.length === 4) setTimeout(() => handleComplete(next), 150);
  }
  function del() { setInput(i => i.slice(0, -1)); setError(false); }

  function handleComplete(code) {
    const stored = load(PIN_KEY, null);
    if (step === "current") {
      if (code === stored) { setInput(""); setStep("new"); }
      else { setError(true); setTimeout(()=>{ setInput(""); setError(false); }, 500); }
      return;
    }
    if (step === "new") {
      setNewPin(code);
      setInput("");
      setStep("confirm");
      return;
    }
    if (step === "confirm") {
      if (code === newPin) {
        save(PIN_KEY, code);
        setStep("done");
        setTimeout(onClose, 1000);
      } else {
        setError(true);
        setTimeout(()=>{ setInput(""); setStep("new"); setNewPin(""); setError(false); }, 700);
      }
    }
  }

  const titles = { current:"Code actuel", new:"Nouveau code", confirm:"Confirmer", done:"✓ Code mis à jour" };

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:24,fontFamily:"'Space Grotesk','Inter',-apple-system,sans-serif"}}>
      <button onClick={onClose} style={{position:"absolute",top:24,right:24,background:"none",border:"none",color:"#3A6040",fontSize:24,cursor:"pointer"}}>×</button>
      <div style={{fontSize:19,fontWeight:800,color:"#E8FFD4",marginBottom:32}}>{titles[step]}</div>
      {step!=="done" && (
        <>
          <div style={{display:"flex",gap:14,marginBottom:40}}>
            {[0,1,2,3].map(i=>(
              <div key={i} style={{width:16,height:16,borderRadius:"50%",background:i<input.length?(error?"#F87171":"#B4FF00"):"transparent",border:`2px solid ${error?"#F87171":i<input.length?"#B4FF00":"#1E3D22"}`}}/>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18,width:260}}>
            {["1","2","3","4","5","6","7","8","9","","0","del"].map((k,i)=>{
              if (k === "") return <div key={i}/>;
              if (k === "del") return (
                <button key={i} onClick={del} style={{height:64,borderRadius:"50%",border:"none",background:"none",color:"#E8FFD4",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8FFD4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
                  </svg>
                </button>
              );
              return <button key={i} onClick={()=>press(k)} style={{height:64,width:64,borderRadius:"50%",border:"1px solid #122416",background:"#060E08",color:"#E8FFD4",fontSize:24,fontWeight:600,cursor:"pointer"}}>{k}</button>;
            })}
          </div>
        </>
      )}
    </div>
  );
}

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
  const envIds = envelopes.map(e=>e.id);
  // Purge any keys from rule.split that no longer correspond to an existing envelope
  const cleanSplit = Object.fromEntries(envIds.map(id => [id, rule.split[id] ?? 0]));
  const [splits,setSplits]=useState(cleanSplit);

  // Re-sync if envelopes change (e.g. one was deleted) — drop orphaned keys, keep valid ones
  useEffect(() => {
    setSplits(prev => Object.fromEntries(envIds.map(id => [id, prev[id] ?? rule.split[id] ?? 0])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envIds.join(",")]);

  const total=Object.values(splits).reduce((a,v)=>a+(parseFloat(v)||0),0);
  const valid=Math.round(total)===100;
  function apply(){
    if(!valid) return;
    // Only keep keys for envelopes that currently exist
    const purged = Object.fromEntries(envIds.map(id=>[id, parseFloat(splits[id])||0]));
    setIncomeRules(r=>({...r,[ruleKey]:{...r[ruleKey],split:purged}}));
  }
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
function SinkingCard({ fund, onDelete, onAdd, onUse, tresorerie, totalAlloue }) {
  const [addAmt,setAddAmt]     = useState("");
  const [useModal,setUseModal] = useState(false);
  const [useAmt,setUseAmt]     = useState(String(fund.current));
  const [useLabel,setUseLabel] = useState(fund.label);
  const [afterAction,setAfterAction] = useState("close"); // "close" | "reset"

  const pct       = Math.min(100,Math.round((fund.current/fund.goal)*100));
  const remaining = fund.goal - fund.current;
  const monthsLeft= fund.monthly>0 ? Math.ceil(remaining/fund.monthly) : null;
  const sfDisponible = Math.max(0, tresorerie - totalAlloue);
  const inputAmt  = parseFloat(addAmt)||0;
  const canAdd    = inputAmt>0 && inputAmt<=sfDisponible && inputAmt<=(fund.goal-fund.current);
  const errMsg    = inputAmt>sfDisponible ? `Max disponible : ${fmt(sfDisponible)}`
                  : inputAmt>(fund.goal-fund.current) ? `Dépasse l'objectif` : null;
  const isGoalReached = pct >= 100;

  return (
    <div style={{background:"#080F09",borderRadius:14,padding:"14px 16px",border:`1px solid ${isGoalReached?"#B4FF0060":T.border}`,marginBottom:10,position:"relative"}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:T.text}}>{fund.icon} {fund.label}</div>
          {monthsLeft&&pct<100&&<div style={{fontSize:11,color:T.sub,marginTop:2}}>~{monthsLeft} mois restants</div>}
          {isGoalReached&&<div style={{fontSize:11,color:"#5FD34A",marginTop:2,fontWeight:600}}>Objectif atteint 🎉</div>}
        </div>
        <button onClick={()=>onDelete(fund.id)} style={{background:"none",border:"none",color:"#F87171",cursor:"pointer",fontSize:16,padding:0}}>×</button>
      </div>

      {/* Montants + barre */}
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:13,fontWeight:800,color:"#B4FF00"}}>{fmt(fund.current)}</span>
        <span style={{fontSize:12,color:T.sub}}>/ {fmt(fund.goal)}</span>
      </div>
      <div style={{height:6,background:T.muted,borderRadius:4,marginBottom:4,overflow:"hidden"}}>
        <div style={{height:"100%",width:pct+"%",background:pct>=100?"#5FD34A":"#B4FF00",borderRadius:4,transition:"width .4s"}}/>
      </div>
      <div style={{fontSize:11,color:T.sub,marginBottom:10}}>{pct}% atteint{pct>=100?" ✅":""}</div>

      {/* Versement (seulement si pas encore atteint) */}
      {pct<100&&(
        <>
          <div style={{display:"flex",gap:6,marginBottom:errMsg?4:0}}>
            <input value={addAmt} onChange={e=>setAddAmt(e.target.value)} type="number"
              placeholder={sfDisponible>0?`Max ${fmt(sfDisponible)}`:"Trésorerie épuisée"}
              disabled={sfDisponible<=0}
              style={{flex:1,padding:"7px 10px",borderRadius:9,border:`1px solid ${errMsg?"#F87171":canAdd?"#B4FF00":T.border}`,background:"#040806",color:sfDisponible>0?T.text:T.sub,fontSize:13,outline:"none"}}/>
            <button onClick={()=>{ if(!canAdd)return; onAdd(fund.id,inputAmt); setAddAmt(""); }}
              disabled={!canAdd}
              style={{padding:"7px 14px",borderRadius:9,border:"none",background:canAdd?"#B4FF00":T.muted,color:canAdd?"#050607":T.sub,fontSize:12,fontWeight:700,cursor:canAdd?"pointer":"not-allowed"}}>+</button>
          </div>
          {errMsg&&<div style={{fontSize:11,color:"#F87171",marginBottom:6}}>{errMsg}</div>}
        </>
      )}

      {/* Bouton Utiliser */}
      <button onClick={()=>{ setUseAmt(String(fund.current)); setUseLabel(fund.label); setUseModal(true); }}
        style={{width:"100%",marginTop:pct<100?8:0,padding:"9px 0",borderRadius:10,border:`1px solid ${isGoalReached?"#5FD34A":"#1E3D22"}`,background:isGoalReached?"#0B1A0C":"none",color:isGoalReached?"#5FD34A":"#3A6040",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>
        {isGoalReached ? "🎯 Utiliser ce fond" : "Utiliser partiellement"}
      </button>

      {/* Modal Utiliser */}
      {useModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(2,3,3,0.96)",zIndex:900,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",padding:"0 0 32px"}}>
          <div style={{width:"100%",maxWidth:430,background:"#060E08",borderRadius:"20px 20px 0 0",border:"1px solid #1E3D22",padding:"24px 20px 8px"}}>

            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <span style={{fontSize:22}}>{fund.icon}</span>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:"#E8FFD4"}}>Utiliser — {fund.label}</div>
                <div style={{fontSize:12,color:"#3A6040"}}>Disponible dans ce fond : {fmt(fund.current)}</div>
              </div>
            </div>

            {/* Label dépense */}
            <div style={{fontSize:10,color:"#3A6040",fontWeight:700,letterSpacing:1.5,marginBottom:6}}>LIBELLÉ DE LA DÉPENSE</div>
            <input value={useLabel} onChange={e=>setUseLabel(e.target.value)}
              style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1px solid #1E3D22",background:"#040806",color:"#E8FFD4",fontSize:14,outline:"none",marginBottom:14,boxSizing:"border-box"}}/>

            {/* Montant */}
            <div style={{fontSize:10,color:"#3A6040",fontWeight:700,letterSpacing:1.5,marginBottom:6}}>MONTANT À UTILISER</div>
            <input type="number" value={useAmt} onChange={e=>setUseAmt(e.target.value)}
              style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1px solid #1E3D22",background:"#040806",color:"#B4FF00",fontSize:18,fontWeight:800,outline:"none",marginBottom:14,boxSizing:"border-box"}}/>

            {/* Après utilisation */}
            <div style={{fontSize:10,color:"#3A6040",fontWeight:700,letterSpacing:1.5,marginBottom:8}}>APRÈS UTILISATION</div>
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              {[{id:"close",label:"Clôturer ce SF",desc:"Supprimer après utilisation"},{id:"reset",label:"Remettre à zéro",desc:"Recommencer l'épargne"}].map(opt=>(
                <button key={opt.id} onClick={()=>setAfterAction(opt.id)}
                  style={{flex:1,padding:"10px 8px",borderRadius:10,border:`1.5px solid ${afterAction===opt.id?"#B4FF00":"#122416"}`,background:afterAction===opt.id?"#0F2010":"#040806",cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color:afterAction===opt.id?"#B4FF00":"#E8FFD4",marginBottom:2}}>{opt.label}</div>
                  <div style={{fontSize:10,color:"#3A6040"}}>{opt.desc}</div>
                </button>
              ))}
            </div>

            <div style={{display:"flex",gap:10,paddingBottom:8}}>
              <button onClick={()=>setUseModal(false)}
                style={{flex:1,padding:"13px 0",borderRadius:12,border:"1px solid #122416",background:"none",color:"#3A6040",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                Annuler
              </button>
              <button onClick={()=>{
                const amt2 = parseFloat(useAmt)||0;
                if(!amt2||amt2>fund.current) return;
                onUse(fund.id, amt2, useLabel||fund.label, afterAction);
                setUseModal(false);
              }}
                style={{flex:2,padding:"13px 0",borderRadius:12,border:"none",background:"#B4FF00",color:"#020303",fontSize:14,fontWeight:800,cursor:"pointer"}}>
                Confirmer l'utilisation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const LANGS = { fr:"Français", en:"English" };
const I18N = {
  fr: {
    config:"Configuration",
    welcome:"Bienvenue 👋",
    welcomeSub:"Configurons ton espace de gestion financière personnelle.",
    createNew:"Créer un nouveau profil",
    createNewSub:"Configure ton profil en quelques étapes.",
    importExisting:"Importer un profil existant",
    importExistingSub:"Tu as déjà un backup .json ? Restaure-le ici.",
    importBtn:"Choisir un fichier .json",
    importDoneLabel:"importé avec succès",
    lang:"Langue", langSub:"Langue de l'interface.",
    name:"Comment t'appelles-tu ?",
    nameSub:"Ce nom identifiera ton profil de gestion.",
    namePh:"Ex : Spec, Toky, Marie, Foyer…",
    nameEx:"💡 Si tu gères les finances de ton foyer, tu peux mettre \"Foyer\" ou ton prénom.",
    currency:"Ta devise",
    currencySub:"Toutes tes transactions seront affichées dans cette devise.",
    currencyEx:"💡 Si tu es à Madagascar, choisis Ariary. À Dakar ou Abidjan, choisis XOF.",
    envelopes:"Tes enveloppes",
    envelopesSub:"La Trésorerie est toujours incluse — c'est ta réserve intouchable.",
    envelopesEx:"💡 Une enveloppe = une grande catégorie de ta vie. Ex : Survie (nourriture, loyer), Opérationnel (travail), Différable (loisirs).",
    envelopesAdd:"Nouvelle enveloppe…",
    subcats:"Tes sous-catégories",
    subcatsSub:"Détaille chaque enveloppe selon tes dépenses réelles.",
    subcatsEx:"💡 Ex : dans Survie → Repas, Transport, Eau, Électricité. Dans Opérationnel → Data, Déplacements clients.",
    subcatsAdd:"Ajouter…",
    revenues:"Tes types de revenus",
    revenuesSub:"Comment répartir chaque revenu entre tes enveloppes ? Total = 100%.",
    revenuesEx:"💡 Ex : ton loyer reçu va 60% en Survie, 30% en Trésorerie, 10% en Opérationnel. Une prestation va 50% en Trésorerie.",
    revenuesAdd:"+ Ajouter un type de revenu",
    back:"← Retour", next:"Continuer →", go:"C'est parti 🚀",
    system_label:"SYSTÈME", tresorerie:"Trésorerie",
    cancel:"Annuler", save:"Enregistrer",
    profileSettings:"Paramètres du profil",
    settingsLang:"Langue", settingsCurrency:"Devise",
  },
  en: {
    config:"Setup",
    welcome:"Welcome 👋",
    welcomeSub:"Let's set up your personal finance space.",
    createNew:"Create a new profile",
    createNewSub:"Configure your profile in a few steps.",
    importExisting:"Import an existing profile",
    importExistingSub:"Already have a .json backup? Restore it here.",
    importBtn:"Choose a .json file",
    importDoneLabel:"imported successfully",
    lang:"Language", langSub:"Interface language.",
    name:"What's your name?",
    nameSub:"This name will identify your profile.",
    namePh:"E.g.: Alex, Marie, Household…",
    nameEx:"💡 If you manage your household finances, you can use \"Household\" or your first name.",
    currency:"Your currency",
    currencySub:"All your transactions will be displayed in this currency.",
    currencyEx:"💡 Choose the currency you use daily for your income and expenses.",
    envelopes:"Your envelopes",
    envelopesSub:"The Treasury is always included — it's your untouchable reserve.",
    envelopesEx:"💡 An envelope = a major life category. E.g.: Survival (food, rent), Operations (work), Deferrable (leisure).",
    envelopesAdd:"New envelope…",
    subcats:"Your subcategories",
    subcatsSub:"Break down each envelope by your real expenses.",
    subcatsEx:"💡 E.g.: under Survival → Meals, Transport, Water, Electricity. Under Operations → Data, Client travel.",
    subcatsAdd:"Add…",
    revenues:"Your income types",
    revenuesSub:"How to split each income across your envelopes? Total = 100%.",
    revenuesEx:"💡 E.g.: regular rent income goes 60% to Survival, 30% to Treasury, 10% to Operations.",
    revenuesAdd:"+ Add income type",
    back:"← Back", next:"Continue →", go:"Let's go 🚀",
    system_label:"SYSTEM", tresorerie:"Treasury",
    cancel:"Cancel", save:"Save",
    profileSettings:"Profile settings",
    settingsLang:"Language", settingsCurrency:"Currency",
  },
};

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
const OB_STEPS_CREATE = ["welcome","langue","profil","devise","enveloppes","subcats","revenus"];
const OB_STEPS_IMPORT = ["welcome","import_confirm"];

function OnboardingScreen({ onComplete, prefillName="" }) {
  const [mode, setMode]   = useState(null); // null | "create" | "import"
  const [step, setStep]   = useState(0);
  const [lang, setLang]   = useState("fr");
  const [pName, setPName] = useState(prefillName);
  const [currency, setCur]= useState("Ar");
  const [importedData, setImportedData] = useState(null);
  const [importErr, setImportErr]       = useState("");

  const t = I18N[lang];
  const steps   = mode==="import" ? OB_STEPS_IMPORT : OB_STEPS_CREATE;
  const step_id = steps[step] || "welcome";

  const [envs, setEnvs] = useState([
    { id:"survie",       label:"Survie",       color:"#F87171" },
    { id:"operationnel", label:"Opérationnel", color:"#34D399" },
    { id:"differable",   label:"Différable",   color:"#94A3B8" },
  ]);
  const [newEnvLabel, setNEL] = useState("");
  const [newEnvColor, setNEC] = useState("#B4FF00");

  const [subcatMap, setSubcatMap] = useState({
    survie:       ["Repas","Transport","Eau","Électricité","Hygiène","Téléphone"],
    operationnel: ["Data","Déplacement client","Matériel"],
    differable:   ["Loisirs","Vêtements","Cadeaux"],
  });
  const [newScLabels, setNewScLabels] = useState({});

  const allEnvIds = () => ["tresorerie",...envs.map(e=>e.id)];
  const makeDefaultSplit = () => Object.fromEntries(allEnvIds().map(id=>[id,0]));
  const [rules, setRules] = useState([
    { key:"revenu1", label:"Revenu régulier", icon:"🏠", color:"#B4FF00",
      split:{ tresorerie:30, survie:60, operationnel:10, differable:0 } },
    { key:"revenu2", label:"Revenu variable",  icon:"💼", color:"#A78BFA",
      split:{ tresorerie:50, survie:0,  operationnel:30, differable:20 } },
  ]);

  const allRulesValid = rules.every(r=>{
    const tot = allEnvIds().reduce((a,id)=>a+(parseFloat(r.split[id])||0),0);
    return Math.round(tot)===100;
  });

  const canNext = step_id==="langue"       ? true
    : step_id==="profil"       ? pName.trim().length>0
    : step_id==="devise"       ? true
    : step_id==="enveloppes"   ? envs.length>0
    : step_id==="subcats"      ? true
    : step_id==="revenus"      ? allRulesValid
    : step_id==="import_confirm" ? !!importedData&&pName.trim().length>0
    : false;

  function handleImportFile(file) {
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if(!parsed.data){ setImportErr("Fichier invalide."); return; }
        setImportedData(parsed);
        if(parsed.profile?.name) setPName(parsed.profile.name);
        setImportErr("");
      } catch { setImportErr("Erreur de lecture du fichier."); }
    };
    reader.readAsText(file);
  }

  function finish() {
    if(importedData) {
      const TRES = { id:"tresorerie", label:t.tresorerie, color:"#B4FF00", bg:"#141005", system:true };
      let envList = importedData.data.env || DEFAULT_ENVELOPES;
      if(!envList.some(x=>x.id==="tresorerie")) envList=[TRES,...envList];
      envList = envList.map(x=>x.id==="tresorerie"?{...x,system:true}:x);
      onComplete({ name:pName.trim()||importedData.profile?.name||"Profil",
        currency:importedData.data.currency||"Ar", lang,
        envelopes:envList, incomeRules:importedData.data.ir||DEFAULT_INCOME_RULES,
        subcats:importedData.data.sub||DEFAULT_SUBCATS, imported:importedData.data });
      return;
    }
    const TRES = { id:"tresorerie", label:t.tresorerie, color:"#B4FF00", bg:"#141005", system:true };
    const fullEnvs = [TRES,...envs.map(e=>({...e,bg:"#0A1A0C"}))];
    const irObj = {};
    rules.forEach(r=>{ irObj[r.key]={ label:r.label, icon:r.icon, color:r.color, split:r.split }; });
    const subcats = [{ id:"reserve", label:"Mise en réserve", envelopeId:"tresorerie" }];
    envs.forEach(e=>{ (subcatMap[e.id]||[]).forEach(lbl=>subcats.push({ id:uid(), label:lbl, envelopeId:e.id })); });
    onComplete({ name:pName.trim(), currency, lang, envelopes:fullEnvs, incomeRules:irObj, subcats, imported:null });
  }

  const inp = { width:"100%",padding:"12px 14px",borderRadius:12,border:"1px solid #1E3D22",background:"#060E08",color:"#E8FFD4",fontSize:15,outline:"none",boxSizing:"border-box" };
  const Btn = ({active,onClick,children,secondary}) => (
    <button onClick={onClick} disabled={active===false} style={{
      flex:1,padding:"14px 0",borderRadius:14,
      border:secondary?"1px solid #1E3D22":"none",
      background:secondary?"none":active===false?"#0A1A0C":"#B4FF00",
      color:secondary?"#3A6040":active===false?"#3A6040":"#020303",
      fontSize:15,fontWeight:800,cursor:active===false?"not-allowed":"pointer",
    }}>{children}</button>
  );
  const ExBox = ({text}) => (
    <div style={{background:"#040C06",border:"1px solid #1E3D22",borderRadius:10,padding:"10px 12px",marginBottom:18,fontSize:12,color:"#3A6040",lineHeight:1.6}}>{text}</div>
  );
  const dotSteps = OB_STEPS_CREATE.slice(1);
  const dotIndex = mode==="create" ? step-1 : -1;

  return (
    <div style={{position:"fixed",inset:0,background:"#020303",zIndex:500,overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{width:"100%",maxWidth:430,flex:1,display:"flex",flexDirection:"column"}}>

        <div style={{padding:"52px 24px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <div style={{width:52,height:52,borderRadius:14,overflow:"hidden"}}><img src="/icon-192.png" alt="Kajy" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
          <div style={{fontSize:11,color:"#3A6040",letterSpacing:2,fontWeight:700,textTransform:"uppercase"}}>{t.config}</div>
          {mode==="create"&&step>0&&(
            <div style={{display:"flex",gap:5}}>
              {dotSteps.map((_,i)=>(
                <div key={i} style={{width:i===dotIndex?8:6,height:i===dotIndex?8:6,borderRadius:"50%",background:i<dotIndex?"#5FD34A":i===dotIndex?"#B4FF00":"#1E3D22",transition:"all .2s"}}/>
              ))}
            </div>
          )}
        </div>

        <div style={{flex:1,padding:"20px 24px 32px"}}>

          {step_id==="welcome"&&(
            <>
              <div style={{fontSize:24,fontWeight:800,color:"#E8FFD4",marginBottom:6}}>{t.welcome}</div>
              <div style={{fontSize:13,color:"#3A6040",marginBottom:28}}>{t.welcomeSub}</div>

              <button onClick={()=>{ setMode("create"); setStep(1); }}
                style={{width:"100%",padding:"18px 20px",borderRadius:14,border:"1.5px solid #B4FF00",background:"#0B1A0C",cursor:"pointer",textAlign:"left",marginBottom:12,display:"flex",flexDirection:"column",gap:4}}>
                <div style={{fontSize:15,fontWeight:800,color:"#B4FF00"}}>✦ {t.createNew}</div>
                <div style={{fontSize:12,color:"#3A6040"}}>{t.createNewSub}</div>
              </button>

              <div style={{background:"#060E08",borderRadius:14,padding:"16px 20px",border:"1px solid #122416"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#E8FFD4",marginBottom:3}}>{t.importExisting}</div>
                <div style={{fontSize:12,color:"#3A6040",marginBottom:12}}>{t.importExistingSub}</div>
                {importedData?(
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{flex:1,padding:"10px 14px",borderRadius:10,background:"#0F2010",border:"1px solid #B4FF0040",color:"#B4FF00",fontSize:13,fontWeight:700}}>
                      ✓ {importedData.profile?.name||"Backup"} — {t.importDoneLabel}
                    </div>
                    <button onClick={()=>{ setMode("import"); setStep(1); }} style={{padding:"10px 16px",borderRadius:10,border:"none",background:"#B4FF00",color:"#020303",fontWeight:800,fontSize:13,cursor:"pointer"}}>
                      {t.next}
                    </button>
                  </div>
                ):(
                  <label style={{display:"block",padding:"11px 0",borderRadius:12,border:"1.5px dashed #1E3D22",background:"#040806",color:"#3A6040",fontSize:13,fontWeight:700,cursor:"pointer",textAlign:"center"}}>
                    {t.importBtn}
                    <input type="file" accept="application/json" style={{display:"none"}} onChange={e=>handleImportFile(e.target.files[0])}/>
                  </label>
                )}
                {importErr&&<div style={{fontSize:11,color:"#F87171",marginTop:6}}>{importErr}</div>}
              </div>
            </>
          )}

          {step_id==="import_confirm"&&(
            <>
              <div style={{fontSize:22,fontWeight:800,color:"#E8FFD4",marginBottom:6}}>{t.name}</div>
              <div style={{fontSize:13,color:"#3A6040",marginBottom:12}}>{t.nameSub}</div>
              <ExBox text={t.nameEx}/>
              <input style={inp} value={pName} onChange={e=>setPName(e.target.value)} placeholder={t.namePh} autoFocus
                onKeyDown={e=>e.key==="Enter"&&canNext&&finish()}/>
              {importedData&&<div style={{fontSize:12,color:"#5FD34A",marginTop:10,fontWeight:600}}>✓ Données depuis "{importedData.profile?.name||"backup"}" prêtes</div>}
            </>
          )}

          {step_id==="langue"&&(
            <>
              <div style={{fontSize:22,fontWeight:800,color:"#E8FFD4",marginBottom:6}}>{t.lang}</div>
              <div style={{fontSize:13,color:"#3A6040",marginBottom:20}}>{t.langSub}</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {Object.entries(LANGS).map(([code,label])=>(
                  <button key={code} onClick={()=>setLang(code)} style={{padding:"14px 16px",borderRadius:12,border:`1.5px solid ${lang===code?"#B4FF00":"#122416"}`,background:lang===code?"#0F2010":"#060E08",color:lang===code?"#B4FF00":"#E8FFD4",fontSize:15,fontWeight:lang===code?700:500,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    {label}{lang===code&&<span style={{color:"#B4FF00"}}>✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}

          {step_id==="profil"&&(
            <>
              <div style={{fontSize:22,fontWeight:800,color:"#E8FFD4",marginBottom:6}}>{t.name}</div>
              <div style={{fontSize:13,color:"#3A6040",marginBottom:12}}>{t.nameSub}</div>
              <ExBox text={t.nameEx}/>
              <input style={inp} value={pName} onChange={e=>setPName(e.target.value)} placeholder={t.namePh} autoFocus
                onKeyDown={e=>e.key==="Enter"&&canNext&&setStep(s=>s+1)}/>
            </>
          )}

          {step_id==="devise"&&(
            <>
              <div style={{fontSize:22,fontWeight:800,color:"#E8FFD4",marginBottom:6}}>{t.currency}</div>
              <div style={{fontSize:13,color:"#3A6040",marginBottom:12}}>{t.currencySub}</div>
              <ExBox text={t.currencyEx}/>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {CURRENCIES.map(c=>(
                  <button key={c.code} onClick={()=>setCur(c.code)} style={{padding:"13px 16px",borderRadius:12,border:`1.5px solid ${currency===c.code?"#B4FF00":"#122416"}`,background:currency===c.code?"#0F2010":"#060E08",color:currency===c.code?"#B4FF00":"#E8FFD4",fontSize:13,fontWeight:currency===c.code?700:500,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    {c.label}{currency===c.code&&<span style={{color:"#B4FF00"}}>✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}

          {step_id==="enveloppes"&&(
            <>
              <div style={{fontSize:22,fontWeight:800,color:"#E8FFD4",marginBottom:6}}>{t.envelopes}</div>
              <div style={{fontSize:13,color:"#3A6040",marginBottom:12}}>{t.envelopesSub}</div>
              <ExBox text={t.envelopesEx}/>
              <div style={{padding:"11px 14px",borderRadius:12,border:"1px solid #B4FF0030",background:"#0F2010",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:"#B4FF00",flexShrink:0}}/>
                <span style={{fontSize:14,color:"#B4FF00",fontWeight:700,flex:1}}>{t.tresorerie}</span>
                <span style={{fontSize:10,color:"#3A6040",fontWeight:700}}>{t.system_label}</span>
              </div>
              {envs.map((e,i)=>(
                <div key={e.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <div style={{width:12,height:12,borderRadius:"50%",background:e.color,flexShrink:0}}/>
                  <input value={e.label} onChange={ev=>setEnvs(p=>p.map((x,j)=>j===i?{...x,label:ev.target.value}:x))}
                    style={{...inp,flex:1,padding:"10px 12px",fontSize:14}}/>
                  <button onClick={()=>setEnvs(p=>p.filter((_,j)=>j!==i))} style={{background:"#1A0808",border:"none",color:"#F87171",borderRadius:8,width:34,height:34,cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>
                </div>
              ))}
              <div style={{display:"flex",gap:8,marginTop:8,alignItems:"center"}}>
                <div style={{width:12,height:12,borderRadius:"50%",background:newEnvColor,flexShrink:0}}/>
                <input value={newEnvLabel} onChange={e=>setNEL(e.target.value)} placeholder={t.envelopesAdd}
                  style={{...inp,flex:1,padding:"10px 12px",fontSize:14}}
                  onKeyDown={e=>{if(e.key==="Enter"&&newEnvLabel.trim()){setEnvs(p=>[...p,{id:uid(),label:newEnvLabel.trim(),color:newEnvColor}]);setNEL("");}}}/>
                <input type="color" value={newEnvColor} onChange={e=>setNEC(e.target.value)}
                  style={{width:34,height:34,borderRadius:8,border:"none",background:"none",cursor:"pointer",padding:0,flexShrink:0}}/>
                <button onClick={()=>{if(!newEnvLabel.trim())return;setEnvs(p=>[...p,{id:uid(),label:newEnvLabel.trim(),color:newEnvColor}]);setNEL("");}}
                  style={{padding:"0 14px",borderRadius:10,border:"none",background:"#B4FF00",color:"#020303",fontWeight:800,fontSize:18,cursor:"pointer",height:34,flexShrink:0}}>+</button>
              </div>
            </>
          )}

          {step_id==="subcats"&&(
            <>
              <div style={{fontSize:22,fontWeight:800,color:"#E8FFD4",marginBottom:6}}>{t.subcats}</div>
              <div style={{fontSize:13,color:"#3A6040",marginBottom:12}}>{t.subcatsSub}</div>
              <ExBox text={t.subcatsEx}/>
              {envs.map(e=>{
                const items=subcatMap[e.id]||[];
                const newLabel=newScLabels[e.id]||"";
                return (
                  <div key={e.id} style={{marginBottom:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:e.color}}/>
                      <span style={{fontSize:13,fontWeight:700,color:e.color}}>{e.label}</span>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                      {items.map((lbl,li)=>(
                        <div key={li} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:20,background:"#060E08",border:"1px solid #1E3D22"}}>
                          <span style={{fontSize:12,color:"#E8FFD4"}}>{lbl}</span>
                          <button onClick={()=>setSubcatMap(m=>({...m,[e.id]:items.filter((_,j)=>j!==li)}))}
                            style={{background:"none",border:"none",color:"#F87171",cursor:"pointer",padding:0,fontSize:13,lineHeight:1}}>×</button>
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <input value={newLabel} onChange={ev=>setNewScLabels(m=>({...m,[e.id]:ev.target.value}))}
                        placeholder={t.subcatsAdd} style={{...inp,flex:1,padding:"9px 12px",fontSize:13}}
                        onKeyDown={ev=>{if(ev.key==="Enter"&&newLabel.trim()){setSubcatMap(m=>({...m,[e.id]:[...items,newLabel.trim()]}));setNewScLabels(m=>({...m,[e.id]:""}));}}}/>
                      <button onClick={()=>{if(!newLabel.trim())return;setSubcatMap(m=>({...m,[e.id]:[...items,newLabel.trim()]}));setNewScLabels(m=>({...m,[e.id]:""}));}}
                        style={{padding:"0 14px",borderRadius:10,border:"none",background:"#B4FF00",color:"#020303",fontWeight:800,fontSize:18,cursor:"pointer",height:36,flexShrink:0}}>+</button>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {step_id==="revenus"&&(
            <>
              <div style={{fontSize:22,fontWeight:800,color:"#E8FFD4",marginBottom:6}}>{t.revenues}</div>
              <div style={{fontSize:13,color:"#3A6040",marginBottom:12}}>{t.revenuesSub}</div>
              <ExBox text={t.revenuesEx}/>
              {rules.map((r,ri)=>{
                const allE=[{id:"tresorerie",label:t.tresorerie,color:"#B4FF00"},...envs];
                const total=allE.reduce((a,e)=>a+(parseFloat(r.split[e.id])||0),0);
                const valid=Math.round(total)===100;
                return (
                  <div key={r.key} style={{background:"#060E08",borderRadius:14,padding:"14px",border:`1.5px solid ${valid?"#B4FF0040":"#122416"}`,marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                      <span style={{fontSize:20}}>{r.icon}</span>
                      <input value={r.label} onChange={e=>setRules(p=>p.map((x,i)=>i===ri?{...x,label:e.target.value}:x))}
                        style={{...inp,flex:1,padding:"6px 10px",fontSize:14,fontWeight:700}}/>
                      <span style={{fontSize:11,fontWeight:700,color:valid?"#34D399":"#F87171",flexShrink:0}}>{Math.round(total)}%</span>
                      {rules.length>1&&<button onClick={()=>setRules(p=>p.filter((_,i)=>i!==ri))} style={{background:"none",border:"none",color:"#F87171",cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>}
                    </div>
                    {allE.map(e=>(
                      <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:e.color,flexShrink:0}}/>
                        <span style={{fontSize:13,color:"#E8FFD4",flex:1}}>{e.label}</span>
                        <input type="number" min="0" max="100" value={r.split[e.id]??0}
                          onChange={ev=>setRules(p=>p.map((x,i)=>i===ri?{...x,split:{...x.split,[e.id]:ev.target.value}}:x))}
                          style={{width:52,padding:"4px 8px",borderRadius:8,border:"1px solid #122416",background:"#040806",color:"#E8FFD4",fontSize:13,fontWeight:700,outline:"none",textAlign:"center"}}/>
                        <span style={{fontSize:12,color:"#3A6040"}}>%</span>
                      </div>
                    ))}
                  </div>
                );
              })}
              <button onClick={()=>setRules(p=>[...p,{key:uid(),label:"Nouveau revenu",icon:"💰",color:"#F472B6",split:makeDefaultSplit()}])}
                style={{width:"100%",padding:"11px 0",borderRadius:12,border:"1px solid #122416",background:"#060E08",color:"#3A6040",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:4}}>
                {t.revenuesAdd}
              </button>
            </>
          )}

        </div>

        <div style={{padding:"0 24px 40px",display:"flex",gap:10}}>
          {step>0&&step_id!=="import_confirm"&&(
            <Btn secondary onClick={()=>step===1?(setMode(null),setStep(0)):setStep(s=>s-1)}>{t.back}</Btn>
          )}
          {step_id==="import_confirm"&&(
            <>
              <Btn secondary onClick={()=>{ setMode(null); setStep(0); }}>{t.back}</Btn>
              <Btn active={canNext} onClick={finish}>{t.go}</Btn>
            </>
          )}
          {step_id!=="welcome"&&step_id!=="revenus"&&step_id!=="import_confirm"&&(
            <Btn active={canNext} onClick={()=>setStep(s=>s+1)}>{t.next}</Btn>
          )}
          {step_id==="revenus"&&(
            <Btn active={allRulesValid} onClick={finish}>{t.go}</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE SETTINGS OVERLAY ────────────────────────────────────────────────
function ProfileSettingsOverlay({ ps_pid, profiles, pid, setLang, setCurrency, setSeuils, onClose }) {
  const ps_cur    = pload(ps_pid, "currency", "Ar");
  const ps_lang   = pload(ps_pid, "lang", "fr");
  const ps_seuils = pload(ps_pid, SEUILS_KEY, { alerte:60000, blocage:25000 });

  const [custA, setCustA] = useState(String(ps_seuils.alerte||60000));
  const [custB, setCustB] = useState(String(ps_seuils.blocage||25000));

  const profileName = profiles.find(p=>p.id===ps_pid)?.name || "";

  function saveLang(code) {
    psave(ps_pid, "lang", code);
    if (ps_pid===pid) setLang(code);
    onClose(); setTimeout(()=>{}, 0); // re-open with fresh state not needed here
  }
  function saveCurrency(code) {
    psave(ps_pid, "currency", code);
    if (ps_pid===pid) { setCurrency(code); fmt=makeFmt(code); }
  }
  function savePreset(preset) {
    const s = { presetId:preset.id, alerte:preset.alerte, blocage:preset.blocage };
    psave(ps_pid, SEUILS_KEY, s);
    if (ps_pid===pid) setSeuils(s);
  }
  function saveCustom() {
    const s = { presetId:"custom", alerte:parseInt(custA)||60000, blocage:parseInt(custB)||25000 };
    psave(ps_pid, SEUILS_KEY, s);
    if (ps_pid===pid) setSeuils(s);
  }

  // Re-read from storage each render so UI reflects changes
  const cur_seuils = pload(ps_pid, SEUILS_KEY, { alerte:60000, blocage:25000 });
  const cur_lang   = pload(ps_pid, "lang", "fr");
  const cur_cur    = pload(ps_pid, "currency", "Ar");

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(2,3,3,0.97)",zIndex:400,display:"flex",flexDirection:"column",maxWidth:430,margin:"0 auto"}}>
      <div style={{padding:"52px 20px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:18,fontWeight:800,color:T.text}}>⚙ {profileName}</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:T.sub,fontSize:24,cursor:"pointer"}}>×</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px"}}>

        {/* LANGUE */}
        <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:10}}>LANGUE</div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:24}}>
          {Object.entries(LANGS).map(([code,label])=>{
            const active = cur_lang===code;
            return (
              <button key={code} onClick={()=>saveLang(code)}
                style={{padding:"12px 16px",borderRadius:12,border:`1.5px solid ${active?"#B4FF00":T.border}`,background:active?"#0F2010":T.card,color:active?"#B4FF00":T.text,fontSize:14,fontWeight:active?700:500,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between"}}>
                {label}{active&&<span style={{color:"#B4FF00"}}>✓</span>}
              </button>
            );
          })}
        </div>

        {/* SEUILS */}
        <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:10}}>SEUILS D'ALERTE</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
          {SEUILS_PRESETS.filter(p=>p.id!=="custom").map(preset=>{
            const active = cur_seuils.presetId===preset.id;
            return (
              <button key={preset.id} onClick={()=>savePreset(preset)}
                style={{padding:"12px 14px",borderRadius:12,border:`1.5px solid ${active?"#B4FF00":T.border}`,background:active?"#0F2010":T.card,cursor:"pointer",textAlign:"left"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:13,fontWeight:700,color:active?"#B4FF00":T.text}}>{preset.emoji} {preset.label}</span>
                  {active&&<span style={{color:"#B4FF00",fontSize:12}}>✓</span>}
                </div>
                <div style={{fontSize:11,color:"#3A6040",marginBottom:6}}>{preset.desc}</div>
                <div style={{display:"flex",gap:12}}>
                  <span style={{fontSize:11,color:"#FBBF24"}}>🟡 {new Intl.NumberFormat("fr-FR").format(preset.alerte)}</span>
                  <span style={{fontSize:11,color:"#F87171"}}>🔴 {new Intl.NumberFormat("fr-FR").format(preset.blocage)}</span>
                </div>
              </button>
            );
          })}
          {/* Personnalisé */}
          <div style={{padding:"12px 14px",borderRadius:12,border:`1.5px solid ${cur_seuils.presetId==="custom"?"#B4FF00":T.border}`,background:cur_seuils.presetId==="custom"?"#0F2010":T.card}}>
            <div style={{fontSize:13,fontWeight:700,color:cur_seuils.presetId==="custom"?"#B4FF00":T.text,marginBottom:10}}>✏️ Personnalisé</div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:"#FBBF24",fontWeight:700,marginBottom:4}}>🟡 ALERTE</div>
                <input type="number" value={custA} onChange={e=>setCustA(e.target.value)}
                  style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #1E3D22",background:"#040806",color:T.text,fontSize:13,outline:"none"}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:"#F87171",fontWeight:700,marginBottom:4}}>🔴 BLOCAGE</div>
                <input type="number" value={custB} onChange={e=>setCustB(e.target.value)}
                  style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #1E3D22",background:"#040806",color:T.text,fontSize:13,outline:"none"}}/>
              </div>
            </div>
            <button onClick={saveCustom}
              style={{width:"100%",padding:"9px 0",borderRadius:8,border:"none",background:"#B4FF00",color:"#020303",fontSize:13,fontWeight:800,cursor:"pointer"}}>
              Appliquer
            </button>
          </div>
        </div>

        {/* DEVISE */}
        <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:10}}>DEVISE</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {CURRENCIES.map(c=>{
            const active = cur_cur===c.code;
            return (
              <button key={c.code} onClick={()=>saveCurrency(c.code)}
                style={{padding:"12px 16px",borderRadius:12,border:`1.5px solid ${active?"#B4FF00":T.border}`,background:active?"#0F2010":T.card,color:active?"#B4FF00":T.text,fontSize:13,fontWeight:active?700:500,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between"}}>
                {c.label}{active&&<span style={{color:"#B4FF00"}}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{padding:"16px 20px 32px"}}>
        <button onClick={onClose} style={{width:"100%",padding:"13px 0",borderRadius:14,border:"none",background:"#B4FF00",color:"#020303",fontSize:15,fontWeight:800,cursor:"pointer"}}>
          Fermer
        </button>
      </div>
    </div>
  );
}


// ─── OVERDRAFT MODAL ──────────────────────────────────────────────────────────
function OverdraftModal({ overdraft, envelopes, bal, fmt, onCancel, onConfirm }) {
  const { envId, envLabel, currentBal, amt, shortage } = overdraft;
  const [selectedFallback, setSelectedFallback] = useState(null);
  const fallbackEnvs = envelopes.filter(e=>e.id!==envId&&e.id!=="tresorerie"&&(bal[e.id]||0)>0);
  const fallbackBal = selectedFallback ? (bal[selectedFallback]||0) : 0;
  const covered     = selectedFallback ? Math.min(shortage, fallbackBal) : 0;
  const remaining   = shortage - covered;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(2,3,3,0.96)",zIndex:900,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",padding:"0 0 32px"}}>
      <div style={{width:"100%",maxWidth:430,background:"#060E08",borderRadius:"20px 20px 0 0",border:"1px solid #1E3D22",padding:"24px 20px 8px"}}>

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <span style={{fontSize:22}}>⚠️</span>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"#F87171"}}>Solde insuffisant</div>
            <div style={{fontSize:12,color:"#3A6040"}}>{envLabel} — {fmt(currentBal)} disponible</div>
          </div>
        </div>

        <div style={{background:"#040806",borderRadius:12,padding:"12px 14px",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,color:"#3A6040"}}>Dépense</span>
            <span style={{fontSize:13,fontWeight:700,color:"#E8FFD4"}}>{fmt(amt)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,color:"#3A6040"}}>Solde {envLabel}</span>
            <span style={{fontSize:13,fontWeight:700,color:"#F87171"}}>{fmt(currentBal)}</span>
          </div>
          <div style={{borderTop:"1px solid #122416",paddingTop:6,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:12,color:"#3A6040"}}>Manque</span>
            <span style={{fontSize:14,fontWeight:800,color:"#F87171"}}>{fmt(shortage)}</span>
          </div>
        </div>

        <div style={{fontSize:11,fontWeight:700,color:"#3A6040",letterSpacing:1.5,marginBottom:10}}>
          COUVRIR LE MANQUE DEPUIS
        </div>

        {fallbackEnvs.length===0?(
          <div style={{padding:"12px 14px",borderRadius:12,background:"#1A0808",border:"1px solid #F8717140",marginBottom:16}}>
            <div style={{fontSize:13,color:"#F87171",fontWeight:600}}>Aucune enveloppe disponible</div>
            <div style={{fontSize:11,color:"#3A6040",marginTop:4}}>Le manque de {fmt(shortage)} passera en négatif sur {envLabel}.</div>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            {fallbackEnvs.map(e=>{
              const active = selectedFallback===e.id;
              const eBal   = bal[e.id]||0;
              const canCover = Math.min(shortage, eBal);
              return (
                <button key={e.id} onClick={()=>setSelectedFallback(active?null:e.id)}
                  style={{padding:"11px 14px",borderRadius:12,border:`1.5px solid ${active?e.color:"#122416"}`,background:active?"#0B1A0C":"#040806",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:e.color}}/>
                    <span style={{fontSize:13,fontWeight:700,color:active?e.color:"#E8FFD4"}}>{e.label}</span>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:12,fontWeight:700,color:active?e.color:"#3A6040"}}>{fmt(eBal)}</div>
                    {active&&<div style={{fontSize:10,color:"#3A6040"}}>couvre {fmt(canCover)}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedFallback&&(
          <div style={{background:"#040806",borderRadius:12,padding:"12px 14px",marginBottom:16,border:"1px solid #1E3D22"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:"#3A6040"}}>{envLabel} après</span>
              <span style={{fontSize:13,fontWeight:700,color:"#F87171"}}>{fmt(currentBal-amt)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:"#3A6040"}}>{envelopes.find(e=>e.id===selectedFallback)?.label} après</span>
              <span style={{fontSize:13,fontWeight:700,color:"#E8FFD4"}}>{fmt(fallbackBal-covered)}</span>
            </div>
            {remaining>0&&(
              <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid #122416",paddingTop:6}}>
                <span style={{fontSize:11,color:"#F87171"}}>Reste en négatif</span>
                <span style={{fontSize:12,fontWeight:700,color:"#F87171"}}>{fmt(remaining)}</span>
              </div>
            )}
          </div>
        )}

        <div style={{display:"flex",gap:10,paddingBottom:8}}>
          <button onClick={onCancel}
            style={{flex:1,padding:"13px 0",borderRadius:12,border:"1px solid #122416",background:"none",color:"#3A6040",fontSize:14,fontWeight:700,cursor:"pointer"}}>
            Annuler
          </button>
          <button onClick={()=>onConfirm(selectedFallback)}
            style={{flex:2,padding:"13px 0",borderRadius:12,border:"none",background:"#F87171",color:"#020303",fontSize:14,fontWeight:800,cursor:"pointer"}}>
            {!selectedFallback ? "Forcer (négatif)" : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const isDesktop = useIsDesktop();
  const [unlocked, setUnlocked] = useState(() => load(UNLOCKED_KEY, false));
  const [showChangePin, setShowChangePin] = useState(false);

  const [swStatus, setSwStatus] = useState("checking");
  const [swDebug, setSwDebug] = useState(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) { setSwStatus("unsupported"); return; }
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) { setSwStatus("not-registered"); return; }
      if (reg.active) setSwStatus("active");
      else if (reg.installing) setSwStatus("installing");
      else if (reg.waiting) setSwStatus("waiting");
      else setSwStatus("registered-no-worker");
      setSwDebug({
        scope: reg.scope,
        active: !!reg.active,
        installing: !!reg.installing,
        waiting: !!reg.waiting,
      });
    }).catch(err => setSwStatus("error: " + err.message));

    if (navigator.serviceWorker) {
      caches.keys().then(keys => {
        setSwDebug(d => ({ ...(d||{}), cacheNames: keys }));
      });
    }
  }, []);

  // ── Profile system ──────────────────────────────────────────────────────────
  const [profiles,setProfiles]  = useState(()=>load("sf_profiles",DEFAULT_PROFILES));
  const [activeId,setActiveId]  = useState(()=>load("sf_active","default"));
  const [showProfiles,setShowP] = useState(false);
  const [newPName,setNPN]       = useState("");
  const [profileSettings,setProfSettings] = useState(null); // { profileId } | null

  const pid = activeId; // shorthand
  const activeProfile = profiles.find(p=>p.id===pid)||profiles[0];

  // ── Onboarding ──────────────────────────────────────────────────────────────
  // null = no onboarding, { profileId, prefillName } = onboarding in progress
  const [onboarding, setOnboarding] = useState(()=>{
    // Trigger onboarding for default profile if it has never been configured
    const defaultConfigured = load("sf_ob_default", false);
    if (!defaultConfigured) return { profileId:"default", prefillName:"" };
    return null;
  });

  // ── Language per profile ─────────────────────────────────────────────────────
  const [lang, setLang] = useState(()=>pload(pid,"lang","fr"));
  useEffect(()=>{ psave(pid,"lang",lang); },[lang,pid]);

  // ── Currency per profile ─────────────────────────────────────────────────────
  const [currency, setCurrency] = useState(()=>pload(pid,"currency","Ar"));
  // Keep global fmt in sync with active profile currency
  fmt = makeFmt(currency);
  useEffect(()=>{ psave(pid,"currency",currency); },[currency,pid]);

  // ── Seuils per profile ───────────────────────────────────────────────────────
  const [seuils, setSeuils] = useState(()=>pload(pid, SEUILS_KEY, { alerte:60000, blocage:25000 }));
  SEUILS = seuils; // keep global in sync
  useEffect(()=>{ psave(pid, SEUILS_KEY, seuils); SEUILS=seuils; },[seuils,pid]);

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

  // Keep incomeType pointing to a valid, existing income rule at all times.
  // Prevents crash when the previously selected type was deleted.
  useEffect(() => {
    if (!incomeRules[incomeType]) {
      const firstKey = Object.keys(incomeRules)[0];
      if (firstKey) setIT(firstKey);
    }
  }, [incomeRules, incomeType]);
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
  const [editingProfile,setEP] = useState(null);
  const [editingPName,setEPN]  = useState("");
  const [editingSubcat,setESC] = useState(null);
  const [editingSubLabel,setESL] = useState("");
  const [editingIR,setEIR]     = useState(null);
  const [editingIRLabel,setEIRL] = useState("");
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
    setCurrency(pload(id,"currency","Ar"));
    setLang(pload(id,"lang","fr"));
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
      app: "kajy",
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
    a.download = `kajy-${safeName}-${new Date().toISOString().slice(0,10)}.json`;
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
    setShowP(false);
    // Launch onboarding for new profile
    setOnboarding({ profileId: np.id, prefillName: newPName.trim() });
  }

  function completeOnboarding({ name, currency: cur, lang: lg, envelopes: envs, incomeRules: ir, subcats: sc, imported }) {
    const pid2 = onboarding.profileId;
    // Rename profile if name changed
    setProfiles(ps=>ps.map(p=>p.id===pid2?{...p,name:name||p.name}:p));
    // Save all profile data
    psave(pid2,"currency", cur);
    psave(pid2,"lang", lg||"fr");
    psave(pid2,"env", envs);
    psave(pid2,"sub", sc);
    psave(pid2,"ir", ir);
    const initBal = imported?.bal || Object.fromEntries(envs.map(e=>[e.id,0]));
    psave(pid2,"bal", initBal);
    psave(pid2,"txs", imported?.txs || []);
    psave(pid2,"max", imported?.max || {});
    psave(pid2,"sinks", imported?.sinks || []);
    psave(pid2,"re",  imported?.re || []);
    // Mark this profile as configured so onboarding doesn't re-trigger
    save(`sf_ob_${pid2}`, true);
    setOnboarding(null);
    switchProfile(pid2);
  }

  function deleteProfile(id) {
    if(profiles.length<=1) return;
    const remaining = profiles.filter(p=>p.id!==id);
    setProfiles(remaining);
    if(activeId===id) switchProfile(remaining[0].id);
  }

  function renameProfile(id, newName) {
    if(!newName.trim()) return;
    setProfiles(ps => ps.map(p => p.id===id ? {...p, name:newName.trim()} : p));
  }

  // Calculate disponible from all non-system envelopes, defaulting missing keys to 0
  const disponible = envelopes
    .filter(e=>!e.system)
    .reduce((a,e)=>a+(bal[e.id]||0), 0);
  const amt = parseFloat(amount)||0;

  let sColor="#34D399",sBg="#061510",sMsg="✅ Situation stable";
  if(disponible<=SEUILS.blocage){sColor="#F87171";sBg="#1A0808";sMsg="🔴 Blocage — Survie uniquement";}
  else if(disponible<=SEUILS.alerte){sColor="#B4FF00";sBg="#141005";sMsg="🟡 Alerte — Relancer un client";}

  // ── Overdraft modal ──────────────────────────────────────────────────────────
  const [overdraft, setOverdraft] = useState(null);
  // overdraft = { tx, envelopeId, envelopeLabel, currentBal, amt, shortage }

  function submit() {
    if(!amt) return;
    const tx={ id:uid(), date:new Date(txDate).toISOString(), type:addMode, amount:amt, label, note, incomeType, subcatId, recur };

    if(addMode==="income"){
      const rule=incomeRules[incomeType];
      if(!rule) return;
      const nb={...bal}, nm={...envMax};
      Object.entries(rule.split).forEach(([k,p])=>{
        if(p){ nb[k]=(nb[k]||0)+amt*p/100; nm[k]=nb[k]; }
      });
      setBal(nb); setEnvMax(nm); setTxs([tx,...txs]);
      setAmount(""); setLabel(""); setNote(""); setShowNote(false); setRecur("none");
      setTxDate(new Date().toISOString().slice(0,10)); setTab("home");
      return;
    }

    // ── EXPENSE — check for overdraft ────────────────────────────────────────
    const sc = subcats.find(s=>s.id===subcatId);
    if(!sc?.envelopeId) return;
    const envId = sc.envelopeId;
    const currentBal = bal[envId]||0;

    if(amt > currentBal) {
      // Trigger overdraft modal
      const env = envelopes.find(e=>e.id===envId);
      setOverdraft({
        tx, envId, envLabel:env?.label||envId,
        currentBal, amt, shortage: amt - currentBal,
      });
      return;
    }

    // Normal expense — enough balance
    const nb={...bal};
    nb[envId]=(nb[envId]||0)-amt;
    setBal(nb); setTxs([tx,...txs]);
    setAmount(""); setLabel(""); setNote(""); setShowNote(false); setRecur("none");
    setTxDate(new Date().toISOString().slice(0,10)); setTab("home");
  }

  function confirmOverdraft(fallbackEnvId) {
    if(!overdraft) return;
    const { tx, envId, currentBal, amt, shortage } = overdraft;
    const nb = {...bal};

    // Main envelope goes negative
    nb[envId] = currentBal - amt;

    // Fallback envelope covers what it can
    if(fallbackEnvId && fallbackEnvId !== envId) {
      const fallbackBal = nb[fallbackEnvId]||0;
      const covered = Math.min(shortage, Math.max(0, fallbackBal));
      if(covered > 0) nb[fallbackEnvId] = fallbackBal - covered;
    }

    setBal(nb);
    setTxs([tx,...txs]);
    setOverdraft(null);
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
            if((nb[k]||0) > (nm[k]||0)) nm[k] = nb[k];
          }
        });
      } else {
        const sc = subcats.find(s=>s.id===tx.subcatId);
        if(sc?.envelopeId) nb[sc.envelopeId] = (nb[sc.envelopeId]||0) - tx.amount;
        if(tx.fallbackEnvId && tx.fallbackCovered) {
          nb[tx.fallbackEnvId] = (nb[tx.fallbackEnvId]||0) - tx.fallbackCovered;
        }
      }
    });
    // ⚠️ Déduire les sinking funds alloués de la Trésorerie
    // sf.current représente de l'argent "bloqué" dans la Trésorerie — il faut le soustraire
    const sfTotal = sinkFunds.reduce((a,f)=>a+(f.current||0), 0);
    if(sfTotal > 0) nb["tresorerie"] = (nb["tresorerie"]||0) - sfTotal;
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
  function useSinkFund(sfId, amount, label, afterAction) {
    const f = sinkFunds.find(x=>x.id===sfId);
    if(!f||amount>f.current) return;
    // Record as expense from trésorerie
    const sc = subcats.find(s=>s.envelopeId==="tresorerie");
    const tx = { id:uid(), date:new Date().toISOString(), type:"expense", amount, label:`${label} (SF)`, note:`Sinking Fund — ${f.label}`, subcatId:sc?.id||"", incomeType:"", recur:"none" };
    setTxs(t=>[tx,...t]);
    // Deduct from trésorerie balance directly (SF funds are already in trésorerie)
    setBal(b=>({...b, tresorerie:(b.tresorerie||0)-amount}));
    // Handle SF after use
    if(afterAction==="close") {
      // Refund remaining back to trésorerie then delete
      const remaining = f.current - amount;
      if(remaining>0) setBal(b=>({...b, tresorerie:(b.tresorerie||0)+remaining}));
      setSF(sinkFunds.filter(x=>x.id!==sfId));
    } else {
      // Reset to zero, keep SF alive
      setSF(sinkFunds.map(x=>x.id===sfId?{...x,current:0}:x));
    }
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
    if(!rule) return null;
    return (
      <div style={{background:T.card2,borderRadius:12,padding:"12px 14px",border:`1px solid ${T.border}`}}>
        <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:10}}>RÉPARTITION AUTOMATIQUE</div>
        {Object.entries(rule.split||{}).map(([key,pct])=>{
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

  // ── LICENSE GATE — check once per device ────────────────────────────────────
  const [licensed, setLicensed] = useState(()=>load(LICENSE_KEY, false));
  if (!licensed) {
    return <LicenseScreen onUnlock={()=>setLicensed(true)}/>;
  }

  // ── LOCK GATE — show PIN screen until unlocked on this device ──────────────
  if (!unlocked) {
    return <LockScreen onUnlock={()=>setUnlocked(true)}/>;
  }

  // ── ONBOARDING GATE ──────────────────────────────────────────────────────────
  if (onboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} prefillName={onboarding.prefillName||""}/>;
  }

  return (
    <div style={{fontFamily:"'Space Grotesk','Inter',-apple-system,sans-serif",background:T.bg,minHeight:"100vh",color:T.text,display:"flex"}}>

      {/* ══ DESKTOP SIDEBAR ═══════════════════════════════════════════════════ */}
      {isDesktop && (
        <div style={{width:220,flexShrink:0,height:"100vh",position:"sticky",top:0,background:"#060E08",borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",padding:"28px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:32,padding:"0 8px"}}>
            <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#B4FF00,#5FD34A)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#020303",flexShrink:0}}>K</div>
            <div style={{fontSize:15,fontWeight:800,color:T.text}}>Kajy</div>
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
                    {editingProfile===p.id?(
                      <input value={editingPName} onChange={e=>setEPN(e.target.value)}
                        onClick={e=>e.stopPropagation()}
                        onBlur={()=>{ renameProfile(p.id, editingPName); setEP(null); }}
                        onKeyDown={e=>{ if(e.key==="Enter") e.target.blur(); }}
                        autoFocus
                        style={{width:"100%",padding:"3px 6px",borderRadius:6,border:`1px solid #B4FF0060`,background:"#040806",color:T.text,fontSize:15,fontWeight:700,outline:"none",boxSizing:"border-box"}}/>
                    ):(
                      <div style={{fontSize:15,fontWeight:700,color:activeId===p.id?"#B4FF00":T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                    )}
                    <div style={{fontSize:11,color:T.sub}}>{activeId===p.id?"Actif":"Appuyer pour switcher"}</div>
                  </div>
                  {activeId===p.id&&<span style={{color:"#B4FF00",fontSize:18,flexShrink:0}}>✓</span>}

                  {/* Rename icon */}
                  <button onClick={e=>{e.stopPropagation(); setEP(p.id); setEPN(p.name);}} title="Renommer" style={{background:"none",border:"none",color:T.sub,cursor:"pointer",padding:6,flexShrink:0,display:"flex"}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>

                  {/* Settings icon */}
                  <button onClick={e=>{e.stopPropagation(); setProfSettings({ profileId:p.id });}} title="Paramètres" style={{background:"none",border:"none",color:T.sub,cursor:"pointer",padding:6,flexShrink:0,display:"flex"}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                    </svg>
                  </button>

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

          {/* Bottom-right lock controls */}
          <div style={{position:"absolute",bottom:20,right:20,display:"flex",gap:8}}>
            <button onClick={()=>setShowChangePin(true)} title="Changer le code" style={{width:40,height:40,borderRadius:12,border:`1px solid #B4FF0060`,background:"#0B1A1240",color:"#B4FF00",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="16" r="1"/><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </button>
            <button onClick={()=>{ save(UNLOCKED_KEY,false); setUnlocked(false); }} title="Verrouiller" style={{width:40,height:40,borderRadius:12,border:`1px solid ${T.border}`,background:"#040806",color:T.sub,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </button>
          </div>

          {/* Change PIN modal */}
          {showChangePin && (
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:300}}>
              <ChangePinScreen onClose={()=>setShowChangePin(false)}/>
            </div>
          )}

          {/* Profile Settings overlay */}
          {profileSettings&&(
            <ProfileSettingsOverlay
              ps_pid={profileSettings.profileId}
              profiles={profiles}
              pid={pid}
              setProfiles={setProfiles}
              setLang={setLang}
              setCurrency={setCurrency}
              setSeuils={setSeuils}
              onClose={()=>setProfSettings(null)}
            />
          )}
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
                    return <SinkingCard key={f.id} fund={f} onDelete={deleteSink} onAdd={addToSink} onUse={useSinkFund} tresorerie={bal.tresorerie||0} totalAlloue={totalAlloue}/>;
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
                {amount||"0"} <span style={{fontSize:20,color:T.sub,fontWeight:600}}>{currency}</span>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:2,marginBottom:12}}>
              {["1","2","3","4","5","6","7","8","9",".",0,"⌫"].map((k,i)=>(
                <button key={i} onClick={()=>pressKey(String(k))} style={{padding:"15px 0",fontSize:k==="⌫"?20:22,fontWeight:600,background:k==="⌫"?"#040806":"#080F09",border:`1px solid ${T.border}`,borderRadius:10,cursor:"pointer",color:k==="⌫"?"#F87171":T.text}}>{k}</button>
              ))}
            </div>
            {/* ── Témoin seuil — uniquement en mode dépense ── */}
            {addMode==="expense"&&disponible<=seuils.alerte&&(
              <div style={{
                padding:"10px 14px",borderRadius:12,marginBottom:10,
                background:disponible<=seuils.blocage?"#1A0808":"#141005",
                border:`1px solid ${disponible<=seuils.blocage?"#F87171":"#B4FF00"}`,
                display:"flex",alignItems:"center",gap:10,
              }}>
                <span style={{fontSize:16,flexShrink:0}}>{disponible<=seuils.blocage?"🔴":"🟡"}</span>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:disponible<=seuils.blocage?"#F87171":"#B4FF00"}}>
                    {disponible<=seuils.blocage?"Zone de blocage":"Zone d'alerte"}
                  </div>
                  <div style={{fontSize:11,color:"#3A6040"}}>
                    Solde disponible : {fmt(disponible)} — Seuil : {fmt(disponible<=seuils.blocage?seuils.blocage:seuils.alerte)}
                  </div>
                </div>
              </div>
            )}
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
                    return <SinkingCard key={f.id} fund={f} onDelete={deleteSink} onAdd={addToSink} onUse={useSinkFund} tresorerie={bal.tresorerie||0} totalAlloue={totalAlloue}/>;
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
                          : <button onClick={()=>{
                              if(envelopes.length<=1) return;
                              const delId = env.id;
                              safeSetEnv(envelopes.filter(x=>x.id!==delId));
                              setSub(subcats.filter(s=>s.envelopeId!==delId));
                              // Purge this envelope's percentage from ALL income rules' splits
                              setIR(rules => Object.fromEntries(Object.entries(rules).map(([k,r]) => {
                                const { [delId]:_, ...rest } = r.split;
                                return [k, { ...r, split: rest }];
                              })));
                              // Clean up balances and max tracking for the deleted envelope
                              setBal(b => { const { [delId]:_, ...rest } = b; return rest; });
                              setEnvMax(m => { const { [delId]:_, ...rest } = m; return rest; });
                            }} style={{background:"none",border:"none",cursor:"pointer",color:"#F87171",fontSize:18,padding:"0 4px"}}>×</button>
                        }
                      </div>
                      {/* Color picker inline */}
                      {editingColor===env.id&&(
                        <div style={{padding:"10px 16px 14px",background:"#040806",borderBottom:`1px solid ${T.border}`}}>
                          <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:1.5,marginBottom:8}}>CHOISIR UNE COULEUR</div>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                            {["#F87171","#FBBF24","#34D399","#B4FF00","#60A5FA","#A78BFA","#F472B6","#FB923C","#94A3B8","#E2E8F0","#818CF8","#2DD4BF"].map(c=>(
                              <button key={c} onClick={()=>{
                                safeSetEnv(prev=>prev.map(x=>x.id===env.id?{...x,color:c,bg:c+"22"}:x));
                              }} style={{width:28,height:28,borderRadius:"50%",background:c,border:env.color===c?`3px solid ${T.text}`:"3px solid transparent",cursor:"pointer",flexShrink:0}}/>
                            ))}
                            {/* Custom color */}
                            <div style={{position:"relative",width:28,height:28}}>
                              <input type="color" value={env.color}
                                onChange={e=>{ const val=e.target.value; safeSetEnv(prev=>prev.map(x=>x.id===env.id?{...x,color:val,bg:val+"22"}:x)); }}
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
                            {editingSubcat===sc.id?(
                              <input value={editingSubLabel} onChange={e=>setESL(e.target.value)}
                                onBlur={()=>{ if(editingSubLabel.trim()) setSub(subcats.map(x=>x.id===sc.id?{...x,label:editingSubLabel.trim()}:x)); setESC(null); }}
                                onKeyDown={e=>{ if(e.key==="Enter") e.target.blur(); }}
                                autoFocus
                                style={{flex:1,padding:"3px 6px",borderRadius:6,border:`1px solid ${env.color}60`,background:"#040806",color:T.text,fontSize:14,outline:"none"}}/>
                            ):(
                              <div onClick={()=>{ setESC(sc.id); setESL(sc.label); }} style={{flex:1,fontSize:14,color:T.text,cursor:"pointer"}}>{sc.label}</div>
                            )}
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
                      <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
                        <span style={{fontSize:18}}>{r.icon}</span>
                        {editingIR===k?(
                          <input value={editingIRLabel} onChange={e=>setEIRL(e.target.value)}
                            onBlur={()=>{ if(editingIRLabel.trim()) setIR(rules=>({...rules,[k]:{...rules[k],label:editingIRLabel.trim()}})); setEIR(null); }}
                            onKeyDown={e=>{ if(e.key==="Enter") e.target.blur(); }}
                            autoFocus
                            style={{flex:1,padding:"3px 6px",borderRadius:6,border:`1px solid ${r.color}60`,background:"#040806",color:T.text,fontSize:14,fontWeight:700,outline:"none"}}/>
                        ):(
                          <span onClick={()=>{ setEIR(k); setEIRL(r.label); }} style={{fontSize:14,fontWeight:700,color:T.text,cursor:"pointer"}}>{r.label}</span>
                        )}
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

      {/* ── OVERDRAFT MODAL ── */}
      {overdraft&&<OverdraftModal
        overdraft={overdraft}
        envelopes={envelopes}
        bal={bal}
        fmt={fmt}
        onCancel={()=>setOverdraft(null)}
        onConfirm={confirmOverdraft}
      />}

      </div>
    </div>
  );
}
