/* ===================================================================
   Show Team — Show Livestock Management
   Single-file, offline-capable PWA. Local-first (localStorage + IndexedDB
   for media blobs). Architected so a cloud backend (auth, Postgres, object
   storage, row-level security, real-time sync) can replace the local store
   later without touching the UI layer — see README + data layer below.
   =================================================================== */
"use strict";

/* ---------------- Icons (inline SVG, stroke) ---------------- */
/* width/height are set explicitly so iOS Safari doesn't fall back to a giant
   default size for viewBox-only SVGs; CSS rules (.btn svg, .iconbtn svg, …)
   still override these where a specific size is needed. */
const I = (p, o) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="${(o&&o.w)||2}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICON = {
  dash:I('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  animals:I('<path d="M4 14c0-3 2-5 4-5m8 0c2 0 4 2 4 5"/><circle cx="7.5" cy="8" r="1.6"/><circle cx="16.5" cy="8" r="1.6"/><path d="M9 18c0-2 1.4-3 3-3s3 1 3 3-1.4 3-3 3-3-1-3-3z"/><path d="M5 19c-1.2 0-2-1-1.6-2M19 19c1.2 0 2-1 1.6-2"/>'),
  plus:I('<path d="M12 5v14M5 12h14"/>'),
  cal:I('<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/>'),
  more:I('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'),
  weight:I('<path d="M6.5 8h11l2.2 11a1 1 0 0 1-1 1.2H5.3a1 1 0 0 1-1-1.2L6.5 8z"/><circle cx="12" cy="5" r="2.2"/><path d="M10 8a2.5 2.5 0 0 1 4 0"/>'),
  feed:I('<path d="M4 20c0-5 3-9 8-9s8 4 8 9"/><path d="M12 11V5c0-1.5-1-2.5-2.5-2.5"/><path d="M8 20a4 4 0 0 1 8 0"/>'),
  media:I('<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-7 7"/>'),
  shows:I('<path d="M8 21h8M12 17v4M6 4h12v4a6 6 0 0 1-12 0V4z"/><path d="M6 5H4v2a3 3 0 0 0 2 2.8M18 5h2v2a3 3 0 0 1-2 2.8"/>'),
  reports:I('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 12v5M12 8v9M16 14v3"/>'),
  team:I('<circle cx="9" cy="8" r="3"/><path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.5c2.8.2 5 2.3 5 5.5"/>'),
  archive:I('<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/>'),
  settings:I('<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2.2-1.3L14 2h-4l-.3 2.4a7 7 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .9.1 1.3l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2.2 1.3L10 22h4l.3-2.4a7 7 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.3z"/>'),
  bell:I('<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  chev:I('<path d="M9 6l6 6-6 6"/>',{w:2.2}),
  chevD:I('<path d="M6 9l6 6 6-6"/>'),
  back:I('<path d="M15 6l-6 6 6 6"/>',{w:2.4}),
  x:I('<path d="M6 6l12 12M18 6L6 18"/>'),
  check:I('<path d="M20 6L9 17l-5-5"/>',{w:2.4}),
  camera:I('<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.2"/>'),
  video:I('<rect x="3" y="6" width="12" height="12" rx="2"/><path d="M15 10l6-3v10l-6-3"/>'),
  note:I('<path d="M5 3h10l4 4v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4M8 12h8M8 16h5"/>'),
  health:I('<path d="M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10z"/><path d="M9 11h2l1-2 1 3 1-1h1" stroke-width="1.6"/>'),
  ruler:I('<rect x="3" y="8" width="18" height="8" rx="1.5" transform="rotate(0 12 12)"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>'),
  run:I('<circle cx="13" cy="5" r="2"/><path d="M6 19l3-5 3 1 1-4-4-1-3 3M12 11l3 2 1 5"/>'),
  dna:I('<path d="M7 3c0 5 10 7 10 12M17 3c0 5-10 7-10 12M7 21c0-2 10-4 10-9M17 21c0-2-10-4-10-9"/>'),
  money:I('<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9v6M18 9v6"/>'),
  search:I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  filter:I('<path d="M4 5h16l-6 8v5l-4 2v-7L4 5z"/>'),
  clock:I('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5l3 2"/>'),
  trend:I('<path d="M4 15l5-5 3 3 7-8"/><path d="M18 5h3v3"/>'),
  boxes:I('<rect x="3" y="8" width="8" height="8" rx="1"/><rect x="13" y="8" width="8" height="8" rx="1"/><path d="M7 8V4h10v4"/>'),
  edit:I('<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>'),
  share:I('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6"/>'),
  logout:I('<path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 12h9M16 8l3 4-3 4"/>'),
  paw:I('<ellipse cx="12" cy="15" rx="4.5" ry="3.5"/><circle cx="6.5" cy="10" r="1.8"/><circle cx="17.5" cy="10" r="1.8"/><circle cx="9" cy="6.5" r="1.6"/><circle cx="15" cy="6.5" r="1.6"/>'),
  info:I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  download:I('<path d="M12 3v11M8 10l4 4 4-4M4 20h16"/>'),
  refresh:I('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>'),
  pill:I('<rect x="2.5" y="8.5" width="19" height="7" rx="3.5"/><path d="M12 8.5v7"/>'),
  upload:I('<path d="M12 20V9M8 13l4-4 4 4M4 4h16"/>'),
  star:I('<path d="M12 3l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8L6.4 19.6l1-6L3 9.4l6-.9L12 3z"/>'),
  flag:I('<path d="M5 21V4M5 4h11l-2 3 2 3H5"/>'),
  copy:I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V4h12"/>'),
  trash:I('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  restore:I('<path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/>'),
  pig:I('<circle cx="12" cy="13" r="8"/><ellipse cx="12" cy="14" rx="3.2" ry="2.4"/><circle cx="11" cy="14" r=".6" fill="currentColor"/><circle cx="13" cy="14" r=".6" fill="currentColor"/><path d="M6 8l-1-2M18 8l1-2"/>'),
  sheep:I('<ellipse cx="12" cy="14" rx="7" ry="5"/><circle cx="12" cy="9" r="3"/><path d="M9 19v2M15 19v2"/>'),
  goat:I('<path d="M8 21v-6a4 4 0 0 1 8 0v6"/><path d="M9 9l-2-4M15 9l2-4"/><ellipse cx="12" cy="11" rx="3.5" ry="3"/>'),
  cow:I('<ellipse cx="12" cy="14" rx="6" ry="5"/><path d="M6 9C5 6 3 6 3 8s2 2 3 1M18 9c1-3 3-3 3-1s-2 2-3 1"/><circle cx="10" cy="14" r=".7" fill="currentColor"/><circle cx="14" cy="14" r=".7" fill="currentColor"/>'),
  wand:I('<path d="M15 4l5 5L9 20l-5-5L15 4z"/><path d="M14 5l5 5M6 3l.5 2 2 .5-2 .5L6 8l-.5-2-2-.5 2-.5L6 3z"/>'),
  location:I('<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
  layover:I('<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M9 21v-6h6v6"/><path d="M12 5V2"/>'),
  water:I('<path d="M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3z"/>'),
  snack:I('<path d="M5 11h14l-1.2 8.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 11z"/><path d="M8 11a4 4 0 0 1 8 0"/><path d="M12 7V5"/>'),
  pill:I('<rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M9.5 9.5l5 5"/>'),
  wash:I('<path d="M7 3v5M11 3v5M15 3v5M5 8h12l-1 6H6L5 8z"/><path d="M8 17l-1 4M13 17l-1 4M18 15l-1 6"/>'),
  rest:I('<path d="M20 14A8 8 0 1 1 10 4a6.5 6.5 0 0 0 10 10z"/>'),
  dry:I('<path d="M3 8h10a3 3 0 1 0-3-3M3 12h14a3 3 0 1 1-3 3M3 16h8a2.5 2.5 0 1 1-2.5 2.5"/>'),
  clip:I('<path d="M6 6l12 12M6 18L18 6"/><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/>'),
  car:I('<path d="M3 13l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z"/><path d="M3 13h18"/><circle cx="7" cy="16" r="1"/><circle cx="17" cy="16" r="1"/>'),
  calPlus:I('<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 2.5v4M16 2.5v4M12 12v5M9.5 14.5h5"/>'),
  target:I('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>'),
  clipboard:I('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4v.5a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4z"/><path d="M8.5 11l1.5 1.5 3-3M8.5 16.5h7"/>'),
  book:I('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h13"/><path d="M9 7h6M9 10h4"/>'),
  medal:I('<circle cx="12" cy="14" r="5"/><path d="M12 14l0 0M9.5 10L7 3M14.5 10L17 3M10.5 13.5l1.5-1 1.5 1-.6 1.8h-1.8z" stroke-width="1.6"/>'),
  rosette:I('<circle cx="12" cy="9" r="5"/><path d="M9.5 13l-2 8 4.5-2.5L16.5 21l-2-8"/><path d="M12 6.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2L9 8.6l2-.3z" stroke-width="1.4"/>'),
  sack:I('<path d="M8 3h8l-1.5 2.5a5 5 0 0 1 2.5 4.3V17a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4v-7.2a5 5 0 0 1 2.5-4.3L8 3z"/><path d="M9.5 5.5h5"/>'),
  shavings:I('<path d="M4 8c2-2 4-2 6 0M14 8c2-2 4-2 6 0M4 13c2-2 4-2 6 0M14 13c2-2 4-2 6 0M9 18c2-2 4-2 6 0"/>'),
  receipt:I('<path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3z"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
};
const spIcon = key => ({swine:ICON.pig, sheep:ICON.sheep, goat:ICON.goat, cattle:ICON.cow}[key] || ICON.paw);

/* ---------------- Small utilities ---------------- */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const el = (tag, cls, html) => { const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; };
const esc = s => (s==null?'':String(s)).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = (p='id') => p+'_'+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
const round = (n,d=1)=>{ const f=10**d; return Math.round((+n||0)*f)/f; };
/* LOCAL calendar date as YYYY-MM-DD. Must NOT go through toISOString() — that
   returns the UTC date, so any evening in the Americas (UTC already past
   midnight) rolled "today" onto tomorrow, mis-dating tasks/weigh-ins/care. */
const isoDate = (d) => { d = d || new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const todayISO = () => isoDate();
const nowISO = () => new Date().toISOString();
const nowTime = () => new Date().toTimeString().slice(0,5);
const daysBetween = (a,b) => Math.round((new Date(b)-new Date(a))/86400000);
const parseD = s => s ? new Date(s+(s.length<=10?'T00:00:00':'')) : null;
function fmtDate(iso, opt){ if(!iso) return '—'; const d=parseD(iso); if(isNaN(d)) return '—';
  return d.toLocaleDateString(undefined, opt||{month:'short',day:'numeric',year:'numeric'}); }
function fmtShort(iso){ if(!iso) return '—'; const d=parseD(iso); return d.toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
function relDays(iso){ if(!iso) return ''; const n=daysBetween(iso, todayISO()); if(n===0)return'Today'; if(n===1)return'Yesterday'; if(n>0)return n+'d ago'; if(n===-1)return'Tomorrow'; return 'in '+(-n)+'d'; }
function money(n){ n=+n||0; return '$'+n.toLocaleString(undefined,{minimumFractionDigits:n%1?2:0, maximumFractionDigits:2}); }
function initials(name){ return (name||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase(); }

/* ---------------- Toast / haptics ---------------- */
let toastT;
function toast(msg, kind){ const t=$('#toast'); const ic = kind==='good'?ICON.check:kind==='bad'?ICON.info:'';
  t.className=''; if(kind)t.classList.add(kind); t.innerHTML=(ic||'')+'<span>'+esc(msg)+'</span>';
  requestAnimationFrame(()=>t.classList.add('show')); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2200);
  if(navigator.vibrate && kind==='good') navigator.vibrate(12); }

/* ---------------- Celebrations (confetti + milestones) ---------------- */
function confetti(){
  try{ if(matchMedia('(prefers-reduced-motion: reduce)').matches) return; }catch(e){}
  const cv=el('canvas'); cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:200';
  document.body.appendChild(cv); const ctx=cv.getContext('2d'); const dpr=Math.min(2,window.devicePixelRatio||1);
  const W=innerWidth, H=innerHeight; cv.width=W*dpr; cv.height=H*dpr; ctx.scale(dpr,dpr);
  const colors=['#8B5CF6','#2DD4BF','#F59E0B','#EF4444','#22C55E','#C4B5FD','#FB923C'];
  const parts=[]; for(let i=0;i<110;i++)parts.push({x:W/2+(Math.random()-.5)*120, y:H*0.30, vx:(Math.random()-.5)*9, vy:Math.random()*-10-4, g:0.26+Math.random()*0.14, s:5+Math.random()*6, rot:Math.random()*6.28, vr:(Math.random()-.5)*0.5, c:colors[i%colors.length], sq:Math.random()<.55});
  const start=performance.now();
  const draw=now=>{ const t=now-start; ctx.clearRect(0,0,W,H);
    parts.forEach(p=>{ p.vy+=p.g; p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.globalAlpha=Math.max(0,1-t/2300); ctx.fillStyle=p.c;
      if(p.sq)ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*.62); else {ctx.beginPath();ctx.arc(0,0,p.s/2,0,6.3);ctx.fill();} ctx.restore(); });
    if(t<2300)requestAnimationFrame(draw); else cv.remove(); };
  requestAnimationFrame(draw);
}
function celebrate(title, sub, emoji){
  if(navigator.vibrate) navigator.vibrate([18,45,18]); confetti();
  const old=$('#celebrate'); if(old)old.remove();
  const c=el('div'); c.id='celebrate';
  c.style.cssText='position:fixed;left:50%;top:32%;transform:translate(-50%,-50%) scale(.82);z-index:201;background:linear-gradient(135deg,#4C1D95,#0D9488);color:#fff;padding:18px 24px;border-radius:22px;box-shadow:0 24px 60px rgba(0,0,0,.55);text-align:center;max-width:80vw;opacity:0;transition:opacity .25s cubic-bezier(.2,.8,.2,1),transform .25s cubic-bezier(.2,.8,.2,1)';
  c.innerHTML=`<div style="font-size:34px;margin-bottom:2px">${emoji||'🎉'}</div><div style="font-size:17px;font-weight:800;line-height:1.2">${esc(title)}</div>${sub?`<div style="font-size:13px;opacity:.92;margin-top:4px">${esc(sub)}</div>`:''}`;
  c.onclick=()=>c.remove(); document.body.appendChild(c);
  requestAnimationFrame(()=>{ c.style.opacity='1'; c.style.transform='translate(-50%,-50%) scale(1)'; });
  setTimeout(()=>{ if(!c.parentNode)return; c.style.opacity='0'; c.style.transform='translate(-50%,-50%) scale(.92)'; setTimeout(()=>c.remove(),320); }, 2700);
}
/* fire a celebration once per key (keys are remembered so it never repeats) */
function milestone(key, title, sub, emoji){ if(!DB) return false; DB.milestones=DB.milestones||{}; if(DB.milestones[key]) return false;
  DB.milestones[key]=nowISO(); save(); celebrate(title, sub, emoji); return true; }
function checkStreakMilestone(){ const n=activityStreak(); const ms=[3,7,14,30,50,100,200]; DB.milestones=DB.milestones||{}; let fired=null;
  ms.forEach(m=>{ if(n>=m && !DB.milestones['streak:'+m]){ DB.milestones['streak:'+m]=nowISO(); fired=m; } });
  if(fired!=null){ save(); celebrate(fired+'-day streak!', 'You’re showing up every day 💪', '🔥'); } }

/* ===================================================================
   INDEXEDDB — media blobs (photos / videos) kept out of localStorage
   =================================================================== */
const Media = (()=>{
  let dbp;
  function open(){ return dbp || (dbp = new Promise((res,rej)=>{ const r=indexedDB.open('dfst_media',1);
    r.onupgradeneeded=()=>{ const db=r.result; if(!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs'); };
    r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); })); }
  async function put(id, blob){ const db=await open(); return new Promise((res,rej)=>{ const tx=db.transaction('blobs','readwrite'); tx.objectStore('blobs').put(blob,id); tx.oncomplete=()=>res(id); tx.onerror=()=>rej(tx.error); }); }
  async function get(id){ const db=await open(); return new Promise((res,rej)=>{ const tx=db.transaction('blobs','readonly'); const rq=tx.objectStore('blobs').get(id); rq.onsuccess=()=>res(rq.result); rq.onerror=()=>rej(rq.error); }); }
  async function del(id){ const db=await open(); return new Promise((res)=>{ const tx=db.transaction('blobs','readwrite'); tx.objectStore('blobs').delete(id); tx.oncomplete=()=>res(); }); }
  const urls={};
  // Resolve a media blob to a displayable URL. Prefer the on-device copy
  // (fast, offline). If it isn't here (e.g. uploaded from another device),
  // pull a signed URL from the team's private Storage bucket and cache the
  // blob locally for next time. The blob id doubles as the storage key.
  async function url(id){
    if(!id) return null; if(urls[id]) return urls[id];
    const b=await get(id);
    if(b){ const u=URL.createObjectURL(b); urls[id]=u; return u; }
    if(typeof Cloud!=='undefined' && Cloud.enabled && Cloud.teamId){
      try{
        const path=Cloud.teamId+'/'+id;
        const {data,error}=await Cloud.sb.storage.from('media').createSignedUrl(path, 3600);
        if(error||!data) return null;
        urls[id]=data.signedUrl;
        // warm the offline cache in the background
        fetch(data.signedUrl).then(r=>r.blob()).then(bl=>put(id,bl)).catch(()=>{});
        return data.signedUrl;
      }catch(e){ return null; }
    }
    return null;
  }
  async function upload(id, blob){ // best-effort push to cloud storage
    if(typeof Cloud==='undefined' || !Cloud.enabled || !Cloud.teamId) return;
    try{ await Cloud.sb.storage.from('media').upload(Cloud.teamId+'/'+id, blob, {upsert:true, contentType:blob.type||'application/octet-stream'}); }
    catch(e){ console.error('media upload',e); }
  }
  async function blob(id){ // return the raw Blob (from cache, or fetched from cloud)
    if(!id) return null; let b=await get(id); if(b) return b;
    if(typeof Cloud!=='undefined' && Cloud.enabled && Cloud.teamId){
      try{ const {data}=await Cloud.sb.storage.from('media').createSignedUrl(Cloud.teamId+'/'+id,3600); if(data){ b=await (await fetch(data.signedUrl)).blob(); put(id,b).catch(()=>{}); return b; } }catch(e){}
    }
    return null;
  }
  // A guaranteed SAME-ORIGIN object URL (fetches the blob), so images drawn to
  // canvas don't taint it — needed for the growth-reel video export.
  async function objectURL(id){ const b=await blob(id); return b?URL.createObjectURL(b):null; }
  return {put,get,del,url,upload,blob,objectURL};
})();
/* ===================================================================
   DATA LAYER — single source of truth in localStorage.
   All reads/writes go through DB.*  → swap this module for API calls
   against Postgres/Supabase (with row-level security keyed on team_id)
   to make the app fully cloud + multi-user. UI never touches storage.
   =================================================================== */
const KEY = 'dfst_db_v2';
const SPECIES_DEFS = [
  {id:'swine',  name:'Swine',  active:true, idFields:['earNotch','earTag','tattoo','rfid']},
  {id:'sheep',  name:'Sheep',  active:true, idFields:['scrapieTag','earTag','tattoo']},
  {id:'goat',   name:'Goat',   active:true, idFields:['scrapieTag','earTag','tattoo','rfid']},
  {id:'cattle', name:'Cattle', active:true, idFields:['registration','earTag','tattoo','brand','rfid']},
];
const BREEDS = {
  swine:['Crossbred','Yorkshire','Hampshire','Duroc','Berkshire','Chester White','Landrace','Poland China','Spotted','Hereford','Tamworth','Other'],
  sheep:['Crossbred','Hampshire','Suffolk','Southdown','Dorset','Dorper','Shropshire','Oxford','Rambouillet','Fine Wool','Fine Wool Cross','Hair Sheep','Other'],
  goat:['Crossbred','Boer','Percentage Boer','Fullblood Boer','Spanish','Kiko','Dairy','Other'],
  cattle:['Crossbred','Angus','Red Angus','Hereford','Shorthorn','Maine-Anjou','Simmental','Charolais','Chianina','Limousin','Gelbvieh','Brahman','Other'],
};
const STATUSES = ['Prospect','Active','On feed','Showing','Breeding','Sold','Retired','Deceased'];
const STATUS_COLOR = {Prospect:'info',Active:'good','On feed':'t','Showing':'p',Breeding:'p',Sold:'gray',Retired:'gray',Deceased:'gray',Archived:'gray'};
const ROLES = ['Owner','Administrator','Editor','Contributor','Viewer','Advisor'];
const ROLE_RANK = {Owner:6,Administrator:5,Editor:4,Contributor:3,Advisor:2,Viewer:1};
const FEED_OBJECTIVES = ['Growth','Maintenance','Increase appetite','Add body','Add muscle','Add shape','Increase fill','Increase freshness','Slow weight gain','Hold weight','Reduce body','Improve digestion','Recovery','Show-day preparation','Other'];
const UNITS = ['lb','oz','cups','scoop','flake','g','mL','cc','tablets','unit'];
/* Layover / care-log categories — the breeder's time-specific directions */
const CARE_CATS = [
  {key:'Water',      icon:'water', color:'#38BDF8'},
  {key:'Snack',      icon:'snack', color:'#F59E0B'},
  {key:'Feed',       icon:'feed',  color:'#2DD4BF'},
  {key:'Supplement', icon:'pill',  color:'#A78BFA'},
  {key:'Wash/Rinse', icon:'wash',  color:'#22D3EE'},
  {key:'Walk',       icon:'run',   color:'#FB923C'},
  {key:'Rest',       icon:'rest',  color:'#818CF8'},
  {key:'Blow/Dry',   icon:'dry',   color:'#60A5FA'},
  {key:'Clip/Groom', icon:'clip',  color:'#F472B6'},
  {key:'Medication', icon:'health',color:'#F87171'},
  {key:'Other',      icon:'note',  color:'#94A3B8'},
];
const careCat = k => CARE_CATS.find(c=>c.key===k) || CARE_CATS[CARE_CATS.length-1];
/* Calendar event categories */
const EVENT_CATS = [
  {key:'Visit',       icon:'team',   color:'#8B5CF6'},
  {key:'Showmanship', icon:'star',   color:'#2DD4BF'},
  {key:'Vet',         icon:'health', color:'#F87171'},
  {key:'Clip/Groom',  icon:'clip',   color:'#F472B6'},
  {key:'Weigh day',   icon:'weight', color:'#8B5CF6'},
  {key:'Feed pickup', icon:'feed',   color:'#2DD4BF'},
  {key:'Travel',      icon:'car',    color:'#FB923C'},
  {key:'Meeting',     icon:'team',   color:'#60A5FA'},
  {key:'Other',       icon:'cal',    color:'#94A3B8'},
];
const eventCat = k => EVENT_CATS.find(c=>c.key===k) || EVENT_CATS[EVENT_CATS.length-1];
const NOTE_TYPES = ['General','Feed','Weight','Health','Exercise','Showmanship','Structure','Movement','Breeder feedback','Advisor feedback','Show result','Family discussion','Other'];
const EXP_CATS = ['Purchase price','Feed','Supplements','Medication','Veterinary','Entry fees','Bedding','Equipment','Transportation','Fuel','Hotels','Meals','Grooming supplies','Show supplies','Breeding','Registration','Other'];
const MEDIA_VIEWS = ['Profile','Side view','Front view','Rear view','Top view','Walking video','Driving video','Showmanship video','Feeding video','Health','General'];

let DB = null;
function save(localOnly){ DB.updatedAt=nowISO(); if(DB.currentUserId)DB.updatedBy=DB.currentUserId; try{ localStorage.setItem(KEY, JSON.stringify(DB)); }catch(e){ toast('Storage full — remove some records',''); }
  if(!localOnly && typeof Cloud!=='undefined' && Cloud.enabled && Cloud.teamId && !Cloud.applying) Cloud.schedulePush(); }
function load(){ try{ DB = JSON.parse(localStorage.getItem(KEY)); }catch(e){ DB=null; } return DB; }

function blankDB(){
  return {
    version:2, createdAt:nowISO(), updatedAt:nowISO(), setupComplete:false, seeded:false,
    team:{ name:'Show Team', subtitle:'Show Livestock Management', logo:null,
           colors:{purple:'#4C1D95', teal:'#0D9488'}, weighDay:0 /*Sun*/ },
    users:[], currentUserId:null,
    species: SPECIES_DEFS.map(s=>({...s})),
    breeds: [],
    animals:[], weights:[], feed:[], media:[], measurements:[], exercise:[],
    health:[], shows:[], entries:[], tasks:[], notes:[], expenses:[], income:[],
    relatives:[], recs:[], activity:[], savedViews:[], shares:[], inventory:[],
    layovers:[], care:[], helpers:[], events:[], purchases:[], bedding:[], milestones:{},
    meds:[], medLog:[], alertAcks:{},
    notifPrefs:{ weightDue:true, missingPhoto:true, upcomingShow:true, health:true, advisor:true, mentions:true },
  };
}
function seedBreeds(db){ let order=0; for(const sp of Object.keys(BREEDS)) for(const nm of BREEDS[sp]) db.breeds.push({id:uid('br'),speciesId:sp,name:nm,system:true,active:true,order:order++}); }

/* ---- current user + permissions ---- */
const me = () => DB.users.find(u=>u.id===DB.currentUserId) || DB.users[0] || {name:'Guest',role:'Viewer'};
function can(action){
  const u = me(); const r = u.role || 'Viewer';
  const rank = ROLE_RANK[r]||0;
  const map = {
    view:1, addRecord:3 /* weights/feed/media/notes */, edit:4, addAnimal:4,
    archive:5, manageTeam:5, manageBreeds:5, delete:6, billing:6, invite:5,
  };
  // Advisor: view + comment only
  if(r==='Advisor') return action==='view' || action==='comment';
  return rank >= (map[action]||99) || action==='view';
}

/* ---- activity log ---- */
function logAct(action, detail, animalId){
  DB.activity.unshift({ id:uid('act'), ts:nowISO(), userId:DB.currentUserId, userName:me().name, action, detail, animalId:animalId||null });
  if(DB.activity.length>600) DB.activity.length=600;
}

/* ---- generic record helpers (create with audit fields) ---- */
function stamp(obj){ const t=nowISO(); return {...obj, id:obj.id||uid('r'), createdAt:t, updatedAt:t, createdBy:DB.currentUserId, updatedBy:DB.currentUserId}; }
function touch(obj){ obj.updatedAt=nowISO(); obj.updatedBy=DB.currentUserId; }

/* ---- lookups ---- */
const getAnimal = id => DB.animals.find(a=>a.id===id);
const activeAnimals = () => DB.animals.filter(a=>!a.archived);
const breedsFor = sp => DB.breeds.filter(b=>b.speciesId===sp && b.active).sort((a,b)=>(a.order||0)-(b.order||0));
const weightsFor = id => DB.weights.filter(w=>w.animalId===id).sort((a,b)=>a.date<b.date?-1:1);
const feedFor = id => DB.feed.filter(f=>f.animalId===id).sort((a,b)=>a.startDate<b.startDate?1:-1);
const mediaFor = id => DB.media.filter(m=>m.animalId===id).sort((a,b)=>(a.captured||a.date)<(b.captured||b.date)?1:-1);
const speciesName = id => (DB.species.find(s=>s.id===id)||{}).name || id;
const userName = id => (DB.users.find(u=>u.id===id)||{}).name || 'Unknown';
const getHelper = id => (DB.helpers||[]).find(h=>h.id===id);
const helperName = id => (getHelper(id)||{}).name || '';
const animalsForHelper = id => DB.animals.filter(a=>(a.helperIds||[]).includes(id));
const getLayover = id => (DB.layovers||[]).find(l=>l.id===id);
const careForLayover = id => (DB.care||[]).filter(c=>c.layoverId===id);
const careForAnimal = id => (DB.care||[]).filter(c=>c.animalId===id);
const activeLayover = () => (DB.layovers||[]).find(l=>l.start<=todayISO() && (!l.end||l.end>=todayISO()));
function layoverDays(l){ const out=[]; if(!l||!l.start) return out; const end=l.end||l.start; let d=l.start; let guard=0; while(d<=end && guard++<60){ out.push(d); const dt=parseD(d); dt.setDate(dt.getDate()+1); d=isoDate(dt); } return out; }
function careSort(a,b){ const ka=(a.date||'')+(a.time||'99:99'); const kb=(b.date||'')+(b.time||'99:99'); return ka<kb?-1:ka>kb?1:0; }

/* ===================================================================
   COMPUTATIONS — average daily gain, projections, targets
   ADG = weight gain ÷ number of days
   =================================================================== */
function animalStats(a){
  const ws = weightsFor(a.id); // sorted ascending by date
  const first = ws[0];
  // Pair the starting weight and date from the SAME source so ADG can't be
  // skewed by a profile start-date that disagrees with the weigh-in log.
  // Use the explicit profile start only when it's no later than the first
  // logged weigh-in; otherwise use the earliest actual weigh-in.
  let startW, startD;
  const hasExplicit = a.startWeight!=null && a.startWeightDate;
  if(hasExplicit && (!first || a.startWeightDate <= first.date)){ startW=+a.startWeight; startD=a.startWeightDate; }
  else if(first){ startW=+first.weight; startD=first.date; }
  else if(a.startWeight!=null){ startW=+a.startWeight; startD=a.startWeightDate||a.acquiredDate||null; }
  else { startW=null; startD=null; }
  const last = ws[ws.length-1];
  const prev = ws[ws.length-2];
  const curW = last ? +last.weight : startW;
  const curD = last ? last.date : startD;
  const s = { startW, startD, curW, curD, count:ws.length,
              gainTotal:null, adgLife:null, gainPeriod:null, adgPeriod:null, periodDays:null,
              daysOwned: a.acquiredDate?daysBetween(a.acquiredDate, todayISO()):null };
  if(startW!=null && curW!=null){ s.gainTotal = round(curW-startW,1);
    const d = startD&&curD?daysBetween(startD,curD):0; if(d>0) s.adgLife=round((curW-startW)/d,2); }
  if(last && prev){ s.gainPeriod=round(last.weight-prev.weight,1); s.periodDays=daysBetween(prev.date,last.date);
    if(s.periodDays>0) s.adgPeriod=round((last.weight-prev.weight)/s.periodDays,2); }
  // projection to target show date using lifetime ADG
  if(a.targetDate && curW!=null && s.adgLife!=null){
    const d = daysBetween(curD, a.targetDate);
    s.projDays=d; s.projWeight = d>0 ? Math.round(curW + s.adgLife*d) : curW;
    if(a.targetWeight){ s.targetGap = Math.round((s.projWeight)-a.targetWeight);
      const dd = daysBetween(curD, a.targetDate);
      s.reqAdg = dd>0 ? round((a.targetWeight-curW)/dd,2) : null; }
  }
  return s;
}
function weightAlerts(a){
  const s=animalStats(a); const out=[];
  const ws=weightsFor(a.id);
  if(ws.length){ const since=daysBetween(ws[ws.length-1].date, todayISO());
    if(since>=7) out.push({k:'warn', type:'stale', t:`No weight in ${since} days`}); }
  else out.push({k:'info', type:'noweight', t:'No weights recorded yet'});
  if(a.targetWeight && s.projWeight!=null){
    if(s.projWeight < a.targetWeight-8) out.push({k:'bad', type:'under', t:`Projected ${s.projWeight} — under ${a.targetWeight} target`});
    else if(s.projWeight > a.targetWeight+12) out.push({k:'warn', type:'over', t:`Projected ${s.projWeight} — over ${a.targetWeight} target`});
  }
  if(s.adgPeriod!=null && s.adgLife!=null && s.adgPeriod < s.adgLife*0.5 && s.count>2) out.push({k:'warn',type:'adgdrop',t:'ADG dropped sharply'});
  const missingMedia = mediaFor(a.id).length===0;
  if(missingMedia) out.push({k:'info', type:'nomedia', t:'No progress media'});
  return out.map(al=>({...al, acked:isAcked(a,al.type)}));
}
/* ---- Acknowledge/justify an alert without touching the data. The signature
   ties the acknowledgement to the current weigh-in state, so logging a new
   weight automatically re-checks and re-surfaces the alert if it still holds. */
const ackKey = (animalId,type)=>animalId+'::'+type;
function alertSig(a,type){ const ws=weightsFor(a.id); if(type==='nomedia')return 'm'+mediaFor(a.id).length; const last=ws[ws.length-1]; return 'w'+ws.length+':'+(last?last.date+':'+last.weight:'0'); }
const alertAck = (animalId,type)=>(DB.alertAcks||{})[ackKey(animalId,type)];
function isAcked(a,type){ const ack=alertAck(a.id,type); return !!(ack && ack.sig===alertSig(a,type)); }
function setAlertAck(a,type,note){ DB.alertAcks=DB.alertAcks||{}; const k=ackKey(a.id,type); if(note==null){ delete DB.alertAcks[k]; } else { DB.alertAcks[k]={note, sig:alertSig(a,type), by:DB.currentUserId, at:nowISO()}; } }
const activeWeightAlerts = a => weightAlerts(a).filter(al=>!al.acked);
function currentFeed(id){ return feedFor(id).find(f=>!f.endDate) || feedFor(id)[0] || null; }
function feedProgramStats(f){
  const ws=weightsFor(f.animalId);
  const inRange = d => d>=f.startDate && (!f.endDate || d<=f.endDate);
  const pts=ws.filter(w=>inRange(w.date));
  const startW=pts[0]?+pts[0].weight:null, endW=pts[pts.length-1]?+pts[pts.length-1].weight:null;
  const days = f.endDate ? daysBetween(f.startDate,f.endDate) : daysBetween(f.startDate,todayISO());
  let adg=null,gain=null; if(startW!=null&&endW!=null&&pts.length>1){ gain=round(endW-startW,1); const d=daysBetween(pts[0].date,pts[pts.length-1].date); if(d>0)adg=round((endW-startW)/d,2); }
  return {days, startW, endW, gain, adg, weighCount:pts.length};
}
function feedDailyTotal(f){ let byUnit={}; (f.meals||[]).forEach(m=>(m.items||[]).forEach(it=>{ const u=it.unit||'lb'; byUnit[u]=(byUnit[u]||0)+(+it.amount||0); })); return byUnit; }

/* ===================================================================
   FEED & BEDDING COSTING — buy in bulk, price per pound, let cost flow
   into each animal automatically from the (versioned) rations they eat.
   - A product (DB.inventory, category 'feed'|'bedding') carries a base unit.
   - Purchase lots (DB.purchases) → a weighted-average cost per base unit,
     so bulk buys at different prices blend correctly.
   - Ration items are matched to products by name; daily lb × $/lb = daily
     feed cost, × days on that (dated) program = the program's cost.
   - Bedding use (DB.bedding) is priced from bedding lots and attributed
     per-animal, split across a pen, or held as barn overhead.
   =================================================================== */
const PURCHASE_UNITS = ['lb','ton','bag','oz'];
const BEDDING_UNITS  = ['bag','bale','yd³','scoop','lb'];
const feedProducts    = () => (DB.inventory||[]).filter(p=>(p.category||'feed')==='feed');
const beddingProducts = () => (DB.inventory||[]).filter(p=>p.category==='bedding');
function toLb(qty, unit, perBag){ qty=+qty||0; if(unit==='lb')return qty; if(unit==='oz')return qty/16; if(unit==='ton')return qty*2000; if(unit==='bag')return qty*(+perBag||0); return null; }
// weighted-average cost per BASE unit of a product (lb for feed; product.unit for bedding)
function productCost(pid){ const p=(DB.inventory||[]).find(x=>x.id===pid); if(!p) return {perUnit:null,totalCost:0,totalQty:0,unit:'lb'};
  const lots=(DB.purchases||[]).filter(l=>l.productId===pid);
  let cost=0, qty=0; const base=p.category==='bedding'?(p.unit||'bag'):'lb';
  lots.forEach(l=>{ cost+=+l.cost||0; const q=p.category==='bedding'?(+l.qty||0):toLb(l.qty,l.unit||'lb',l.perBag); if(q!=null)qty+=q; });
  return {perUnit: qty>0?cost/qty:null, totalCost:cost, totalQty:qty, unit:base}; }
const productByName = name => name?(DB.inventory||[]).find(p=>(p.product||'').trim().toLowerCase()===String(name).trim().toLowerCase()):null;
// daily $ for a ration; also which line items couldn't be priced
function feedDailyCost(f){ let cost=0; const uncosted=[];
  (f.meals||[]).forEach(m=>(m.items||[]).forEach(it=>{ if(!it.product)return;
    const p=productByName(it.product); const lb=toLb(it.amount,it.unit||'lb');
    const pc=p?productCost(p.id).perUnit:null;
    if(p&&pc!=null&&lb!=null){ cost+=lb*pc; }
    else if((+it.amount||0)>0){ uncosted.push(it.product); }
  }));
  return {cost, uncosted:[...new Set(uncosted)]}; }
const feedProgramDays = f => f.endDate?Math.max(0,daysBetween(f.startDate,f.endDate)):Math.max(0,daysBetween(f.startDate,todayISO()));
function feedProgramCost(f){ const d=feedProgramDays(f); return (feedDailyCost(f).cost)*d; }
function feedCostForAnimal(id){ return feedFor(id).reduce((s,f)=>s+feedProgramCost(f),0); }
// bedding cost attributed to one animal (per-animal, per-pen split, or barn=none)
function beddingUseCost(b){ const pc=productCost(b.productId).perUnit; return pc!=null?(+b.qty||0)*pc:0; }
function beddingCostForAnimal(id){ const a=getAnimal(id); if(!a)return 0; let sum=0;
  (DB.bedding||[]).forEach(b=>{ const c=beddingUseCost(b); if(!c)return;
    if(b.scope==='animal'&&b.animalId===id) sum+=c;
    else if(b.scope==='pen'&&b.pen&&a.penLocation&&b.pen===a.penLocation){ const n=activeAnimals().filter(x=>x.penLocation===b.pen).length||1; sum+=c/n; }
  });
  return sum; }
const beddingTotal = () => (DB.bedding||[]).reduce((s,b)=>s+beddingUseCost(b),0);
// full invested for an animal = logged expenses + auto feed + attributed bedding
function animalFeedBedding(id){ return { feed:feedCostForAnimal(id), bedding:beddingCostForAnimal(id) }; }
function animalInvested(id){ const man=DB.expenses.filter(e=>e.animalId===id).reduce((s,e)=>s+(+e.amount||0),0); const fb=animalFeedBedding(id); return man+fb.feed+fb.bedding; }

/* ===================================================================
   SEED — sample team + animals (clearly marked demo, removable in setup)
   =================================================================== */
function seedDemo(db){
  const owner = db.users[0];
  const advisor = { id:uid('u'), name:'Cody Ratliff', email:'advisor@example.com', role:'Advisor', demo:true, scope:'assigned' };
  const spouse = { id:uid('u'), name:'Amanda Devitt', email:'amanda@example.com', role:'Administrator', demo:true };
  db.users.push(spouse, advisor);
  const helperBlake=stamp({id:uid('help'),demo:true,name:'Blake Goss',note:'Swine feeding'});
  const helperZach=stamp({id:uid('help'),demo:true,name:'Zach Vaughn',note:'Swine feeding'});
  const helperCasey=stamp({id:uid('help'),demo:true,name:'Casey Sidwell',note:'Lambs'});
  db.helpers.push(helperBlake, helperZach, helperCasey);
  const brId = (sp,nm)=> (db.breeds.find(b=>b.speciesId===sp && b.name===nm)||{}).id;
  const T = todayISO();
  const ago = n => new Date(Date.now()-n*86400000).toISOString().slice(0,10);
  const samples = [
    {name:'Batman', barn:'Bats', breed:'Crossbred', div:'Dark Cross', sex:'Barrow', start:58, startAgo:82, cur:[68,82,97,112,128,143,159,176], every:11, tag:'Y7', notch:'6-4', status:'Showing', tw:280, best:true},
    {name:'Bandit', barn:'', breed:'Crossbred', div:'Cross', sex:'Barrow', start:61, startAgo:82, cur:[70,83,96,110,124,138,153,168], every:11, tag:'Y9', notch:'6-5', status:'On feed', tw:275},
    {name:'Smurf Daddy', barn:'Smurf', breed:'Crossbred', div:'Light Cross', sex:'Barrow', start:54, startAgo:75, cur:[63,74,86,99,112,126,140], every:11, tag:'B2', notch:'3-2', status:'On feed', tw:270},
    {name:'Spotacus', barn:'Spot', breed:'Spotted', div:'Spot', sex:'Barrow', start:57, startAgo:75, cur:[66,78,91,104,118,132,146], every:11, tag:'S1', notch:'4-3', status:'Active', tw:265},
    {name:'Shorts', barn:'', breed:'Crossbred', div:'Dark Cross', sex:'Barrow', start:63, startAgo:68, cur:[72,84,97,110,124,138], every:11, tag:'D4', notch:'2-6', status:'Active', tw:280},
    {name:'Biscuit', barn:'Bisc', breed:'Crossbred', div:'Light Cross', sex:'Gilt', start:52, startAgo:68, cur:[60,71,83,95,108,121], every:11, tag:'G3', notch:'5-1', status:'On feed', tw:255},
    {name:'Hampster', barn:'Hammy', breed:'Hampshire', div:'Hamp', sex:'Barrow', start:60, startAgo:61, cur:[69,81,94,107,121], every:11, tag:'H8', notch:'7-2', status:'Active', tw:275},
    {name:'Callie', barn:'', breed:'Crossbred', div:'Calico', sex:'Gilt', start:50, startAgo:61, cur:[58,68,80,92,105], every:11, tag:'C6', notch:'1-3', status:'Active', tw:250},
    {name:'Dr Pepper', barn:'Doc', breed:'Duroc', div:'Duroc', sex:'Barrow', start:59, startAgo:54, cur:[68,80,93,106], every:11, tag:'P5', notch:'8-4', status:'Active', tw:270},
    {name:'Brutus', barn:'', breed:'Yorkshire', div:'York', sex:'Barrow', start:62, startAgo:54, cur:[71,83,96,109], every:11, tag:'K1', notch:'6-1', status:'Prospect', tw:275},
  ];
  const show = stamp({ id:uid('show'), name:'County Fair Jr. Livestock Show', type:'Jackpot', location:'Fairgrounds', city:'Hometown', start:ago(-24), end:ago(-22), entryDeadline:ago(-38), weighIn:ago(-24), judge:'Dr. J. Malone', org:'County 4-H', fee:35, demo:true });
  db.shows.push(show);
  samples.forEach((sm,i)=>{
    const aStart = ago(sm.startAgo);
    const a = stamp({ id:uid('an'), demo:true, name:sm.name, barnName:sm.barn, species:'swine', breed:sm.breed,
      sex:sm.sex, division:sm.div, marketBreeding:'Market', status:sm.status, season:'2026',
      earTag:sm.tag, earNotch:sm.notch, acquiredDate:aStart, startWeight:sm.start, startWeightDate:aStart,
      targetShow:'State Fair Market Show', targetDate:ago(-45), targetWeight:sm.tw, breeder:'Ratliff Show Pigs',
      penLocation:'Barn A · Pen '+(i+1), advisorId:advisor.id, color:sm.div, archived:false,
      helperIds:[ i%2===0 ? helperBlake.id : helperZach.id ], notes:'', profileMediaId:null });
    db.animals.push(a);
    if(sm.status!=='Prospect' || sm.cur.length){
      db.weights.push(stamp({id:uid('w'),animalId:a.id,weight:sm.start,date:aStart,by:owner.id,scale:'Barn deck'}));
      sm.cur.forEach((w,k)=>{ const d=sm.startAgo-(k+1)*sm.every; if(d>=0) db.weights.push(stamp({id:uid('w'),animalId:a.id,weight:w,date:ago(d),by:owner.id,scale:'Barn deck'})); });
    }
    // feed program history: grower → finisher
    db.feed.push(stamp({id:uid('f'),animalId:a.id,name:'Grow Ration',startDate:aStart,endDate:ago(sm.startAgo-33),objective:'Growth',by:owner.id,reason:'Starting program',
      meals:[{time:'Morning',items:[{product:'Maxxed Out',amount:1.5,unit:'lb'},{product:'Rolled oats',amount:0.5,unit:'lb'}]},
             {time:'Evening',items:[{product:'Maxxed Out',amount:1.5,unit:'lb'}]}]}));
    db.feed.push(stamp({id:uid('f'),animalId:a.id,name:'Finisher + Shape',startDate:ago(sm.startAgo-33),endDate:null,objective:sm.status==='Showing'?'Show-day preparation':'Add shape',by:owner.id,reason:'Adding cover and shape for show',advisorRec:sm.best?'Bump Game On to 3oz AM':'',
      meals:[{time:'Morning',items:[{product:'Maxxed Out',amount:1.75,unit:'lb'},{product:'Game On',amount:2,unit:'oz'},{product:'Roll Em Up',amount:4,unit:'oz'}]},
             {time:'Evening',items:[{product:'Maxxed Out',amount:1.75,unit:'lb'},{product:'Hold On',amount:0.5,unit:'lb'}]}]}));
    db.notes.push(stamp({id:uid('n'),animalId:a.id,type:sm.best?'Advisor feedback':'General',text:sm.best?'Freshest pig in the barn — keep him fresh, ease the fill day before show.':'Looking good, staying on feed well.',date:ago(6),by:sm.best?advisor.id:owner.id,pinned:sm.best}));
    if(sm.best){
      db.entries.push(stamp({id:uid('en'),showId:show.id,animalId:a.id,division:'Market Barrow',cls:'Cross 5',showWeight:sm.cur[sm.cur.length-1],exhibitor:'Blake Devitt',
        result:{placing:1,inClass:12,classWinner:true,divisionPlacing:'Champion Cross',bannerNote:'Reserve Grand Overall',salePrice:2100}}));
      db.recs.push(stamp({id:uid('rec'),animalId:a.id,advisorId:advisor.id,date:ago(6),type:'Feed',urgent:false,status:'pending',
        text:'Add 3oz Game On to the morning feed for the next 10 days, then taper before the state show.'}));
    }
  });
  db.expenses.push(stamp({id:uid('ex'),animalId:db.animals[0].id,category:'Purchase price',amount:750,date:ago(82),vendor:'Ratliff Show Pigs',demo:true}));
  db.expenses.push(stamp({id:uid('ex'),animalId:db.animals[0].id,category:'Feed',amount:210,date:ago(40),vendor:'Co-op',demo:true}));
  db.tasks.push(stamp({id:uid('t'),title:'Weigh Batman',animalId:db.animals[0].id,date:T,done:false,priority:'High',recur:'weekly'}));
  db.tasks.push(stamp({id:uid('t'),title:"Update Biscuit's feed",animalId:db.animals[5].id,date:T,done:false,priority:'Normal'}));
  db.tasks.push(stamp({id:uid('t'),title:'Upload weekly video for Spotacus',animalId:db.animals[3].id,date:T,done:false,priority:'Normal',recur:'weekly'}));
  db.tasks.push(stamp({id:uid('t'),title:'Review lamb weight targets',date:T,done:false,priority:'Low'}));
  db.tasks.push(stamp({id:uid('t'),title:'Order feed',date:ago(-2),done:false,priority:'High'}));
  db.income.push(stamp({id:uid('in'),animalId:db.animals[0].id,source:'Premium',amount:2100,date:ago(-22),demo:true}));
  db.events.push(stamp({id:uid('ev'),demo:true,title:'Kade — showmanship + pig look',category:'Showmanship',date:ago(-1),startTime:'18:00',endTime:'19:30',location:'Home barn',animalIds:[db.animals[0].id,db.animals[1].id],showId:show.id,notes:'Work the kids on showmanship and evaluate the pigs going to the fair.'}));
  // demo layover (active today) with a few of the breeder's directions on Batman & Bandit
  const lay=stamp({id:uid('lay'),demo:true,name:'State Fair Layover',breeder:'Ratliff Show Pigs',location:'Central Barn · Row C',showId:null,start:ago(1),end:ago(-3),animalIds:[db.animals[0].id,db.animals[1].id],notes:'Breeder has them for 5 days before move-in.'});
  db.layovers.push(lay);
  const care=(animalId,cat,detail,time,done,notes)=>db.care.push(stamp({id:uid('care'),demo:true,layoverId:lay.id,animalId,category:cat,detail,date:T,time,done:!!done,doneAt:done?nowISO():null,by:owner.id,notes:notes||''}));
  care(db.animals[0].id,'Water','Fresh water, add electrolytes','06:00',true,'Drank well');
  care(db.animals[0].id,'Feed','1.75 lb Maxxed Out, wet','06:30',true,'Cleaned it up');
  care(db.animals[0].id,'Snack','2 handfuls rolled oats','10:00',true,'');
  care(db.animals[0].id,'Wash/Rinse','Rinse & blow out, keep cool','14:00',false,'');
  care(db.animals[0].id,'Walk','15 min, easy','16:30',false,'');
  care(db.animals[1].id,'Water','Fresh water','06:00',true,'');
  care(db.animals[1].id,'Supplement','2 oz Game On in AM feed','06:30',true,'');
  // demo medications catalog + one already-cleared dose (illustrative — generic names, not advice)
  const medA=stamp({id:uid('med'),demo:true,name:'Example Dewormer',category:'Dewormer',withdrawalDays:8,route:'Oral',notes:'Enter real withdrawal from the product label.'});
  const medB=stamp({id:uid('med'),demo:true,name:'Example Antibiotic',category:'Antibiotic',withdrawalDays:18,route:'SubQ',notes:'Enter real withdrawal from the product label or your vet.'});
  db.meds.push(medA,medB);
  db.medLog.push(stamp({id:uid('dose'),demo:true,animalId:db.animals[0].id,medId:medA.id,name:medA.name,date:ago(20),withdrawalDays:8,withdrawalEnds:addDaysISO(ago(20),8),dose:'per label',route:'Oral',by:owner.id,notes:'Routine — cleared well before the fair.'}));
  db.seeded=true;
  logAct('seed','Loaded demo show team data');
}
const DEMO_ARRAYS=['animals','weights','feed','media','measurements','exercise','health','shows','entries','tasks','notes','expenses','income','recs','relatives','inventory','layovers','care','helpers','events','meds','medLog'];
function removeDemo(){
  DEMO_ARRAYS.forEach(k=>{ DB[k]=DB[k].filter(r=>!r.demo && !(r.animalId && (DB.animals.find(a=>a.id===r.animalId)||{}).demo)); });
  DB.animals=DB.animals.filter(a=>!a.demo);
  DB.users=DB.users.filter(u=>!u.demo);
  DB.seeded=false; save();
}
/* Convert the seeded demo records into permanent, real data: strip the `demo`
   tag from every record (and demo team members) so the "Demo" label disappears
   and nothing will ever be swept away by "remove demo data". Keeps everything. */
function promoteDemo(){
  let n=0;
  DEMO_ARRAYS.forEach(k=>{ (DB[k]||[]).forEach(r=>{ if(r.demo){ delete r.demo; if(k==='animals')n++; } }); });
  DB.users.forEach(u=>{ if(u.demo) delete u.demo; });
  DB.seeded=false;
  logAct('data','Kept demo animals as permanent records');
  save();
  return n;
}

/* ===================================================================
   SHEET / MODAL system
   =================================================================== */
let sheetStack=[];
function openSheet({title, body, foot, onClose}){
  const scrim=$('#scrim');
  const sheet=el('div','sheet');
  sheet.innerHTML =
    `<div class="sheet-head"><div class="grip"></div><button class="x" data-close>${ICON.x}</button><h3>${esc(title)}</h3></div>`+
    `<div class="sheet-body"></div>`+
    (foot?`<div class="sheet-foot"></div>`:'');
  $('.sheet-body',sheet).append(typeof body==='string'?htmlToFrag(body):body);
  if(foot) $('.sheet-foot',sheet).append(typeof foot==='string'?htmlToFrag(foot):foot);
  document.body.appendChild(sheet);
  const rec={sheet,onClose};
  sheetStack.push(rec);
  scrim.classList.add('show');
  requestAnimationFrame(()=>sheet.classList.add('show'));
  sheet.querySelector('[data-close]').onclick=()=>closeSheet();
  return sheet;
}
function closeSheet(all){
  const scrim=$('#scrim');
  const rec = sheetStack.pop();
  if(!rec){ scrim.classList.remove('show'); return; }
  rec.sheet.classList.remove('show');
  setTimeout(()=>rec.sheet.remove(),280);
  if(rec.onClose) try{rec.onClose();}catch(e){}
  if(all){ while(sheetStack.length){ const r=sheetStack.pop(); r.sheet.classList.remove('show'); setTimeout(()=>r.sheet.remove(),280);} }
  if(!sheetStack.length) scrim.classList.remove('show');
}
$('#scrim').addEventListener('click', ()=>closeSheet());
function htmlToFrag(h){ const t=el('div'); t.innerHTML=h; const f=document.createDocumentFragment(); while(t.firstChild)f.appendChild(t.firstChild); return f; }

function confirmSheet(title, msg, okLabel, danger){
  return new Promise(res=>{
    const body=el('div'); body.innerHTML=`<p style="font-size:14.5px;color:var(--ink-2);margin:2px 0 4px">${esc(msg)}</p>`;
    const foot=el('div');
    foot.innerHTML=`<button class="btn ghost" data-no>Cancel</button><button class="btn ${danger?'danger':'primary'}" data-yes>${esc(okLabel||'Confirm')}</button>`;
    const sh=openSheet({title, body, foot});
    $('[data-no]',sh).onclick=()=>{closeSheet();res(false);};
    $('[data-yes]',sh).onclick=()=>{closeSheet();res(true);};
  });
}

/* ===================================================================
   CHART helpers (inline SVG, no libs)
   =================================================================== */
function lineChart(series, opt={}){
  // series: [{data:[{x:iso,y:num}], color, dashed, name}] ; markers:[{x,color,label}]
  const W=opt.w||680, H=opt.h||190, pad={l:34,r:12,t:12,b:22};
  const all=series.flatMap(s=>s.data).filter(d=>d.y!=null);
  if(!all.length) return '<div class="empty" style="padding:20px">No data to chart yet</div>';
  const xs=all.map(d=>+parseD(d.x)), ys=all.map(d=>d.y).concat(opt.extraY||[]);
  let minX=Math.min(...xs), maxX=Math.max(...xs); if(minX===maxX)maxX=minX+86400000;
  let minY=Math.min(...ys), maxY=Math.max(...ys); const padY=(maxY-minY)*0.12||5; minY=Math.floor(minY-padY); maxY=Math.ceil(maxY+padY);
  const sx=x=>pad.l+((+parseD(x)-minX)/(maxX-minX))*(W-pad.l-pad.r);
  const sy=y=>H-pad.b-((y-minY)/(maxY-minY))*(H-pad.t-pad.b);
  let g='';
  // y gridlines
  for(let i=0;i<=3;i++){ const yv=minY+(maxY-minY)*i/3; const yy=sy(yv);
    g+=`<line x1="${pad.l}" y1="${yy}" x2="${W-pad.r}" y2="${yy}" stroke="var(--line)"/>`;
    g+=`<text x="4" y="${yy+3}" font-size="9" fill="var(--muted)">${Math.round(yv)}</text>`; }
  (opt.markers||[]).forEach(m=>{ const x=sx(m.x); g+=`<line x1="${x}" y1="${pad.t}" x2="${x}" y2="${H-pad.b}" stroke="${m.color||'#C4B5FD'}" stroke-width="1.5" stroke-dasharray="3 3"/>`; });
  series.forEach(s=>{ const pts=s.data.filter(d=>d.y!=null); if(pts.length<1)return;
    const d=pts.map((p,i)=>(i?'L':'M')+sx(p.x).toFixed(1)+' '+sy(p.y).toFixed(1)).join(' ');
    g+=`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width||2.4}" ${s.dashed?'stroke-dasharray="5 4"':''} stroke-linecap="round" stroke-linejoin="round"/>`;
    if(!s.dashed) pts.forEach(p=>{ g+=`<circle cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="2.6" fill="var(--card)" stroke="${s.color}" stroke-width="2"/>`; });
  });
  // x labels (first/last)
  g+=`<text x="${pad.l}" y="${H-6}" font-size="9" fill="var(--muted)">${fmtShort(all[0].x)}</text>`;
  g+=`<text x="${W-pad.r}" y="${H-6}" font-size="9" fill="var(--muted)" text-anchor="end">${fmtShort(series[0].data[series[0].data.length-1]?.x||all.at(-1).x)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" preserveAspectRatio="none">${g}</svg>`;
}
function barChart(items, opt={}){ // items:[{label,value,color}]
  if(!items.length) return '';
  const max=Math.max(...items.map(i=>i.value),1);
  return `<div style="display:flex;flex-direction:column;gap:9px">`+items.map(it=>{
    const pct=Math.round(it.value/max*100);
    return `<div><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:3px"><span>${esc(it.label)}</span><span class="tnum">${esc(it.disp!=null?it.disp:it.value)}</span></div>`+
    `<div style="height:9px;background:var(--line-2);border-radius:6px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${it.color||'var(--purple-3)'};border-radius:6px"></div></div></div>`;
  }).join('')+`</div>`;
}
function sparkline(vals,color='var(--teal-3)'){ if(vals.length<2)return''; const W=90,H=26; const min=Math.min(...vals),max=Math.max(...vals),r=max-min||1;
  const d=vals.map((v,i)=>(i?'L':'M')+(i/(vals.length-1)*W).toFixed(1)+' '+(H-2-((v-min)/r)*(H-4)).toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }

/* ===================================================================
   LOGO mark
   =================================================================== */
const LOGO = (c1='#4C1D95',c2='#0D9488')=>`<svg viewBox="0 0 48 48" fill="none">
  <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
  <path d="M24 4l4.5 6.2 7.3-1.6-1.1 7.4 6.6 3.6-5 5.6 3 6.9-7.5.3-2.4 7.1L24 41l-5.9 5.9M24 4l-4.5 6.2L12.2 8.6l1.1 7.4-6.6 3.6 5 5.6-3 6.9 7.5.3 2.4 7.1L24 41" stroke="url(#lg)" stroke-width="2.4" stroke-linejoin="round" fill="none" opacity=".28"/>
  <path d="M24 12c-4 0-7 2.4-7 6.5 0 2 .9 3.4 2 4.6-1.4 1-2.4 2.6-2.4 4.7 0 3.9 3.2 6.2 7.4 6.2s7.4-2.3 7.4-6.2c0-2.1-1-3.7-2.4-4.7 1.1-1.2 2-2.6 2-4.6 0-4.1-3-6.5-7-6.5z" fill="url(#lg)"/>
  <ellipse cx="24" cy="29" rx="3.4" ry="2.6" fill="#fff"/><circle cx="22.8" cy="29" r=".7" fill="${c1}"/><circle cx="25.2" cy="29" r=".7" fill="${c1}"/>
  <circle cx="18.5" cy="17" r="1.1" fill="#fff"/><circle cx="29.5" cy="17" r="1.1" fill="#fff"/>
</svg>`;
/* Brand badge = the real app icon (matches the home-screen tile) */
const brandImg = () => `<img src="icon-192.png" alt="Show Team" style="width:100%;height:100%;object-fit:cover;display:block">`;

/* ===================================================================
   ROUTER + CHROME
   =================================================================== */
const ROUTES = {};
function route(name, fn){ ROUTES[name]=fn; }
function go(hash){ if(location.hash===('#'+hash)) render(); else location.hash=hash; }
function parseHash(){ const h=(location.hash||'#/dashboard').slice(1); const [path,...rest]=h.split('?'); const parts=path.split('/').filter(Boolean); return {parts, q:new URLSearchParams(rest.join('?'))}; }

const NAV_MAIN = [
  ['dashboard','Dashboard',ICON.dash],['animals','Animals',ICON.animals],
  ['__add','Add Entry',ICON.plus],['calendar','Calendar',ICON.cal],['more','More',ICON.more],
];
function renderChrome(activeTop){
  let app=$('#app');
  if(!$('#view')){
    app.innerHTML =
      `<header class="app-header"><div class="row">
        <div class="brandmark">${brandImg()}</div>
        <div><h1>${esc(DB.team.name)}</h1><div class="sub">${esc(DB.team.subtitle||'Show Livestock')}</div></div>
        <div class="header-actions">
          <button class="iconbtn" id="hSearch" aria-label="Search">${ICON.search}</button>
          <button class="iconbtn" id="hBell" aria-label="Alerts">${ICON.bell}</button>
          <button class="avatar" id="hMe">${esc(initials(me().name))}</button>
        </div></div></header>
      <main id="view"></main>
      <nav class="bottomnav"></nav>`;
    $('#hSearch').onclick=openSearch; $('#hBell').onclick=openAlerts; $('#hMe').onclick=()=>go('/more');
  }
  const nav=$('.bottomnav'); nav.innerHTML='';
  NAV_MAIN.forEach(([id,label,icon])=>{
    if(id==='__add'){ const b=el('button','navitem fab',`<span class="fab-btn">${icon}</span>`); b.onclick=openQuickAdd; nav.appendChild(b); return; }
    const b=el('button','navitem'+(activeTop===id?' active':''),`${icon}<span>${label}</span>`); b.onclick=()=>go('/'+id); nav.appendChild(b);
  });
}
function setView(html, activeTop){ renderChrome(activeTop); const v=$('#view'); v.innerHTML = typeof html==='string'?html:''; if(typeof html!=='string')v.append(html); window.scrollTo(0,0); return v; }

/* header helper for sub-pages (back button) */
function pageHeader(title, backHash, right){
  return `<div style="display:flex;align-items:center;gap:6px;margin:-2px 0 12px">
    ${backHash?`<button class="iconbtn" style="background:var(--line-2);color:var(--ink)" onclick="go('${backHash}')">${ICON.back}</button>`:''}
    <h2 style="font-size:20px;font-weight:800;flex:1">${esc(title)}</h2>${right||''}</div>`;
}

function render(){
  if(!DB.currentUserId){ return renderLogin(); }
  if(!DB.setupComplete){ return renderSetup(); }
  const {parts,q}=parseHash();
  const name=parts[0]||'dashboard';
  const fn=ROUTES[name]||ROUTES.dashboard;
  try{ fn(parts,q); }catch(e){ console.error(e); setView(`<div class="empty"><div class="h">Something went wrong</div><div class="p">${esc(e.message)}</div></div>`,'dashboard'); }
}
window.addEventListener('hashchange', render);
window.go=go; window.render=render;

/* ===================================================================
   BOOT
   =================================================================== */
/* ===================================================================
   CLOUD — Supabase-backed shared data, auth, media & live sync.
   Model: each team's entire dataset is one JSON document in the `teams`
   table (guarded by Row-Level Security via team membership). Every device
   reads it into the in-memory `DB`, writes push the document back, and a
   Realtime subscription streams other devices' changes in live. Media
   blobs live in the private `media` Storage bucket. Fully degrades to
   local-only when no keys are configured. See supabase/SETUP.md.
   =================================================================== */
function cloudConfig(){
  let c = (window.DFST_CONFIG && window.DFST_CONFIG.supabaseUrl) ? window.DFST_CONFIG : null;
  if(!c){ try{ c=JSON.parse(localStorage.getItem('dfst_cloud_cfg')||'null'); }catch(e){} }
  return (c && c.supabaseUrl && c.supabaseAnonKey) ? c : null;
}
const Cloud = {
  enabled:false, sb:null, user:null, teamId:null, role:'Owner', cfg:null,
  channel:null, pushTimer:null, sentTokens:[], applying:false, pending:false,
  init(){
    this.cfg=cloudConfig();
    if(!this.cfg || !window.supabase){ return false; }
    try{ this.sb=window.supabase.createClient(this.cfg.supabaseUrl, this.cfg.supabaseAnonKey, {auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}}); }
    catch(e){ console.error('Supabase init failed',e); return false; }
    this.enabled=true; return true;
  },
  async session(){ try{ const {data}=await this.sb.auth.getSession(); return data.session; }catch(e){ return null; } },
  token(){ return 'w_'+Math.random().toString(36).slice(2)+Date.now().toString(36); },

  /* Establish the signed-in user, resolve team + data, subscribe to live updates */
  async onAuthed(session){
    this.user=session.user;
    const uid_ = this.user.id;
    const name = this.user.user_metadata?.name || (this.user.email||'').split('@')[0];
    const email = this.user.email;
    await this.acceptInvites(uid_, email);
    let team = await this.loadTeam(uid_);
    if(!team){ team = await this.createTeamFromLocal(uid_, name, email); }
    if(!team){ toast('Signed in, but no team is available','bad'); return; }
    this.teamId=team.teamId; this.role=team.role;
    this.applying=true;
    DB = mergeDefaults(team.data || blankDB());
    reconcileMember(uid_, name, email, this.role);
    DB.currentUserId=uid_;
    if(!DB.breeds || !DB.breeds.length) seedBreeds(DB);
    save(true);
    this.applying=false;
    save(); // push reconciled membership back up
    this.subscribe();
  },
  async loadTeam(uid_){
    const {data:mems,error}=await this.sb.from('team_members').select('team_id,role');
    if(error){ console.error(error); return null; }
    if(!mems || !mems.length) return null;
    const m = mems.find(x=>x.role==='Owner') || mems[0];
    const {data:team,error:e2}=await this.sb.from('teams').select('data').eq('id',m.team_id).single();
    if(e2){ console.error(e2); return null; }
    return { teamId:m.team_id, role:m.role, data:team && team.data };
  },
  async createTeamFromLocal(uid_, name, email){
    // First owner: their existing local data becomes the team's cloud document.
    const local = mergeDefaults(load() || blankDB());
    reconcileMember(uid_, name, email, 'Owner');
    local.currentUserId=uid_;
    const {data:team,error}=await this.sb.from('teams').insert({ owner:uid_, name:local.team?.name||'Show Team', data:local, write_token:this.token() }).select('id').single();
    if(error){ console.error(error); toast('Could not create team: '+error.message,'bad'); return null; }
    const {error:me_}=await this.sb.from('team_members').insert({ team_id:team.id, user_id:uid_, role:'Owner' });
    if(me_) console.error(me_);
    return { teamId:team.id, role:'Owner', data:local };
  },
  async acceptInvites(uid_, email){
    if(!email) return;
    const {data:invs}=await this.sb.from('team_invites').select('id,team_id,role').ilike('email',email);
    if(!invs || !invs.length) return;
    for(const inv of invs){
      await this.sb.from('team_members').upsert({ team_id:inv.team_id, user_id:uid_, role:inv.role }, {onConflict:'team_id,user_id'});
      await this.sb.from('team_invites').delete().eq('id',inv.id);
    }
  },
  schedulePush(){
    if(!this.enabled || !this.teamId) return;
    clearTimeout(this.pushTimer);
    this.pushTimer=setTimeout(()=>this.push(), 650);
  },
  async push(){
    if(!this.enabled || !this.teamId) return;
    if(!navigator.onLine){ this.pending=true; return; }
    const tok=this.token(); this.sentTokens.push(tok); if(this.sentTokens.length>12)this.sentTokens.shift();
    const payload={ data:DB, name:DB.team?.name, updated_at:new Date().toISOString(), write_token:tok };
    const {error}=await this.sb.from('teams').update(payload).eq('id',this.teamId);
    if(error){ console.error('push failed',error); this.pending=true; }
    else this.pending=false;
  },
  subscribe(){
    if(this.channel){ try{ this.sb.removeChannel(this.channel); }catch(e){} }
    this.channel=this.sb.channel('team_'+this.teamId)
      .on('postgres_changes', {event:'UPDATE', schema:'public', table:'teams', filter:'id=eq.'+this.teamId}, payload=>{
        const row=payload.new; if(!row) return;
        if(row.write_token && this.sentTokens.includes(row.write_token)) return; // ignore our own echoes
        this.applyRemote(row.data);
      }).subscribe();
    window.addEventListener('online', ()=>{ if(this.pending) this.push(); });
  },
  applyRemote(data){
    if(!data) return;
    const keepUser=DB.currentUserId, keepRecent=DB._recentAnimals, keepScale=DB.lastScale;
    this.applying=true;
    DB = mergeDefaults(data);
    DB.currentUserId=keepUser; DB._recentAnimals=keepRecent; DB.lastScale=keepScale;
    save(true);
    this.applying=false;
    // Don't yank the UI out from under an open editor; refresh quietly instead.
    if(!sheetStack.length){ render(); } else { toast('Synced changes from your team',''); }
  },
  async signOut(){ try{ if(this.channel) this.sb.removeChannel(this.channel); await this.sb.auth.signOut(); }catch(e){} this.user=null; this.teamId=null; this.channel=null; },
};
/* merge a loaded/remote object onto the schema defaults so new fields never break old docs */
function mergeDefaults(obj){ const base=blankDB(); const out={...base, ...obj}; for(const k of Object.keys(base)){ if(Array.isArray(base[k]) && !Array.isArray(out[k])) out[k]=base[k]; if(base[k] && typeof base[k]==='object' && !Array.isArray(base[k])) out[k]={...base[k], ...(obj&&obj[k]||{})}; } return out; }
/* ensure the signed-in auth user is represented in DB.users, remapping any pending/demo invite by email */
function reconcileMember(uid_, name, email, role){
  DB.users = DB.users||[];
  let byId = DB.users.find(u=>u.id===uid_);
  let byEmail = email && DB.users.find(u=>u.email && u.email.toLowerCase()===email.toLowerCase() && u.id!==uid_);
  if(byEmail){ // a pending invite / placeholder for this person — adopt their real auth id
    const old=byEmail.id;
    DB.animals.forEach(a=>{ if(a.advisorId===old)a.advisorId=uid_; });
    byEmail.id=uid_; byEmail.invited=false; byEmail.verified=true; if(name)byEmail.name=byEmail.name||name; byId=byEmail;
    DB.users=DB.users.filter((u,i)=>DB.users.findIndex(x=>x.id===u.id)===i); // dedupe by id
  }
  if(!byId){ DB.users.push({ id:uid_, name:name||'Member', email, role: role||(DB.users.length?'Editor':'Owner'), verified:true }); }
  else { if(role && byId.role!=='Owner') byId.role=role; if(email&&!byId.email)byId.email=email; }
}

async function boot(){
  load();
  if(!DB){ DB=blankDB(); seedBreeds(DB); save(true); }
  else { DB=mergeDefaults(DB); if(!DB.breeds || !DB.breeds.length) seedBreeds(DB);
    // self-heal: any species that actually has animals must be selectable
    let healed=false; DB.species.forEach(sp=>{ if(!sp.active && DB.animals.some(a=>a.species===sp.id)){ sp.active=true; healed=true; } });
    // self-heal: inventory products gain a category + base unit for costing
    (DB.inventory||[]).forEach(p=>{ if(!p.category)p.category='feed'; if(!p.unit)p.unit=(p.category==='bedding'?'bag':'lb'); });
    // self-heal: unit label 'scoops' -> singular 'scoop' (so the picker still matches)
    (DB.feed||[]).forEach(f=>(f.meals||[]).forEach(m=>(m.items||[]).forEach(it=>{ if(it.unit==='scoops')it.unit='scoop'; })));
    // self-heal: tasks move from a single animalId to an animalIds array,
    // and gain per-animal progress (seeded from any prior whole-task completion)
    (DB.tasks||[]).forEach(t=>{ if(!t.animalIds){ t.animalIds = (t.animalId!=null&&t.animalId!=='')?[t.animalId]:[]; delete t.animalId; }
      if(t.animalIds.length && !t.progress){ t.progress={};
        if(t.recur && (t.doneDates||[]).length){ t.doneDates.forEach(d=>t.progress[d]=[...t.animalIds]); }
        else if(!t.recur && t.done){ t.progress[t.date]=[...t.animalIds]; } } });
    save(true); }
  if(Cloud.init()){
    try{
      const s=await Cloud.session();
      if(s){ await Cloud.onAuthed(s); }
      Cloud.sb.auth.onAuthStateChange((ev, session)=>{
        if(ev==='SIGNED_OUT'){ DB.currentUserId=null; render(); }
      });
    }catch(e){ console.error('cloud boot',e); }
  }
  render();
  if('serviceWorker' in navigator){ Push.swReg = navigator.serviceWorker.register('sw.js').catch(()=>null); Push.syncOnLoad(); }
}

/* ===================================================================
   WEB PUSH — real notifications that reach the phone with the app closed.
   The browser subscribes here and the subscription is stored in Supabase;
   a scheduled Edge Function (supabase/functions/push-reminders) sends the
   pushes. Needs cloud sync on + a VAPID public key in config. iOS requires
   the app be added to the Home Screen first (iOS 16.4+).
   =================================================================== */
const Push = {
  swReg:null,
  vapid(){ const c=cloudConfig(); return (window.DFST_CONFIG&&window.DFST_CONFIG.vapidPublicKey)|| (c&&c.vapidPublicKey) || ''; },
  supported(){ return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; },
  ready(){ return Cloud.enabled && Cloud.teamId && this.supported() && !!this.vapid(); },
  permission(){ return (typeof Notification!=='undefined') ? Notification.permission : 'denied'; },
  async registration(){ try{ return (this.swReg && await this.swReg) || await navigator.serviceWorker.ready; }catch(e){ return null; } },
  async current(){ const r=await this.registration(); if(!r||!r.pushManager) return null; try{ return await r.pushManager.getSubscription(); }catch(e){ return null; } },
  b64ToU8(b64){ const pad='='.repeat((4-b64.length%4)%4); const s=(b64+pad).replace(/-/g,'+').replace(/_/g,'/'); const raw=atob(s); const arr=new Uint8Array(raw.length); for(let i=0;i<raw.length;i++)arr[i]=raw.charCodeAt(i); return arr; },
  subJSON(sub){ const j=sub.toJSON(); return { endpoint:j.endpoint, p256dh:j.keys&&j.keys.p256dh, auth:j.keys&&j.keys.auth }; },
  async enable(){
    if(!this.ready()){ toast('Turn on cloud sync first','bad'); return false; }
    const perm = await Notification.requestPermission();
    if(perm!=='granted'){ toast(perm==='denied'?'Notifications are blocked in your browser settings':'Notifications not enabled','bad'); return false; }
    const reg=await this.registration(); if(!reg){ toast('Service worker not ready — reload and retry','bad'); return false; }
    let sub=await this.current();
    if(!sub){ try{ sub=await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:this.b64ToU8(this.vapid()) }); }
      catch(e){ console.error('subscribe',e); toast('Could not subscribe to push','bad'); return false; } }
    const ok=await this.save(sub);
    if(ok){ toast('Push notifications on for this device','good'); } return ok;
  },
  async disable(){
    const sub=await this.current();
    if(sub){ const j=this.subJSON(sub); try{ await sub.unsubscribe(); }catch(e){}
      if(Cloud.enabled&&Cloud.teamId){ try{ await Cloud.sb.from('push_subscriptions').delete().eq('endpoint',j.endpoint); }catch(e){} } }
    toast('Push notifications off for this device',''); return true;
  },
  async save(sub){
    if(!(Cloud.enabled&&Cloud.teamId)) return false;
    const j=this.subJSON(sub);
    const row={ endpoint:j.endpoint, p256dh:j.p256dh, auth:j.auth, team_id:Cloud.teamId, user_id:(Cloud.user&&Cloud.user.id)||null,
      prefs:DB.notifPrefs||{}, ua:(navigator.userAgent||'').slice(0,180), updated_at:new Date().toISOString() };
    try{ const {error}=await Cloud.sb.from('push_subscriptions').upsert(row,{onConflict:'endpoint'}); if(error)throw error; return true; }
    catch(e){ console.error('save sub',e); toast('Couldn’t save subscription (run supabase/push.sql?)','bad'); return false; }
  },
  // keep the stored prefs/token fresh whenever the app loads while subscribed
  async syncOnLoad(){ try{ if(!this.ready()||this.permission()!=='granted') return; const sub=await this.current(); if(sub) this.save(sub); }catch(e){} },
  // fire a local notification so the user can confirm the pipe before the server is set up
  async test(){
    if(this.permission()!=='granted'){ const p=await Notification.requestPermission(); if(p!=='granted'){ toast('Allow notifications first','bad'); return; } }
    const reg=await this.registration(); if(!reg){ toast('Service worker not ready','bad'); return; }
    reg.showNotification((DB.team&&DB.team.name)||'Show Team', { body:'Test notification — you’re all set. Reminders will look like this.', icon:'icon-192.png', badge:'favicon-32.png', vibrate:[40,30,40], data:{url:'./'} });
    toast('Sent a test notification','good');
  }
};

/* ===================================================================
   LOGIN (local accounts — cloud auth is the backend phase; see README)
   =================================================================== */
let loginMode='signin'; // 'signin' | 'signup'
function renderLogin(){
  const cloud = Cloud.enabled;
  const existing = DB.users.length;
  const isSignup = !cloud ? !existing : loginMode==='signup';
  $('#app').innerHTML = `<div class="login"><div class="box">
    <div class="logo">${brandImg()}</div>
    <h1>Show Team</h1><div class="tag">Show livestock, dialed in.</div>
    <div class="card">
      <div class="oauth">
        <button class="btn block" data-oauth="google">${gicon()} Continue with Google</button>
        <button class="btn block" data-oauth="apple">${aicon()} Continue with Apple</button>
      </div>
      <div class="orline">OR</div>
      ${isSignup?`<div class="field"><label>Name</label><input class="control" id="lgName" placeholder="Your name" value="${cloud?'':esc(me().name||'')}"></div>`:''}
      <div class="field"><label>Email</label><input class="control" id="lgEmail" type="email" placeholder="you@example.com" value="${(!cloud&&!existing)?'david.devitt@fortressds.com':''}"></div>
      <div class="field"><label>Password</label><input class="control" id="lgPass" type="password" placeholder="••••••••"></div>
      <button class="btn primary block" id="lgGo" style="margin-top:4px">${isSignup?'Create account':'Sign in'}</button>
      ${cloud?`<div style="text-align:center;margin-top:12px;font-size:12.5px;color:var(--muted);font-weight:600">
        ${isSignup?'Already have an account? <a href="#" id="lgToggle">Sign in</a>':'New here? <a href="#" id="lgToggle">Create an account</a>'}
        &nbsp;·&nbsp; <a href="#" id="lgForgot">Forgot password?</a></div>`:`
      <div style="text-align:center;margin-top:12px;font-size:12.5px;color:var(--muted);font-weight:600"><a href="#" id="lgForgot">Forgot password?</a></div>
      ${existing?userSwitcher():''}`}
    </div>
    <p style="color:rgba(255,255,255,.5);font-size:11px;text-align:center;margin-top:18px;line-height:1.5">
      ${cloud?'Secure cloud sessions · Email verification · Live multi-device sync':'Local mode · <a href="#" id="lgConnect" style="color:rgba(255,255,255,.8)">Connect to cloud</a> for shared multi-device data'}</p>
  </div></div>`;

  if(cloud){
    $('#lgGo').onclick=()=>cloudAuthSubmit(isSignup);
    $$('[data-oauth]').forEach(b=>b.onclick=async()=>{ try{ await Cloud.sb.auth.signInWithOAuth({ provider:b.dataset.oauth, options:{ redirectTo:location.href.split('#')[0] } }); }catch(e){ toast(e.message,'bad'); } });
    if($('#lgToggle'))$('#lgToggle').onclick=e=>{ e.preventDefault(); loginMode=isSignup?'signin':'signup'; renderLogin(); };
    $('#lgForgot').onclick=async e=>{ e.preventDefault(); const em=$('#lgEmail').value.trim(); if(!em){toast('Enter your email first','bad');return;} try{ await Cloud.sb.auth.resetPasswordForEmail(em,{redirectTo:location.href.split('#')[0]}); toast('Password reset email sent','good'); }catch(err){ toast(err.message,'bad'); } };
  } else {
    // local-only accounts (no cloud configured)
    const signIn=(name,email,via)=>{ name=name||(email?email.split('@')[0]:'David Devitt');
      let u = DB.users.find(x=>x.email && email && x.email.toLowerCase()===email.toLowerCase());
      if(!u){ u={ id:uid('u'), name, email, role: DB.users.length?'Editor':'Owner', via, verified:true }; DB.users.push(u); }
      DB.currentUserId=u.id; logAct('login',(via?via+' · ':'')+u.name); save(); render(); };
    $('#lgGo').onclick=()=>{ const n=$('#lgName')?$('#lgName').value.trim():'', e=$('#lgEmail').value.trim(); if(!e){toast('Enter an email','bad');return;} signIn(n,e); };
    $$('[data-oauth]').forEach(b=>b.onclick=()=>signIn(null, $('#lgEmail').value.trim()||'david.devitt@fortressds.com', b.dataset.oauth));
    $('#lgForgot').onclick=e=>{e.preventDefault(); toast('Password reset link sent (demo)','good');};
    $$('[data-switch]').forEach(b=>b.onclick=()=>{ DB.currentUserId=b.dataset.switch; save(); render(); });
    if($('#lgConnect'))$('#lgConnect').onclick=e=>{ e.preventDefault(); openCloudConnect(); };
  }
}
async function cloudAuthSubmit(isSignup){
  const email=$('#lgEmail').value.trim(), pass=$('#lgPass').value, name=$('#lgName')?$('#lgName').value.trim():'';
  if(!email||!pass){ toast('Email and password required','bad'); return; }
  const btn=$('#lgGo'); btn.disabled=true; const orig=btn.textContent; btn.textContent='…';
  try{
    if(isSignup){
      const {data,error}=await Cloud.sb.auth.signUp({ email, password:pass, options:{ data:{name}, emailRedirectTo:location.href.split('#')[0] } });
      if(error) throw error;
      if(!data.session){ toast('Check your email to confirm your account, then sign in','good'); loginMode='signin'; renderLogin(); return; }
      await Cloud.onAuthed(data.session); render();
    } else {
      const {data,error}=await Cloud.sb.auth.signInWithPassword({ email, password:pass });
      if(error) throw error;
      await Cloud.onAuthed(data.session); render();
    }
  }catch(e){ toast(e.message||'Sign-in failed','bad'); btn.disabled=false; btn.textContent=orig; }
}
function userSwitcher(){
  return `<hr class="soft"><div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Quick switch (demo devices)</div>`+
    DB.users.map(u=>`<button class="li" data-switch="${u.id}" style="width:100%;border-radius:12px;border:1px solid var(--line);margin-bottom:6px">
      <div class="thumb">${esc(initials(u.name))}</div><div class="main"><div class="t1">${esc(u.name)}</div><div class="t2">${esc(u.role)} · ${esc(u.email||'')}</div></div>${ICON.chev}</button>`).join('');
}
function gicon(){return `<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.9 35.8 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>`;}
function aicon(){return `<svg width="16" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.9c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.5 2.2 2.6 2.1 1-.04 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.6 1.1 0 1.8-1 2.5-2 .8-1.2 1.1-2.3 1.1-2.4-.02-.01-2.1-.8-2.1-3.1zM14.3 6.3c.6-.7 1-1.7.9-2.7-.9.04-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .07 2-.5 2.5-1.2z"/></svg>`;}

/* ===================================================================
   SETUP WIZARD
   =================================================================== */
function renderSetup(){
  $('#app').innerHTML = `<div style="min-height:100vh;background:var(--bg)">
    <header class="app-header" style="border-radius:0"><div class="row">
      <div class="brandmark">${brandImg()}</div>
      <div><h1>Welcome, ${esc(me().name.split(' ')[0])}</h1><div class="sub">Let's set up your show team</div></div>
    </div></header>
    <main style="max-width:520px"><div id="setupBody"></div></main></div>`;
  renderSetupStep(0);
}
let setupState={species:{swine:true,sheep:true,goat:true,cattle:true}, invited:[]};
function renderSetupStep(step){
  const steps=[
    {t:'Your team', render:setupTeam},
    {t:'Active species', render:setupSpecies},
    {t:'Invite family', render:setupInvite},
    {t:'Weekly weigh-in day', render:setupWeighDay},
    {t:'Sample data', render:setupDemo},
  ];
  const s=steps[step];
  const b=$('#setupBody');
  b.innerHTML = `<div style="display:flex;gap:5px;margin-bottom:18px">${steps.map((_,i)=>`<div style="flex:1;height:5px;border-radius:3px;background:${i<=step?'var(--purple-3)':'var(--line)'}"></div>`).join('')}</div>
    <div class="card pad"><div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px">Step ${step+1} of ${steps.length}</div>
    <h2 style="font-size:20px;margin-bottom:14px">${s.t}</h2><div id="stepInner"></div></div>
    <div class="btn-row" style="margin-top:16px">
      ${step>0?`<button class="btn ghost" id="sBack">Back</button>`:`<button class="btn ghost" id="sSkip">Skip setup</button>`}
      <button class="btn primary" id="sNext" style="flex:1">${step===steps.length-1?'Finish':'Continue'}</button></div>`;
  currentStepObj=s;
  s.render($('#stepInner'));
  $('#sNext').onclick=()=>{ if(s.save && s.save()===false)return; if(step===steps.length-1){ finishSetup(); } else renderSetupStep(step+1); };
  if($('#sBack'))$('#sBack').onclick=()=>renderSetupStep(step-1);
  if($('#sSkip'))$('#sSkip').onclick=()=>{ finishSetup(); };
}
let currentStepObj;
function setupTeam(box){
  box.innerHTML=`<div class="field"><label>Team name</label><input class="control" id="stName" value="${esc(DB.team.name)}"></div>
    <div class="field"><label>Subtitle</label><input class="control" id="stSub" value="${esc(DB.team.subtitle)}"></div>
    <div class="help">${ICON.info}<span>Your logo and brand colors (deep purple + teal) are already applied. You can fine-tune everything later in Settings.</span></div>`;
  currentStepObj.save=()=>{ DB.team.name=$('#stName').value.trim()||DB.team.name; DB.team.subtitle=$('#stSub').value.trim(); save(); };
}
function setupSpecies(box){
  box.innerHTML=`<p style="font-size:13px;color:var(--muted);margin-bottom:12px">Turn on the species you're showing. You can add more (rabbits, poultry, horses…) anytime.</p>
    <div class="grid g2">${SPECIES_DEFS.map(sp=>`<button class="chip" data-sp="${sp.id}" style="justify-content:flex-start;padding:14px;height:auto;border-radius:14px;${setupState.species[sp.id]?'background:var(--purple);color:#fff;border-color:var(--purple)':''}">
      <span style="width:22px;height:22px">${spIcon(sp.id)}</span> ${sp.name}</button>`).join('')}</div>`;
  $$('[data-sp]',box).forEach(btn=>btn.onclick=()=>{ const id=btn.dataset.sp; setupState.species[id]=!setupState.species[id];
    btn.style.cssText = setupState.species[id]?'justify-content:flex-start;padding:14px;height:auto;border-radius:14px;background:var(--purple);color:#fff;border-color:var(--purple)':'justify-content:flex-start;padding:14px;height:auto;border-radius:14px'; });
  currentStepObj.save=()=>{ DB.species.forEach(sp=>sp.active=!!setupState.species[sp.id]); save(); };
}
function setupInvite(box){
  box.innerHTML=`<p style="font-size:13px;color:var(--muted);margin-bottom:12px">Invite Amanda or other family members. Everyone gets their own secure login — no shared password.</p>
    <div class="field-row"><input class="control" id="invEmail" placeholder="name@example.com" type="email"><select class="control" id="invRole" style="max-width:140px">${['Administrator','Editor','Contributor','Viewer','Advisor'].map(r=>`<option>${r}</option>`).join('')}</select></div>
    <button class="btn sm block" id="invAdd" style="margin-top:2px">${ICON.plus} Add invite</button>
    <div id="invList" style="margin-top:12px"></div>`;
  const paint=()=>{ $('#invList').innerHTML = setupState.invited.map((v,i)=>`<div class="li" style="border:1px solid var(--line);border-radius:12px;margin-bottom:6px"><div class="thumb">${ICON.team}</div><div class="main"><div class="t1">${esc(v.email)}</div><div class="t2">${esc(v.role)}</div></div><button class="iconbtn" style="background:var(--line-2);color:var(--bad)" data-rm="${i}">${ICON.x}</button></div>`).join('');
    $$('[data-rm]').forEach(b=>b.onclick=()=>{setupState.invited.splice(+b.dataset.rm,1);paint();}); };
  $('#invAdd').onclick=()=>{ const e=$('#invEmail').value.trim(); if(!e)return; setupState.invited.push({email:e,role:$('#invRole').value}); $('#invEmail').value=''; paint(); };
  paint();
  currentStepObj.save=()=>{ setupState.invited.forEach(v=>{ if(!DB.users.find(u=>u.email===v.email)) DB.users.push({id:uid('u'),name:v.email.split('@')[0],email:v.email,role:v.role,invited:true,verified:false}); }); save(); };
}
function setupWeighDay(box){
  const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  box.innerHTML=`<p style="font-size:13px;color:var(--muted);margin-bottom:12px">Pick the day you weigh the barn. We'll remind you and flag any animal missing a weekly weight.</p>
    <div class="grid g2">${days.map((d,i)=>`<button class="chip" data-d="${i}" style="padding:13px;border-radius:12px;${DB.team.weighDay===i?'background:var(--purple);color:#fff;border-color:var(--purple)':''}">${d}</button>`).join('')}</div>`;
  $$('[data-d]',box).forEach(b=>b.onclick=()=>{ DB.team.weighDay=+b.dataset.d; save(); renderSetupStep(3); });
}
function setupDemo(box){
  box.innerHTML=`<p style="font-size:13px;color:var(--muted);margin-bottom:12px">Want to explore with realistic demo animals (Batman, Biscuit, Spotacus and the rest of the show string)? They're clearly marked and you can remove them anytime in Settings.</p>
    <div class="seg" id="demoSeg"><button class="on" data-v="1">Load demo animals</button><button data-v="0">Start empty</button></div>
    <div class="help" style="margin-top:12px">${ICON.info}<span>Either way you can add your own animals right after setup.</span></div>`;
  let v=1; $$('#demoSeg button').forEach(b=>b.onclick=()=>{ v=+b.dataset.v; $$('#demoSeg button').forEach(x=>x.classList.toggle('on',x===b)); });
  currentStepObj.save=()=>{ setupState._demo=v; };
}
function finishSetup(){
  if(setupState._demo!==0 && !DB.seeded) seedDemo(DB);
  DB.setupComplete=true; logAct('setup','Completed setup wizard'); save();
  toast('Welcome to your show team!','good'); location.hash='#/dashboard'; render();
}

/* ===================================================================
   DASHBOARD
   =================================================================== */
/* ---------- Dashboard flair helpers ---------- */
function firstName(n){ return ((n||'').trim().split(/\s+/)[0])||'there'; }
function greeting(){ const h=new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; }
function countUp(node, to, dur=650){ to=+to||0; if(to<=0){ node.textContent='0'; return; } const start=performance.now();
  const tick=now=>{ const p=Math.min(1,(now-start)/dur); node.textContent=Math.round(to*(1-Math.pow(1-p,3))); if(p<1)requestAnimationFrame(tick); };
  requestAnimationFrame(tick); }
function activityStreak(){ const days=new Set((DB.activity||[]).map(a=>(a.ts||'').slice(0,10)).filter(Boolean));
  let n=0, d=todayISO(); if(!days.has(d)) d=addDaysISO(d,-1);           // today not logged yet? count from yesterday
  while(days.has(d)){ n++; d=addDaysISO(d,-1); } return n; }
function herdAvgAdg(active){ const xs=active.map(a=>animalStats(a).adgLife).filter(v=>v!=null); return xs.length?round(xs.reduce((s,v)=>s+v,0)/xs.length,2):null; }
function biggestGainer(active, days=7){ let best=null; const cut=addDaysISO(todayISO(),-days);
  active.forEach(a=>{ const ws=weightsFor(a.id).filter(w=>w.date>=cut); if(ws.length<2)return; const g=round(+ws[ws.length-1].weight-+ws[0].weight,1); if(g>0&&(!best||g>best.gain))best={a,gain:g}; }); return best; }
let starOverride=null;  // tap the shuffle button to feature a different animal
function animalOfDay(active){ if(!active.length)return null;
  if(starOverride){ const o=active.find(a=>a.id===starOverride); if(o)return o; }
  const key=todayISO().replace(/-/g,''); let h=0; for(let i=0;i<key.length;i++)h=(h*31+key.charCodeAt(i))>>>0; return active[h%active.length]; }
function barnBriefing(ctx){ const p=[];
  if(ctx.showSoon) p.push(`${ctx.showSoon.name} ${daysBetween(todayISO(),ctx.showSoon.start)===0?'is today':'is tomorrow'} 🏆`);
  else if(ctx.nextShow) p.push(`${daysBetween(todayISO(),ctx.nextShow.start)} days to ${ctx.nextShow.name}`);
  if(ctx.needWeigh.length) p.push(`${ctx.needWeigh.length} need a weigh-in`);
  if(ctx.taskCount) p.push(`${ctx.taskCount} task${ctx.taskCount===1?'':'s'} on deck`);
  if(ctx.lay) p.push('layover in progress');
  if(!p.length) return 'The barn’s in good shape — nothing urgent today. 👍';
  return p.slice(0,3).join(' · '); }
function todaysFocus(ctx){
  const {active, needWeigh, showSoon, todayTasks}=ctx;
  if(showSoon) return {icon:ICON.clipboard,color:'#DB2777',title:'It’s show day',sub:'Open show-day mode',go:'/showday/'+showSoon.id};
  const grp=todayTasks.find(({t})=>taskAnimalIds(t).filter(id=>getAnimal(id)).length>=2);
  if(grp){ const t=grp.t; const ids=taskAnimalIds(t).filter(id=>getAnimal(id)); const dn=taskProgress(t,grp.date).filter(id=>ids.includes(id)).length;
    return {icon:ICON.check,color:'var(--purple-3)',title:t.title,sub:`${dn}/${ids.length} done — keep working through them`,fn:()=>openTaskProgressSheet(t.id,grp.date)}; }
  if(needWeigh.length) return {icon:ICON.weight,color:'var(--teal-3)',title:`Weigh ${needWeigh.length} animal${needWeigh.length===1?'':'s'}`,sub:'Due for a weekly weight',fn:()=>openWeightSheet(needWeigh[0].id)};
  const behind=active.filter(a=>coachEligible(a)&&coachStatus(a).state==='under');
  if(behind.length) return {icon:ICON.target,color:'var(--bad)',title:`${behind.length} behind on their game plan`,sub:'See what they need',go:'/coach'};
  if(todayTasks.length){ const {t,date}=todayTasks[0]; return {icon:ICON.check,color:'var(--purple-3)',title:t.title,sub:'Due today',fn:()=>{ const ids=taskAnimalIds(t).filter(id=>getAnimal(id)); ids.length>=2?openTaskProgressSheet(t.id,date):openTaskSheet(t.id); }}; }
  const noPhoto=active.find(a=>!mediaFor(a.id).length);
  if(noPhoto) return {icon:ICON.camera,color:'var(--info)',title:'Snap a progress photo',sub:noPhoto.name+' doesn’t have one yet',go:'/animal/'+noPhoto.id+'/media'};
  return {icon:ICON.star,color:'var(--good)',title:'All caught up',sub:'Nice work — the barn’s dialed in',go:null};
}
route('dashboard', ()=>{
  const active=activeAnimals();
  const bySpecies={}; DB.species.filter(s=>s.active).forEach(s=>bySpecies[s.id]=0);
  active.forEach(a=>bySpecies[a.species]=(bySpecies[a.species]||0)+1);
  const weighDay=DB.team.weighDay;
  const startWeek=(()=>{ const d=new Date(); const diff=(d.getDay()-weighDay+7)%7; d.setDate(d.getDate()-diff); return isoDate(d); })();
  const weighedThisWeek=active.filter(a=>weightsFor(a.id).some(w=>w.date>=startWeek)).length;
  const needWeigh=active.filter(a=>{ const ws=weightsFor(a.id); return !ws.length || daysBetween(ws[ws.length-1].date,todayISO())>=7; });
  const upcoming=DB.shows.filter(s=>s.start>=todayISO()).sort((a,b)=>a.start<b.start?-1:1);
  const nextShow=upcoming[0];
  const alertAnimals=active.filter(a=>activeWeightAlerts(a).some(x=>x.k==='bad'||x.k==='warn'));
  const recentMedia=DB.media.slice().sort((a,b)=>a.createdAt<b.createdAt?1:-1).slice(0,6);
  // Occurrence-aware: a repeating task shows today's occurrence (unless done
  // for today); a one-off shows if due today or overdue.
  const todayTasks=[];
  DB.tasks.forEach(t=>{ if(t.recur){ if(t.date<=todayISO() && !taskDoneOn(t,todayISO())) todayTasks.push({t,date:todayISO()}); }
    else if(!t.done && t.date<=todayISO()) todayTasks.push({t,date:t.date}); });
  todayTasks.sort((a,b)=>a.date<b.date?-1:1).splice(6);
  const soonEvents=(DB.events||[]).filter(e=>e.date>=todayISO() && daysBetween(todayISO(),e.date)<=2).sort((a,b)=>(a.date+(a.startTime||'99'))<(b.date+(b.startTime||'99'))?-1:1).slice(0,4);
  const recentFeed=DB.feed.slice().sort((a,b)=>a.createdAt<b.createdAt?1:-1).slice(0,3);

  const v=setView('','dashboard');
  const wrap=el('div');
  const u=me(); const lay=activeLayover(); const showSoon=upcoming.find(s=>daysBetween(todayISO(),s.start)>=0&&daysBetween(todayISO(),s.start)<=1);
  const streak=activityStreak(); const herdAdg=herdAvgAdg(active); const gainer=biggestGainer(active,7);
  const ctx={active,needWeigh,nextShow,showSoon,lay,todayTasks,taskCount:todayTasks.length};
  const focus=todaysFocus(ctx);
  const shownSp=DB.species.filter(s=>(bySpecies[s.id]||0)>0);
  // HERO — greeting + smart barn briefing
  wrap.append(htmlToFrag(`
    <div class="card pad" style="position:relative;overflow:hidden;background:linear-gradient(135deg,#2E1065,#4C1D95 55%,#0D9488);color:#fff;border:none;box-shadow:var(--shadow-lg)">
      <div style="position:absolute;right:-16px;top:-20px;width:120px;height:120px;opacity:.12;color:#fff">${ICON.paw}</div>
      <div style="position:relative">
        <div style="font-size:12px;font-weight:800;opacity:.9;text-transform:uppercase;letter-spacing:.6px">${greeting()}, ${esc(firstName(u.name))}</div>
        <div style="font-size:12.5px;opacity:.8;margin-top:1px">${new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</div>
        <div style="font-size:15.5px;font-weight:700;line-height:1.45;margin-top:10px">${esc(barnBriefing(ctx))}</div>
      </div>
    </div>`));
  // MOMENTUM TILES (animated)
  wrap.append(htmlToFrag(`<div class="grid g4" style="margin-top:12px">
    <button class="stat" style="text-align:left" onclick="go('/animals')"><div class="k">Active</div><div class="v tnum" data-count="${active.length}">0</div><div class="sub">animals</div></button>
    <div class="stat" style="flex-direction:row;align-items:center;gap:8px;display:flex"><div style="flex:none">${ringSVG(active.length?weighedThisWeek/active.length*100:0,'var(--teal-3)',weighedThisWeek+'/'+active.length,'weighed')}</div><div style="min-width:0"><div class="k">This week</div><div class="sub" style="margin-top:3px">${needWeigh.length} to go</div></div></div>
    <div class="stat"><div class="k">Streak</div><div class="v tnum" style="color:#FB923C" data-count="${streak}">0</div><div class="sub">${streak===1?'day':'days'} 🔥</div></div>
    <div class="stat"><div class="k">Herd ADG</div><div class="v tnum" style="font-size:22px">${herdAdg??'—'}${herdAdg!=null?'<small> lb/d</small>':''}</div><div class="sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${gainer?'🚀 '+esc(gainer.a.name)+' +'+gainer.gain:'lifetime avg'}</div></div>
  </div>`));
  // TODAY'S FOCUS — the one next best action
  wrap.append((()=>{ const c=el('div','card pad'); c.style.cssText='margin-top:12px;display:flex;align-items:center;gap:13px;border-left:4px solid '+focus.color+(focus.go||focus.fn?';cursor:pointer':'');
    c.innerHTML=`<div style="flex:none;width:44px;height:44px;border-radius:13px;background:${focus.color}22;color:${focus.color};display:flex;align-items:center;justify-content:center"><span style="width:24px;height:24px">${focus.icon}</span></div>
      <div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:var(--muted)">Today's focus</div><div style="font-size:16px;font-weight:800;margin-top:1px">${esc(focus.title)}</div><div style="font-size:12.5px;color:var(--muted)">${esc(focus.sub)}</div></div>
      ${focus.go||focus.fn?`<span style="color:var(--muted);flex:none">${ICON.chev}</span>`:''}`;
    if(focus.go)c.onclick=()=>go(focus.go); else if(focus.fn)c.onclick=focus.fn; return c; })());
  // species strip
  if(shownSp.length) wrap.append(htmlToFrag(`<div class="grid g4" style="margin-top:12px">${shownSp.map(s=>`<button class="stat" style="text-align:left" onclick="go('/animals?species=${s.id}')"><div style="display:flex;align-items:center;gap:7px;color:var(--purple-3)"><span style="width:18px;height:18px">${spIcon(s.id)}</span><span class="k" style="color:var(--muted)">${esc(s.name)}</span></div><div class="v tnum" style="font-size:22px">${bySpecies[s.id]}</div></button>`).join('')}</div>`));

  // Next show countdown
  if(nextShow){ const dleft=daysBetween(todayISO(),nextShow.start);
    wrap.append(htmlToFrag(`<div class="card pad" style="margin-top:14px;background:linear-gradient(135deg,var(--purple),var(--purple-3));color:#fff;border:none;box-shadow:var(--shadow-lg)" onclick="go('/show/${nextShow.id}')">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="text-align:center;flex:none;background:rgba(255,255,255,.16);border-radius:14px;padding:10px 14px"><div style="font-size:30px;font-weight:800;line-height:1" class="tnum">${dleft}</div><div style="font-size:10px;font-weight:700;opacity:.85">DAYS</div></div>
        <div style="flex:1"><div style="font-size:11px;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:.5px">Next show</div><div style="font-size:17px;font-weight:800;margin-top:2px">${esc(nextShow.name)}</div><div style="font-size:12.5px;opacity:.85">${fmtDate(nextShow.start)} · ${esc(nextShow.location||nextShow.city||'')}</div></div>
        <span style="color:#fff">${ICON.chev}</span></div></div>`));
  }

  // Active layover banner
  if(lay){ const todayCare=careForLayover(lay.id).filter(c=>c.date===todayISO()); const done=todayCare.filter(c=>c.done).length; const dayN=layoverDays(lay).indexOf(todayISO())+1;
    wrap.append(htmlToFrag(`<div class="card pad" style="margin-top:14px;background:linear-gradient(135deg,#0EA5B7,var(--teal-3));color:#fff;border:none;box-shadow:var(--shadow-lg)" onclick="go('/layover/${lay.id}')">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="flex:none;color:#fff;width:34px;height:34px">${ICON.layover}</div>
        <div style="flex:1"><div style="font-size:11px;font-weight:700;opacity:.85;text-transform:uppercase;letter-spacing:.5px">Layover in progress${dayN>0?' · Day '+dayN:''}</div><div style="font-size:16px;font-weight:800;margin-top:2px">${esc(lay.name)}</div><div style="font-size:12.5px;opacity:.9">${done}/${todayCare.length} care items done today${lay.breeder?' · '+esc(lay.breeder):''}</div></div>
        <span style="color:#fff">${ICON.chev}</span></div></div>`));
  }

  // "Star of the day" — a rotating animal spotlight with its photo
  const aotd=animalOfDay(active);
  if(aotd){ const st=animalStats(aotd); const cs=coachEligible(aotd)?coachStatus(aotd):null;
    const gBadge=(gainer&&gainer.a.id===aotd.id)?`🚀 +${gainer.gain} lb this week`:null;
    const stitle=htmlToFrag(`<div class="section-title">Star of the day ${active.length>1?`<button class="more" data-shuffle>${ICON.restore} Shuffle</button>`:''}</div>`);
    wrap.append(stitle);
    if(active.length>1){ const sb=$('[data-shuffle]',wrap); if(sb)sb.onclick=()=>{ const pool=active.filter(a=>a.id!==aotd.id); starOverride=pool[Math.floor(Math.random()*pool.length)].id; render(); }; }
    const card=el('div','card'); card.style.cssText='overflow:hidden;cursor:pointer;padding:0';
    card.innerHTML=`<div data-cover style="height:154px;background:linear-gradient(135deg,#3B1B6E,#0D9488);background-size:cover;background-position:center;position:relative">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.04),rgba(10,13,19,.78))"></div>
        <div style="position:absolute;left:14px;bottom:11px;right:14px;color:#fff">
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:5px">${cs?`<span class="pill" style="background:${cs.color}cc;color:#fff;font-size:10px">${cs.label}</span>`:''}${gBadge?`<span class="pill" style="background:rgba(255,255,255,.22);color:#fff;font-size:10px">${gBadge}</span>`:''}</div>
          <div style="font-size:23px;font-weight:800;line-height:1.05">${esc(aotd.name)}${aotd.barnName?` <span style="font-weight:600;opacity:.8;font-size:15px">“${esc(aotd.barnName)}”</span>`:''}</div>
          <div style="font-size:12.5px;opacity:.9">${esc(speciesName(aotd.species))}${aotd.breed?' · '+esc(aotd.breed):''}${aotd.sex?' · '+esc(aotd.sex):''}</div>
        </div></div>
      <div class="pad" style="display:flex;justify-content:space-around;text-align:center">
        <div><div style="font-size:10.5px;color:var(--muted);font-weight:800;letter-spacing:.4px">WEIGHT</div><div style="font-size:18px;font-weight:800" class="tnum">${st.curW??'—'}${st.curW!=null?'<small style="color:var(--muted);font-weight:700"> lb</small>':''}</div></div>
        <div><div style="font-size:10.5px;color:var(--muted);font-weight:800;letter-spacing:.4px">ADG</div><div style="font-size:18px;font-weight:800;color:var(--purple-3)" class="tnum">${st.adgLife??'—'}</div></div>
        <div><div style="font-size:10.5px;color:var(--muted);font-weight:800;letter-spacing:.4px">TOTAL GAIN</div><div style="font-size:18px;font-weight:800;color:var(--good)" class="tnum">${st.gainTotal!=null?(st.gainTotal>=0?'+':'')+st.gainTotal:'—'}</div></div>
      </div>`;
    card.onclick=()=>go('/animal/'+aotd.id);
    const mid=aotd.profileMediaId||(mediaFor(aotd.id)[0]||{}).blobId;
    if(mid) Media.url(mid).then(u=>{ if(u){ const cov=$('[data-cover]',card); if(cov)cov.style.backgroundImage=`url(${u})`; } });
    wrap.append(card);
  }

  // Game Plan summary
  const gp=coachSummary();
  if(gp.total){
    wrap.append(htmlToFrag(`<div class="section-title">Game Plan <button class="more" onclick="go('/coach')">Open</button></div>`));
    wrap.append(htmlToFrag(`<div class="card pad" style="cursor:pointer" onclick="go('/coach')"><div style="display:flex;text-align:center">
      <div style="flex:1"><div style="font-size:22px;font-weight:800;color:var(--good)" class="tnum">${gp.ontrack}</div><div style="font-size:11px;color:var(--muted);font-weight:700">On track</div></div>
      <div style="flex:1"><div style="font-size:22px;font-weight:800;color:var(--bad)" class="tnum">${gp.under}</div><div style="font-size:11px;color:var(--muted);font-weight:700">Behind</div></div>
      <div style="flex:1"><div style="font-size:22px;font-weight:800;color:var(--warn)" class="tnum">${gp.over}</div><div style="font-size:11px;color:var(--muted);font-weight:700">Heavy</div></div>
      <div style="flex:1"><div style="font-size:22px;font-weight:800" class="tnum">${gp.total}</div><div style="font-size:11px;color:var(--muted);font-weight:700">With a goal</div></div>
    </div></div>`));
  }

  // Today in the barn
  wrap.append(htmlToFrag(`<div class="section-title">Today in the barn <button class="more" onclick="go('/calendar')">Calendar</button></div>`));
  if(soonEvents.length){
    const el2=el('div','list'); el2.style.marginBottom='10px';
    soonEvents.forEach(ev=>{ const cat=eventCat(ev.category); const li=el('div','li');
      li.innerHTML=`<div class="thumb" style="color:${cat.color}">${ICON[cat.icon]}</div>
        <div class="main"><div class="t1">${esc(ev.title)}</div><div class="t2">${daysBetween(todayISO(),ev.date)===0?'Today':daysBetween(todayISO(),ev.date)===1?'Tomorrow':fmtShort(ev.date)}${ev.allDay?'':ev.startTime?' · '+timeLabel(ev.startTime):''}${ev.location?' · '+esc(ev.location):''}</div></div>
        <button class="iconbtn" style="background:var(--line-2);color:var(--purple-3)" data-ics title="Add to Calendar">${ICON.calPlus}</button>`;
      $('[data-ics]',li).onclick=(e)=>{e.stopPropagation(); addToCalendar(ev);};
      li.onclick=()=>openEventSheet(ev.id); el2.append(li); });
    wrap.append(el2);
  }
  if(todayTasks.length){
    const list=el('div','list');
    todayTasks.forEach(({t,date})=>{
      const ids=taskAnimalIds(t).filter(id=>getAnimal(id)); const multi=ids.length>=2;
      const dn=multi?taskProgress(t,date).filter(id=>ids.includes(id)).length:0;
      const who=multi?`${dn}/${ids.length} animals`:animalsLabel(ids);
      const li=el('div','li');
      li.innerHTML=`<button class="thumb" style="background:var(--line-2);color:var(--purple)" data-done>${t.priority==='High'?ICON.flag:ICON.clock}</button>
        <div class="main"><div class="t1">${esc(t.title)}</div><div class="t2">${who?esc(who)+' · ':''}${date<todayISO()?'<span style="color:var(--bad)">Overdue</span>':'Due today'}${t.recur?' · repeats '+t.recur:''}</div>${multi?`<div style="height:5px;background:var(--line-2);border-radius:4px;overflow:hidden;margin-top:6px;max-width:180px"><div style="height:100%;width:${Math.round(dn/ids.length*100)}%;background:var(--purple-3);border-radius:4px"></div></div>`:''}</div>
        ${multi?`<span style="color:var(--muted)">${ICON.chev}</span>`:''}`;
      $('[data-done]',li).onclick=(e)=>{e.stopPropagation(); setTaskDone(t,date,true); logAct('task','Completed: '+t.title,ids[0]||null); save(); render(); };
      li.onclick=()=>{ if(multi)openTaskProgressSheet(t.id,date); else if(ids.length===1)go('/animal/'+ids[0]); else openTaskSheet(t.id); };
      list.append(li);
    });
    wrap.append(list);
  } else if(!soonEvents.length) wrap.append(htmlToFrag(emptyState(ICON.check,'All caught up','No tasks due today. Add one from the Calendar.')));

  // Alerts
  if(alertAnimals.length){
    wrap.append(htmlToFrag(`<div class="section-title">Attention needed</div>`));
    const list=el('div','list');
    alertAnimals.slice(0,5).forEach(a=>{ const al=activeWeightAlerts(a).find(x=>x.k==='bad')||activeWeightAlerts(a).find(x=>x.k==='warn');
      const li=animalRow(a, `<span class="pill ${al.k==='bad'?'bad':'warn'}">${esc(al.t)}</span>`); list.append(li); });
    wrap.append(list);
  }

  // Need a weight
  if(needWeigh.length){
    wrap.append(htmlToFrag(`<div class="section-title">Needs a weekly weight <button class="more" onclick="go('/animals?filter=needweight')">See all</button></div>`));
    const list=el('div','list');
    needWeigh.slice(0,4).forEach(a=>{ const ws=weightsFor(a.id); const since=ws.length?daysBetween(ws[ws.length-1].date,todayISO()):null;
      const li=animalRow(a, `<button class="btn sm teal" data-weigh>Weigh</button>`, since!=null?`${since}d since last`:'never weighed');
      $('[data-weigh]',li).onclick=(e)=>{e.stopPropagation(); openWeightSheet(a.id);}; list.append(li); });
    wrap.append(list);
  }

  // Recent media
  if(recentMedia.length){
    wrap.append(htmlToFrag(`<div class="section-title">Recent progress media <button class="more" onclick="go('/media')">Gallery</button></div>`));
    const g=el('div','gallery'); wrap.append(g);
    recentMedia.forEach(m=>{ const cell=el('div','g'); const a=getAnimal(m.animalId);
      cell.innerHTML=`<div class="tag">${esc(a?a.name:'')}</div>`+(m.kind==='video'?`<div class="play">${ICON.video}</div>`:'');
      Media.url(m.blobId).then(u=>{ if(u){ if(m.kind==='video'){ const vd=el('video'); vd.src=u; vd.muted=true; cell.prepend(vd);} else { const im=el('img'); im.src=u; cell.prepend(im);} } });
      cell.onclick=()=>go('/animal/'+m.animalId+'/media'); g.append(cell); });
  }

  // Recent feed changes
  if(recentFeed.length){
    wrap.append(htmlToFrag(`<div class="section-title">Recent feed changes</div>`));
    const list=el('div','list');
    recentFeed.forEach(f=>{ const a=getAnimal(f.animalId); if(!a)return; const li=el('div','li');
      li.innerHTML=`<div class="thumb" style="color:var(--teal-3)">${ICON.feed}</div><div class="main"><div class="t1">${esc(a.name)} → ${esc(f.name)}</div><div class="t2">${esc(f.objective||'')} · ${relDays(f.startDate)}</div></div>${ICON.chev}`;
      li.onclick=()=>go('/animal/'+a.id+'/feed'); list.append(li); });
    wrap.append(list);
  }

  // Team activity
  wrap.append(htmlToFrag(`<div class="section-title">Team activity <button class="more" onclick="go('/more')">More</button></div>`));
  wrap.append(activityList(DB.activity.slice(0,5)));
  wrap.append(htmlToFrag(`<div style="height:8px"></div>`));
  v.append(wrap);
  $$('[data-count]',v).forEach(n=>countUp(n, +n.dataset.count));  // animate the momentum numbers
  setTimeout(checkStreakMilestone, 400);  // celebrate a streak milestone if one was just reached
});

function emptyState(icon,h,p){ return `<div class="card"><div class="empty">${icon}<div class="h">${esc(h)}</div><div class="p">${esc(p)}</div></div></div>`; }
function animalRow(a, right, sub){
  const st=animalStats(a);
  const ws=weightsFor(a.id);
  const spark = ws.length>=3 ? sparkline(ws.slice(-8).map(w=>+w.weight), (st.adgLife==null||st.adgLife>=0)?'var(--teal-3)':'var(--bad)') : '';
  const li=el('div','li');
  li.innerHTML=`<div class="thumb" data-thumb>${esc(initials(a.name))}</div>
    <div class="main"><div class="t1">${esc(a.name)}</div><div class="t2">${sub!=null?esc(sub):esc(speciesName(a.species)+' · '+a.breed+(st.curW!=null?' · '+st.curW+' lb':''))}</div>${spark?`<div style="margin-top:5px;display:flex;align-items:center;gap:7px">${spark}${st.adgLife!=null?`<span style="font-size:11px;font-weight:800;color:${st.adgLife>=0?'var(--good)':'var(--bad)'}">${st.adgLife>=0?'+':''}${st.adgLife}<span style="color:var(--muted);font-weight:600"> lb/d</span></span>`:''}</div>`:''}</div>
    <div class="r">${right||''}</div>`;
  if(a.profileMediaId) Media.url(a.profileMediaId).then(u=>{ if(u){ const t=$('[data-thumb]',li); t.style.backgroundImage=`url(${u})`; t.style.backgroundSize='cover'; t.textContent=''; }});
  li.onclick=()=>go('/animal/'+a.id);
  return li;
}
function activityList(items){
  if(!items.length) return htmlToFrag(emptyState(ICON.clock,'No activity yet','Changes your team makes will appear here.'));
  const list=el('div','list');
  items.forEach(ac=>{ const li=el('div','li'); const a=ac.animalId?getAnimal(ac.animalId):null;
    li.innerHTML=`<div class="thumb" style="background:var(--line-2);color:var(--purple);font-size:12px">${esc(initials(ac.userName||'?'))}</div>
      <div class="main"><div class="t1" style="font-weight:600;font-size:13.5px"><b>${esc(ac.userName||'Someone')}</b> ${esc(actVerb(ac))}</div><div class="t2">${a?esc(a.name)+' · ':''}${relDays(ac.ts.slice(0,10))} · ${new Date(ac.ts).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</div></div>`;
    if(a)li.onclick=()=>go('/animal/'+a.id); list.append(li); });
  return list;
}
function actVerb(ac){ return esc(ac.detail||ac.action); }

/* ===================================================================
   ANIMALS LIST
   =================================================================== */
route('animals', (parts,q)=>{
  const v=setView('','animals');
  const state={ species:q.get('species')||'', status:q.get('status')||'', sex:q.get('sex')||'', helper:q.get('helper')||'',
    filter:q.get('filter')||'', q:q.get('q')||'', archived:false, sort:'name' };
  const wrap=el('div'); v.append(wrap);
  const draw=()=>{
    let list=DB.animals.filter(a=>!!a.archived===state.archived);
    if(state.species) list=list.filter(a=>a.species===state.species);
    if(state.status) list=list.filter(a=>a.status===state.status);
    if(state.sex) list=list.filter(a=>a.sex===state.sex);
    if(state.filter==='needweight') list=list.filter(a=>{const ws=weightsFor(a.id);return !ws.length||daysBetween(ws[ws.length-1].date,todayISO())>=7;});
    if(state.filter==='nomedia') list=list.filter(a=>mediaFor(a.id).length===0);
    if(state.filter==='market') list=list.filter(a=>a.marketBreeding==='Market');
    if(state.helper) list=list.filter(a=>(a.helperIds||[]).includes(state.helper));
    if(state.q){ const s=state.q.toLowerCase(); list=list.filter(a=>[a.name,a.barnName,a.earTag,a.earNotch,a.registration,a.breeder,a.sire,a.dam,a.breed].some(f=>(f||'').toLowerCase().includes(s))); }
    list.sort((a,b)=> state.sort==='weight'? ((animalStats(b).curW||0)-(animalStats(a).curW||0)) : a.name.localeCompare(b.name));

    wrap.innerHTML=`
      ${pageHeader('Animals', null, `<button class="btn primary sm" id="addAn">${ICON.plus} Add</button>`)}
      <div style="position:relative;margin-bottom:10px"><span style="position:absolute;left:12px;top:13px;color:var(--muted)">${ICON.search}</span>
        <input class="control" id="anSearch" placeholder="Search name, tag, breeder…" value="${esc(state.q)}" style="padding-left:40px"></div>
      <div class="chips">
        <button class="chip ${!state.species&&!state.status&&!state.filter?'active':''}" data-clear>All</button>
        ${DB.species.filter(s=>s.active).map(s=>`<button class="chip ${state.species===s.id?'active':''}" data-species="${s.id}"><span style="width:16px;height:16px">${spIcon(s.id)}</span>${esc(s.name)}</button>`).join('')}
        <button class="chip ${state.filter==='needweight'?'active':''}" data-filter="needweight">Needs weight</button>
        <button class="chip ${state.filter==='nomedia'?'active':''}" data-filter="nomedia">No media</button>
        <button class="chip" id="moreFilters">${ICON.filter} Filters</button>
      </div>
      ${(DB.helpers||[]).length?`<div class="chips"><span style="align-self:center;font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;padding-right:2px">Helper</span>${DB.helpers.map(h=>`<button class="chip ${state.helper===h.id?'active':''}" data-helper="${h.id}">${ICON.team}${esc(h.name)}</button>`).join('')}<button class="chip" id="manageHelpers">${ICON.settings}</button></div>`:''}
      ${DB.savedViews.length?`<div class="chips">${DB.savedViews.map((sv,i)=>`<button class="chip" data-view="${i}">${ICON.star}${esc(sv.name)}</button>`).join('')}</div>`:''}
      <div style="display:flex;justify-content:space-between;align-items:center;margin:6px 2px 8px">
        <div style="font-size:12.5px;color:var(--muted);font-weight:700">${list.length} ${state.archived?'archived':'animal'}${list.length===1?'':'s'}</div>
        <div style="display:flex;gap:8px">
          <button class="chip sm" id="saveView" style="padding:5px 11px;font-size:12px">${ICON.star} Save view</button>
          <button class="chip sm" id="toggleArch" style="padding:5px 11px;font-size:12px">${state.archived?'Show active':'Archive'}</button>
        </div>
      </div>
      <div id="anList"></div>`;
    const lc=$('#anList',wrap);
    if(!list.length){ lc.innerHTML=emptyState(ICON.animals, state.q?'No matches':'No animals yet', state.q?'Try a different search.':'Add your first animal to start tracking weights, feed and progress.'); }
    else { const L=el('div','list'); list.forEach(a=>{ const st=animalStats(a); const badge=`<span class="pill ${STATUS_COLOR[a.status]||'gray'}" style="font-size:10px">${esc(a.status)}</span>`;
      const li=animalRow(a, `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">${st.curW!=null?`<div style="font-weight:800" class="tnum">${st.curW}<small style="font-size:11px;color:var(--muted)"> lb</small></div>`:''}${badge}</div>`);
      L.append(li); }); lc.append(L); }

    $('#addAn',wrap).onclick=()=>openAnimalForm();
    const s=$('#anSearch',wrap); s.oninput=()=>{ state.q=s.value; const pos=s.selectionStart; draw(); const ns=$('#anSearch',wrap); ns.focus(); ns.setSelectionRange(pos,pos); };
    $('[data-clear]',wrap)&&($('[data-clear]',wrap).onclick=()=>{state.species='';state.status='';state.filter='';state.sex='';state.helper='';draw();});
    $$('[data-species]',wrap).forEach(b=>b.onclick=()=>{state.species=state.species===b.dataset.species?'':b.dataset.species;draw();});
    $$('[data-filter]',wrap).forEach(b=>b.onclick=()=>{state.filter=state.filter===b.dataset.filter?'':b.dataset.filter;draw();});
    $$('[data-helper]',wrap).forEach(b=>b.onclick=()=>{state.helper=state.helper===b.dataset.helper?'':b.dataset.helper;draw();});
    if($('#manageHelpers',wrap))$('#manageHelpers',wrap).onclick=()=>go('/helpers');
    $('#toggleArch',wrap).onclick=()=>{state.archived=!state.archived;draw();};
    $('#moreFilters',wrap).onclick=()=>openFilterSheet(state,draw);
    $('#saveView',wrap).onclick=()=>{ const nm=prompt('Name this saved view'); if(nm){ DB.savedViews.push({name:nm,state:{...state}}); save(); toast('View saved','good'); draw(); } };
    $$('[data-view]',wrap).forEach(b=>b.onclick=()=>{ Object.assign(state, DB.savedViews[+b.dataset.view].state); draw(); });
  };
  draw();
});
function openFilterSheet(state,draw){
  const body=el('div');
  body.innerHTML=`
    <div class="field"><label>Status</label><select class="control" id="fStatus"><option value="">Any</option>${STATUSES.map(s=>`<option ${state.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
    <div class="field"><label>Sex</label><select class="control" id="fSex"><option value="">Any</option>${['Barrow','Gilt','Boar','Sow','Wether','Ewe','Ram','Doe','Buck','Steer','Heifer','Bull','Cow'].map(s=>`<option ${state.sex===s?'selected':''}>${s}</option>`).join('')}</select></div>
    <div class="field"><label>Type</label><div class="seg" id="fMB"><button data-v="" class="${!state.filter?'on':''}">All</button><button data-v="market" class="${state.filter==='market'?'on':''}">Market</button></div></div>`;
  const foot=el('div'); foot.innerHTML=`<button class="btn ghost" data-reset>Reset</button><button class="btn primary" data-apply>Apply</button>`;
  const sh=openSheet({title:'Filters',body,foot});
  let mb=state.filter==='market'?'market':'';
  $$('#fMB button',sh).forEach(b=>b.onclick=()=>{mb=b.dataset.v;$$('#fMB button',sh).forEach(x=>x.classList.toggle('on',x===b));});
  $('[data-reset]',sh).onclick=()=>{state.status='';state.sex='';state.filter='';closeSheet();draw();};
  $('[data-apply]',sh).onclick=()=>{state.status=$('#fStatus',sh).value;state.sex=$('#fSex',sh).value;if(mb==='market')state.filter='market';else if(state.filter==='market')state.filter='';closeSheet();draw();};
}

/* ---- Add / edit animal ---- */
function sexOptions(sp){ return {swine:['Barrow','Gilt','Boar','Sow'],sheep:['Wether','Ewe','Ram'],goat:['Wether','Doe','Buck'],cattle:['Steer','Heifer','Bull','Cow']}[sp]||['Male','Female']; }
function openAnimalForm(id){
  if(!can(id?'edit':'addAnimal')){ toast('Your role can’t do that','bad'); return; }
  const a = id?{...getAnimal(id)}:{ species:'swine', status:'Prospect', sex:'', season:String(new Date().getFullYear()), marketBreeding:'Market' };
  a.helperIds = [...(a.helperIds||[])];
  const body=el('div');
  const idFieldDefs={ earTag:'Ear tag', earNotch:'Ear notch', scrapieTag:'Scrapie tag', registration:'Registration #', tattoo:'Tattoo', brand:'Brand', rfid:'RFID' };
  const render=()=>{
    const sp=DB.species.find(s=>s.id===a.species)||DB.species[0];
    body.innerHTML=`
      <div class="field"><label>Species</label><select class="control" id="afSp">${DB.species.slice().sort((x,y)=>(y.active?1:0)-(x.active?1:0)).map(s=>`<option value="${s.id}" ${a.species===s.id?'selected':''}>${esc(s.name)}${s.active?'':' (add to show)'}</option>`).join('')}</select></div>
      <div class="field-row"><div class="field" style="flex:1"><label>Name *</label><input class="control" id="afName" value="${esc(a.name||'')}" placeholder="Batman"></div>
        <div class="field" style="flex:1"><label>Barn name</label><input class="control" id="afBarn" value="${esc(a.barnName||'')}" placeholder="Bats"></div></div>
      <div class="field-row"><div class="field" style="flex:1"><label>Breed</label><select class="control" id="afBreed">${breedsFor(a.species).map(b=>`<option ${a.breed===b.name?'selected':''}>${esc(b.name)}</option>`).join('')}</select></div>
        <div class="field" style="flex:1"><label>Sex</label><select class="control" id="afSex"><option value=""></option>${sexOptions(a.species).map(s=>`<option ${a.sex===s?'selected':''}>${s}</option>`).join('')}</select></div></div>
      <div class="field-row"><div class="field" style="flex:1"><label>Status</label><select class="control" id="afStatus">${STATUSES.map(s=>`<option ${a.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="field" style="flex:1"><label>Market / Breeding</label><select class="control" id="afMB"><option ${a.marketBreeding==='Market'?'selected':''}>Market</option><option ${a.marketBreeding==='Breeding'?'selected':''}>Breeding</option></select></div></div>
      <div class="field-row"><div class="field" style="flex:1"><label>Acquired date</label><input class="control" type="date" id="afAcq" value="${a.acquiredDate||''}"></div>
        <div class="field" style="flex:1"><label>Season</label><input class="control" id="afSeason" value="${esc(a.season||'')}" placeholder="2026"></div></div>
      <div class="field-row"><div class="field" style="flex:1"><label>Starting weight (lb)</label><input class="control" type="number" inputmode="decimal" id="afSW" value="${a.startWeight??''}"></div>
        <div class="field" style="flex:1"><label>Start weight date</label><input class="control" type="date" id="afSWD" value="${a.startWeightDate||a.acquiredDate||''}"></div></div>
      <div class="divider"></div>
      <div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Identification · ${esc(sp.name)}</div>
      <div class="field-row" style="flex-wrap:wrap">${sp.idFields.map(f=>`<div class="field" style="flex:1;min-width:44%"><label>${idFieldDefs[f]||f}</label><input class="control" id="af_${f}" value="${esc(a[f]||'')}"></div>`).join('')}</div>
      <div class="divider"></div>
      <div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Show target & lineage</div>
      <div class="field"><label>Target show</label><input class="control" id="afTShow" value="${esc(a.targetShow||'')}"></div>
      <div class="field-row"><div class="field" style="flex:1"><label>Target date</label><input class="control" type="date" id="afTDate" value="${a.targetDate||''}"></div>
        <div class="field" style="flex:1"><label>Target weight</label><input class="control" type="number" id="afTW" value="${a.targetWeight??''}"></div></div>
      <div class="field-row"><div class="field" style="flex:1"><label>Breeder</label><input class="control" id="afBreeder" value="${esc(a.breeder||'')}"></div>
        <div class="field" style="flex:1"><label>Division</label><input class="control" id="afDiv" value="${esc(a.division||'')}"></div></div>
      <div class="field-row"><div class="field" style="flex:1"><label>Sire</label><input class="control" id="afSire" value="${esc(a.sire||'')}"></div>
        <div class="field" style="flex:1"><label>Dam</label><input class="control" id="afDam" value="${esc(a.dam||'')}"></div></div>
      <div class="field-row"><div class="field" style="flex:1"><label>Pen / location</label><input class="control" id="afPen" value="${esc(a.penLocation||'')}"></div>
        <div class="field" style="flex:1"><label>Assigned advisor</label><select class="control" id="afAdv"><option value="">None</option>${DB.users.filter(u=>u.role==='Advisor').map(u=>`<option value="${u.id}" ${a.advisorId===u.id?'selected':''}>${esc(u.name)}</option>`).join('')}</select></div></div>
      <div class="field"><label>Helpers <span style="font-weight:600;color:var(--muted)">· who helps feed / guide this animal</span></label><div id="afHelpers"></div></div>
      <div class="field"><label>Notes</label><textarea class="control" id="afNotes">${esc(a.notes||'')}</textarea></div>`;
    $('#afSp',body).onchange=()=>{ a.species=$('#afSp',body).value; a.breed=breedsFor(a.species)[0]?.name; a.sex=''; collect(); render(); };
    drawHelpers();
  };
  const drawHelpers=()=>{ const box=$('#afHelpers',body); if(!box)return;
    box.innerHTML=`<div class="chips" style="flex-wrap:wrap;white-space:normal">${(DB.helpers||[]).map(h=>`<button type="button" class="chip ${a.helperIds.includes(h.id)?'active':''}" data-h="${h.id}">${esc(h.name)}</button>`).join('')}<button type="button" class="chip" data-hadd>${ICON.plus} Add helper</button></div>`;
    $$('[data-h]',box).forEach(b=>b.onclick=()=>{ const hid=b.dataset.h; if(a.helperIds.includes(hid))a.helperIds=a.helperIds.filter(x=>x!==hid); else a.helperIds.push(hid); drawHelpers(); });
    $('[data-hadd]',box).onclick=()=>{ const nm=prompt('Helper name (e.g. Blake Goss)'); if(nm&&nm.trim()){ const h=stamp({id:uid('help'),name:nm.trim()}); DB.helpers.push(h); a.helperIds.push(h.id); save(); drawHelpers(); } };
  };
  const collect=()=>{ const g=id=>$('#'+id,body); a.name=g('afName').value.trim(); a.barnName=g('afBarn').value.trim(); a.breed=g('afBreed').value; a.sex=g('afSex').value; a.status=g('afStatus').value; a.marketBreeding=g('afMB').value; a.acquiredDate=g('afAcq').value; a.season=g('afSeason').value.trim(); a.startWeight=g('afSW').value===''?null:+g('afSW').value; a.startWeightDate=g('afSWD').value; a.targetShow=g('afTShow').value.trim(); a.targetDate=g('afTDate').value; a.targetWeight=g('afTW').value===''?null:+g('afTW').value; a.breeder=g('afBreeder').value.trim(); a.division=g('afDiv').value.trim(); a.sire=g('afSire').value.trim(); a.dam=g('afDam').value.trim(); a.penLocation=g('afPen').value.trim(); a.advisorId=g('afAdv').value||null; a.notes=g('afNotes').value; const sp=DB.species.find(s=>s.id===a.species); sp.idFields.forEach(f=>{ const e=$('#af_'+f,body); if(e)a[f]=e.value.trim(); }); };
  render();
  const foot=el('div'); foot.innerHTML=`<button class="btn ghost" data-cancel>Cancel</button><button class="btn primary" data-save>${id?'Save changes':'Add animal'}</button>`;
  const sh=openSheet({title:id?'Edit animal':'New animal', body, foot});
  $('[data-cancel]',sh).onclick=()=>closeSheet();
  $('[data-save]',sh).onclick=()=>{ collect(); if(!a.name){toast('Name is required','bad');return;}
    const sp=DB.species.find(s=>s.id===a.species); if(sp && !sp.active){ sp.active=true; } // adding an animal turns its species on
    if(id){ const orig=getAnimal(id); Object.assign(orig,a); touch(orig); logAct('edit','Edited '+orig.name,id); }
    else { const rec=stamp({...a, archived:false}); DB.animals.push(rec);
      if(a.startWeight!=null) DB.weights.push(stamp({id:uid('w'),animalId:rec.id,weight:a.startWeight,date:a.startWeightDate||todayISO(),by:DB.currentUserId,scale:''}));
      logAct('add','Added '+rec.name,rec.id); id=rec.id; }
    save(); closeSheet(); toast('Saved','good'); if(location.hash.startsWith('#/animal/'))render(); else go('/animal/'+id);
  };
}

/* ===================================================================
   ANIMAL PROFILE (tabbed)
   =================================================================== */
const ANIMAL_TABS=[['overview','Overview'],['weight','Weight'],['feed','Feed'],['care','Care'],['media','Media'],['measurements','Measure'],['health','Health'],['meds','Meds'],['exercise','Exercise'],['shows','Shows'],['pedigree','Pedigree'],['expenses','Expenses'],['notes','Notes'],['activity','History']];
route('animal',(parts)=>{
  const id=parts[1]; const a=getAnimal(id);
  if(!a){ setView(emptyState(ICON.animals,'Animal not found','It may have been deleted.'),'animals'); return; }
  const tab=parts[2]||'overview';
  const st=animalStats(a);
  const v=setView('','animals');
  const hero=el('div');
  hero.innerHTML=`
    <div class="animal-hero">
      <div class="cover ph" data-cover>${a.profileMediaId?'':spIcon(a.species)}</div>
      <div class="ov"></div>
      <button class="iconbtn no-print" style="position:absolute;left:12px;top:calc(var(--safe-t) + 8px);z-index:3" onclick="history.length>1?history.back():go('/animals')">${ICON.back}</button>
      <button class="iconbtn no-print" style="position:absolute;right:12px;top:calc(var(--safe-t) + 8px);z-index:3" data-edit>${ICON.edit}</button>
      <button class="iconbtn no-print" style="position:absolute;right:58px;top:calc(var(--safe-t) + 8px);z-index:3" data-share>${ICON.share}</button>
      ${can('addRecord')?`<button class="no-print" data-setphoto style="position:absolute;right:12px;bottom:12px;z-index:3;display:inline-flex;align-items:center;gap:6px;background:rgba(0,0,0,.42);color:#fff;border:1px solid rgba(255,255,255,.35);padding:7px 12px;border-radius:999px;font-size:12.5px;font-weight:700;backdrop-filter:blur(4px)"><span style="width:16px;height:16px">${ICON.camera}</span>${a.profileMediaId?'Change photo':'Add photo'}</button>`:''}
      <div class="meta">
        <div style="display:flex;gap:8px;margin-bottom:6px"><span class="pill ${STATUS_COLOR[a.status]||'gray'}">${esc(a.status)}</span>${a.archived?'<span class="pill gray">Archived</span>':''}${a.demo?'<span class="pill" style="background:rgba(255,255,255,.2);color:#fff">Demo</span>':''}</div>
        <h2>${esc(a.name)}${a.barnName?` <span style="font-weight:600;opacity:.8;font-size:16px">“${esc(a.barnName)}”</span>`:''}</h2>
        <div class="msub">${esc(speciesName(a.species))} · ${esc(a.breed||'')} · ${esc(a.sex||'')}${a.earTag?' · Tag '+esc(a.earTag):''}</div>
      </div>
    </div>
    <div class="tabbar" id="tabbar">${ANIMAL_TABS.map(([k,l])=>`<button class="tab ${tab===k?'active':''}" data-tab="${k}">${esc(l)}</button>`).join('')}</div>
    <div id="tabBody" style="padding-top:14px"></div>`;
  v.append(hero);
  if(a.profileMediaId) Media.url(a.profileMediaId).then(u=>{ if(u){ const c=$('[data-cover]',hero); c.classList.remove('ph'); c.style.backgroundImage=`url(${u})`; c.innerHTML=''; }});
  $('[data-edit]',hero).onclick=()=>openAnimalForm(a.id);
  if($('[data-share]',hero)) $('[data-share]',hero).onclick=()=>openShareSheet(a.id);
  if($('[data-setphoto]',hero)) $('[data-setphoto]',hero).onclick=()=>uploadProfilePhoto(a.id);
  $$('[data-tab]',hero).forEach(b=>b.onclick=()=>{ go('/animal/'+id+'/'+b.dataset.tab); });
  // keep active tab visible
  const at=$('.tab.active',hero); if(at) at.scrollIntoView({inline:'center',block:'nearest'});
  const body=$('#tabBody',hero);
  ({overview:tabOverview,weight:tabWeight,feed:tabFeed,care:tabCare,media:tabMedia,measurements:tabMeasure,health:tabHealth,meds:tabMeds,exercise:tabExercise,shows:tabShows,pedigree:tabPedigree,expenses:tabExpenses,notes:tabNotes,activity:tabActivity}[tab]||tabOverview)(body,a);
});

/* ---------- OVERVIEW ---------- */
function tabOverview(box,a){
  const st=animalStats(a); const cf=currentFeed(a.id); const alerts=weightAlerts(a);
  const ws=weightsFor(a.id);
  const recentMedia=mediaFor(a.id)[0];
  box.innerHTML=`
    <div class="grid g2">
      <div class="stat"><div class="k">Current weight</div><div class="v tnum">${st.curW??'—'}${st.curW!=null?'<small> lb</small>':''}</div><div class="sub">${st.curD?relDays(st.curD):'no weights'}</div></div>
      <div class="stat"><div class="k">Avg daily gain</div><div class="v tnum">${st.adgLife??'—'}${st.adgLife!=null?'<small> lb/d</small>':''}</div><div class="sub">${st.adgPeriod!=null?'Recent '+st.adgPeriod+' lb/d':'lifetime'}</div></div>
      <div class="stat"><div class="k">Total gain</div><div class="v tnum">${st.gainTotal??'—'}${st.gainTotal!=null?'<small> lb</small>':''}</div><div class="sub">from ${st.startW??'—'} lb start</div></div>
      <div class="stat"><div class="k">Days owned</div><div class="v tnum">${st.daysOwned??'—'}</div><div class="sub">${a.targetDate?daysBetween(todayISO(),a.targetDate)+'d to target':''}</div></div>
    </div>
    ${a.targetWeight&&st.projWeight!=null?`<div class="card pad" style="margin-top:12px">
      <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:var(--muted);font-weight:700">Projected on ${fmtShort(a.targetDate)}</span><span style="font-weight:800" class="tnum">${st.projWeight} lb</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-top:6px"><span style="color:var(--muted);font-weight:700">Target</span><span style="font-weight:800" class="tnum">${a.targetWeight} lb</span></div>
      ${st.reqAdg!=null?`<div style="display:flex;justify-content:space-between;font-size:13px;margin-top:6px"><span style="color:var(--muted);font-weight:700">ADG needed to hit target</span><span class="pill ${st.reqAdg>(st.adgLife||0)*1.15?'warn':'good'}">${st.reqAdg} lb/d</span></div>`:''}</div>`:''}
    ${(()=>{ const cs=coachStatus(a); const eligible=coachEligible(a);
      return `<div class="section-title">Game plan <button class="more" data-gpopen>${eligible?'Open':'Set a goal'}</button></div>
      <div class="card pad" data-gpcard style="cursor:pointer">${eligible?`<div style="display:flex;gap:14px;align-items:center">
        <div style="flex:none">${ringSVG(cs.pct,cs.color,cs.pct!=null?Math.round(cs.pct)+'%':'—','to goal')}</div>
        <div style="flex:1"><span class="pill" style="background:${cs.color}22;color:${cs.color};font-size:10px">${cs.label}</span>
        <div style="font-size:12.5px;color:var(--muted);margin-top:5px">${cs.cur!=null?cs.cur+' lb':'—'} → ${cs.target} lb by ${fmtShort(cs.tdate)}${cs.daysLeft>=0?' · '+cs.daysLeft+'d':''}</div>
        <div style="font-size:12px;margin-top:4px">Need <b class="tnum">${cs.reqAdg!=null?cs.reqAdg:'—'}</b> lb/d · averaging <b class="tnum">${cs.actAdg!=null?cs.actAdg:'—'}</b> lb/d</div></div>
        <span style="color:var(--muted)">${ICON.chev}</span></div>`:`<div style="display:flex;align-items:center;gap:10px;color:var(--muted);font-size:13px"><span style="width:22px;height:22px;color:var(--purple-3)">${ICON.target}</span><span>Set a target weight and show date to coach ${esc(a.name)} to the ring.</span></div>`}</div>`; })()}
    <div class="section-title">Growth chart</div>
    <div class="card pad">${overviewChart(a)}
      <div class="chart-legend"><span><span class="leg-line" style="background:var(--purple-3)"></span>Actual</span>${a.targetWeight?'<span><span class="leg-line" style="background:var(--teal-3)"></span>Target</span>':''}${st.projWeight!=null?'<span><span class="leg-line" style="background:#C4B5FD;border-top:2px dashed #C4B5FD"></span>Projected</span>':''}</div></div>
    ${(()=>{ const activeAl=alerts.filter(al=>!al.acked); const ackedAl=alerts.filter(al=>al.acked);
      const rowActive=al=>`<div class="li" data-alert="${al.type}" style="cursor:pointer"><div class="dot" style="background:var(--${al.k==='bad'?'bad':al.k==='warn'?'warn':'info'})"></div><div class="main"><div class="t1" style="font-size:13.5px;font-weight:600">${esc(al.t)}</div>${al.k!=='info'?'<div class="t2">Tap to review or add a reason</div>':''}</div>${al.k!=='info'?ICON.chev:''}</div>`;
      const rowAcked=al=>{ const ack=alertAck(a.id,al.type); return `<div class="li" data-alert="${al.type}" style="cursor:pointer;opacity:.7"><div class="dot" style="background:var(--muted)"></div><div class="main"><div class="t1" style="font-size:13.5px;font-weight:600;text-decoration:line-through;text-decoration-color:var(--muted)">${esc(al.t)}</div><div class="t2" style="white-space:normal">${esc(ack&&ack.note||'Acknowledged')}</div></div>${ICON.chev}</div>`; };
      return (activeAl.length?`<div class="section-title">Alerts</div><div class="list">${activeAl.map(rowActive).join('')}</div>`:'')
        + (ackedAl.length?`<div class="section-title">Acknowledged <span style="color:var(--muted);font-weight:600;font-size:12px">· muted with a reason</span></div><div class="list">${ackedAl.map(rowAcked).join('')}</div>`:''); })()}
    <div class="section-title">Current feed</div>
    ${cf?feedCard(cf,false):emptyState(ICON.feed,'No feed program','Add the current ration to start tracking response.')}
    <div class="section-title">Details</div>
    <div class="card pad">${detailKV(a)}</div>
    <div class="section-title">Timeline</div>
    <div class="card pad" id="ovTimeline"></div>
    <div style="height:8px"></div>`;
  const cover=$('[data-cover]');
  renderTimeline($('#ovTimeline',box),a);
  if($('[data-gpopen]',box))$('[data-gpopen]',box).onclick=()=>openGamePlanSheet(a.id);
  if($('[data-gpcard]',box))$('[data-gpcard]',box).onclick=()=>openGamePlanSheet(a.id);
  $$('[data-alert]',box).forEach(li=>{ const type=li.dataset.alert; if(type==='noweight'||type==='nomedia')return; li.onclick=()=>openAlertReview(a.id,type); });
  $$('[data-fquick]',box).forEach(b=>{});
}
/* Review an alert and either mute it with a written reason, or un-mute it. */
function openAlertReview(animalId, type){
  const a=getAnimal(animalId); if(!a)return;
  const al=weightAlerts(a).find(x=>x.type===type);
  const ack=alertAck(animalId,type); const acked=isAcked(a,type);
  const st=animalStats(a); const ws=weightsFor(a.id);
  const last=ws[ws.length-1], prev=ws[ws.length-2];
  const delta=(last&&prev)?round(+last.weight - +prev.weight,1):null;
  const body=el('div');
  body.innerHTML=`
    <div class="card pad" style="margin-bottom:12px">
      <div style="font-weight:800;margin-bottom:3px">${esc(a.name)}</div>
      <div style="font-size:13.5px;font-weight:700;color:var(--${al?(al.k==='bad'?'bad':'warn'):'good'})">${al?esc(al.t):'This alert has since cleared.'}</div>
      <div style="font-size:12.5px;color:var(--muted);margin-top:6px">
        ${last?`Last weigh-in ${fmtShort(last.date)}: <b class="tnum" style="color:var(--ink)">${last.weight} lb</b>${delta!=null?` (${delta>=0?'+':''}${delta} vs prior)`:''}`:'No weigh-ins yet'}
        ${st.adgPeriod!=null?` · recent ADG <b class="tnum" style="color:var(--ink)">${st.adgPeriod} lb/d</b>`:''}</div>
    </div>
    <div class="help">${ICON.info}<span>If this change is expected — a known illness, a scale/fill difference, a bounce-back — write why and mute it. Your note stays on the record, and the alert re-checks automatically the next time you log a weight.</span></div>
    <div class="field"><label>Reason / justification</label><textarea class="control" id="arNote" placeholder="e.g. Ulcer that week — treated, back on gain now">${esc((ack&&ack.note)||'')}</textarea></div>
    ${ack&&acked?`<div style="font-size:11.5px;color:var(--muted)">Muted by ${esc(userName(ack.by)||'you')} · ${fmtShort((ack.at||'').slice(0,10))}</div>`:''}`;
  const foot=el('div');
  foot.innerHTML=`${acked?`<button class="btn" data-clear style="flex:1">Un-mute</button>`:`<button class="btn" data-weigh style="flex:1">${ICON.plus} Log weight</button>`}<button class="btn primary" data-save style="flex:1">${acked?'Update reason':'Acknowledge & mute'}</button>`;
  const sh=openSheet({title:'Review alert',body,foot});
  $('[data-save]',sh).onclick=()=>{ const note=$('#arNote',body).value.trim(); if(!note){ toast('Add a short reason to mute it','bad'); return; }
    setAlertAck(a,type,note); logAct('alert',`Acknowledged “${al?al.t:type}” — ${note}`,a.id); save(); closeSheet(); toast('Alert muted with your reason','good'); render(); };
  if($('[data-clear]',sh))$('[data-clear]',sh).onclick=()=>{ setAlertAck(a,type,null); logAct('alert',`Un-muted alert for ${a.name}`,a.id); save(); closeSheet(); toast('Alert un-muted','good'); render(); };
  if($('[data-weigh]',sh))$('[data-weigh]',sh).onclick=()=>{ closeSheet(); openWeightSheet(a.id); };
}
function overviewChart(a){
  const ws=weightsFor(a.id); if(ws.length<1) return '<div class="empty" style="padding:16px">No weights yet</div>';
  const series=[{name:'Actual',color:'var(--purple-3)',data:ws.map(w=>({x:w.date,y:+w.weight}))}];
  const markers=[];
  if(a.targetWeight&&a.targetDate){ series.push({name:'Target',color:'var(--teal-3)',width:2,data:[{x:ws[0].date,y:a.targetWeight},{x:a.targetDate,y:a.targetWeight}]});
    const st=animalStats(a); if(st.projWeight!=null) series.push({name:'Projected',color:'#C4B5FD',dashed:true,data:[{x:st.curD,y:st.curW},{x:a.targetDate,y:st.projWeight}]});
    markers.push({x:a.targetDate,color:'#0D9488',label:'Show'}); }
  feedFor(a.id).forEach(f=>markers.push({x:f.startDate,color:'#C4B5FD'}));
  return lineChart(series,{markers, extraY:a.targetWeight?[a.targetWeight]:[]});
}
function detailKV(a){
  const helpers=(a.helperIds||[]).map(helperName).filter(Boolean).join(', ');
  const rows=[['Breeder',a.breeder],['Helpers',helpers],['Sire',a.sire],['Dam',a.dam],['Division',a.division],['Season',a.season],['Ear tag',a.earTag],['Ear notch',a.earNotch],['Scrapie',a.scrapieTag],['Registration',a.registration],['Tattoo',a.tattoo],['Brand',a.brand],['RFID',a.rfid],['Pen',a.penLocation],['Advisor',a.advisorId?userName(a.advisorId):''],['Acquired',a.acquiredDate?fmtDate(a.acquiredDate):'']];
  const shown=rows.filter(r=>r[1]);
  if(!shown.length) return '<div style="color:var(--muted);font-size:13px">No additional details. Tap edit to add lineage and IDs.</div>';
  return shown.map(r=>`<div class="kv"><span class="k">${esc(r[0])}</span><span class="v">${esc(r[1])}</span></div>`).join('');
}
function renderTimeline(box,a){
  const ev=[];
  weightsFor(a.id).forEach(w=>ev.push({d:w.date,t:w.date,icon:ICON.weight,c:'var(--purple-3)',title:`Weighed ${w.weight} lb`,body:w.notes||''}));
  feedFor(a.id).forEach(f=>ev.push({d:f.startDate,icon:ICON.feed,c:'var(--teal-3)',title:`Feed: ${f.name}`,body:f.objective||''}));
  DB.health.filter(h=>h.animalId===a.id).forEach(h=>ev.push({d:h.date,icon:ICON.health,c:'var(--bad)',title:h.type,body:h.treatment||h.notes||''}));
  (DB.medLog||[]).filter(d=>d.animalId===a.id).forEach(d=>{ const e=doseWithdrawalEnds(d); ev.push({d:d.date,icon:ICON.pill,c:'var(--bad)',title:'Medication: '+d.name,body:(d.dose?d.dose+' · ':'')+(e?'withdrawal clears '+fmtShort(e):'no withdrawal')}); });
  DB.exercise.filter(x=>x.animalId===a.id).forEach(x=>ev.push({d:x.date,icon:ICON.run,c:'var(--warn)',title:`Exercise: ${x.type}`,body:x.duration?x.duration+' min':''}));
  mediaFor(a.id).forEach(m=>ev.push({d:m.captured||m.date,icon:m.kind==='video'?ICON.video:ICON.camera,c:'var(--info)',title:`${m.kind==='video'?'Video':'Photo'}: ${m.view||'Progress'}`,body:m.caption||''}));
  DB.entries.filter(e=>e.animalId===a.id).forEach(e=>{ const sh=DB.shows.find(s=>s.id===e.showId); ev.push({d:sh?sh.start:todayISO(),icon:ICON.shows,c:'var(--purple)',title:`Show: ${sh?sh.name:''}`,body:e.result&&e.result.placing?`Placed ${e.result.placing}${e.result.divisionPlacing?' · '+e.result.divisionPlacing:''}`:''}); });
  DB.measurements.filter(m=>m.animalId===a.id).forEach(m=>ev.push({d:m.date,icon:ICON.ruler,c:'var(--ink-2)',title:`${m.type}: ${m.value} ${m.unit||''}`,body:''}));
  DB.notes.filter(n=>n.animalId===a.id).forEach(n=>ev.push({d:n.date,icon:ICON.note,c:'var(--muted)',title:`${n.type} note`,body:n.text}));
  careForAnimal(a.id).forEach(c=>{ const cat=careCat(c.category); ev.push({d:c.date,icon:ICON[cat.icon],c:cat.color,title:`Care: ${c.category}`,body:c.detail||c.notes||''}); });
  ev.sort((x,y)=>x.d<y.d?1:-1);
  if(!ev.length){ box.innerHTML='<div class="empty" style="padding:14px">Nothing logged yet.</div>'; return; }
  box.innerHTML=`<div class="timeline">${ev.slice(0,40).map(e=>`<div class="tl-item"><div class="node" style="border-color:${e.c};color:${e.c}">${e.icon}</div><div class="tl-t">${esc(e.title)}</div><div class="tl-d">${fmtDate(e.d)} · ${relDays(e.d)}</div>${e.body?`<div class="tl-b">${esc(e.body)}</div>`:''}</div>`).join('')}</div>`;
}

/* ---------- WEIGHT TAB ---------- */
/* Flag weigh-ins that look like data-entry errors (bad date or typo weight),
   so unusual numbers are easy to spot and fix. Returns { [weightId]: {level,reason} }. */
function speciesAdgCeiling(sp){ return {swine:4.5, cattle:6.5, sheep:2.5, goat:2.5}[sp] || 4.5; }
/* a weigh-in confirmed "correct" is tied to its weight+date, so editing either re-checks it */
const weighSig = w => (w.weight)+'|'+(w.date);
const weighConfirmed = w => !!(w.confirmed && w.confirmSig===weighSig(w));
function weightFlags(ws, sp, opts){
  const ceil=speciesAdgCeiling(sp); const flags={};
  for(let j=1;j<ws.length;j++){ const w=ws[j], p=ws[j-1];
    const days=daysBetween(p.date,w.date); const gain=+w.weight-+p.weight;
    if(days<=0){ flags[w.id]={level:'bad',reason:'Date isn’t after the previous weigh-in — check the date'}; continue; }
    const adg=gain/days;
    if(adg>ceil){ flags[w.id]={level:'warn',reason:`+${round(adg,1)} lb/day since the last weigh-in looks high — check the weight or date`}; }
    else if(adg< -0.6){ flags[w.id]={level:'warn',reason:`${round(adg,1)} lb/day (losing weight) — check the weight or date`}; }
  }
  // a single value far out of line with BOTH neighbours (a V or ^ shape) → likely a typo
  for(let j=1;j<ws.length-1;j++){ const A=+ws[j-1].weight, B=+ws[j].weight, C=+ws[j+1].weight;
    const d1=B-A, d2=C-B;
    if(Math.sign(d1)!==Math.sign(d2) && Math.min(Math.abs(d1),Math.abs(d2))>=15 && !flags[ws[j].id]){
      flags[ws[j].id]={level:'warn',reason:'This weight is out of line with the ones around it — possible typo'};
    }
  }
  // drop flags the user has reviewed and confirmed correct (unless we're asked to show them)
  if(!(opts&&opts.ignoreConfirmed)) ws.forEach(w=>{ if(weighConfirmed(w) && flags[w.id]) delete flags[w.id]; });
  return flags;
}
/* Entry-time sanity check for a single weigh-in against its date-neighbours.
   Returns a plain-English reason string if it looks off, else null. */
function weighInAnomaly(animalId, weight, date, excludeId){
  const a=getAnimal(animalId); if(!a) return null;
  const others=weightsFor(animalId).filter(w=>w.id!==excludeId);
  if(others.some(o=>o.date===date)) return `You already have a weigh-in dated ${fmtShort(date)}. Is the date right?`;
  const ceil=speciesAdgCeiling(a.species);
  const earlier=others.filter(o=>o.date<date).sort((x,y)=>x.date<y.date?1:-1)[0];
  const later=others.filter(o=>o.date>date).sort((x,y)=>x.date<y.date?-1:1)[0];
  if(earlier){ const days=daysBetween(earlier.date,date); if(days>0){ const adg=(weight-earlier.weight)/days;
    if(adg>ceil) return `That's +${round(adg,1)} lb/day since ${fmtShort(earlier.date)} (${earlier.weight} lb) — a big jump. Is the weight and date right?`;
    if(adg< -0.6) return `That's a ${round(adg,1)} lb/day drop from ${fmtShort(earlier.date)} (${earlier.weight} lb). Is the weight and date right?`; } }
  if(later){ const days=daysBetween(date,later.date); if(days>0){ const adg=(later.weight-weight)/days;
    if(adg>ceil) return `That would need +${round(adg,1)} lb/day to reach the ${fmtShort(later.date)} weigh-in (${later.weight} lb) — is this weight right?`;
    if(adg< -0.6) return `That's higher than the next weigh-in on ${fmtShort(later.date)} (${later.weight} lb) — is the weight and date right?`; } }
  return null;
}
function tabWeight(box,a){
  const ws=weightsFor(a.id); const st=animalStats(a);
  const flags=weightFlags(ws,a.species); const flagCount=Object.keys(flags).length;
  box.innerHTML=`
    <div class="btn-row"><button class="btn primary" id="addW" style="flex:1">${ICON.plus} Add weight</button></div>
    <div class="grid g2" style="margin-top:12px">
      <div class="stat"><div class="k">Latest</div><div class="v tnum">${st.curW??'—'}<small> lb</small></div><div class="sub">${st.curD?relDays(st.curD):''}</div></div>
      <div class="stat"><div class="k">Lifetime ADG</div><div class="v tnum">${st.adgLife??'—'}<small> lb/d</small></div><div class="sub">${st.adgPeriod!=null?'last period '+st.adgPeriod:''}</div></div>
    </div>
    <div class="section-title">Chart</div>
    <div class="card pad">
      <div class="chips" id="rangeChips">${[['7','7d'],['30','30d'],['90','90d'],['all','Season']].map(([k,l],i)=>`<button class="chip ${(k==='all')?'active':''}" data-range="${k}">${l}</button>`).join('')}</div>
      <div id="wChart"></div>
      <div class="chart-legend"><span><span class="leg-line" style="background:var(--purple-3)"></span>Actual</span>${a.targetWeight?'<span><span class="leg-line" style="background:var(--teal-3)"></span>Target</span>':''}</div>
    </div>
    ${flagCount?`<div class="card pad" id="wFlagBanner" style="margin-top:12px;background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.4);display:flex;align-items:center;gap:10px;cursor:pointer">
      <span style="width:22px;height:22px;color:var(--warn);flex:none">${ICON.info}</span>
      <div style="flex:1;font-size:13.5px;font-weight:700">${flagCount} weigh-in${flagCount===1?'':'s'} look${flagCount===1?'s':''} unusual — likely a wrong weight or date. Tap to review.</div>${ICON.chev}</div>`:''}
    <div class="section-title">History</div>
    <div id="wHist"></div>`;
  let range='all';
  const drawChart=()=>{ let data=ws; if(range!=='all'){ const cut=new Date(Date.now()-(+range)*86400000).toISOString().slice(0,10); data=ws.filter(w=>w.date>=cut); }
    const series=[{color:'var(--purple-3)',data:data.map(w=>({x:w.date,y:+w.weight}))}];
    const markers=[]; if(a.targetWeight&&a.targetDate){ series.push({color:'var(--teal-3)',width:2,data:[{x:(data[0]||ws[0]).date,y:a.targetWeight},{x:a.targetDate,y:a.targetWeight}]}); markers.push({x:a.targetDate,color:'#0D9488'}); }
    $('#wChart',box).innerHTML=lineChart(series,{markers,extraY:a.targetWeight?[a.targetWeight]:[]}); };
  drawChart();
  $$('#rangeChips button',box).forEach(b=>b.onclick=()=>{ range=b.dataset.range; $$('#rangeChips button',box).forEach(x=>x.classList.toggle('active',x===b)); drawChart(); });
  const hist=$('#wHist',box);
  if(!ws.length) hist.innerHTML=emptyState(ICON.weight,'No weights yet','No weights have been recorded yet. Add the first weight to begin tracking average daily gain.');
  else { const L=el('div','list'); ws.slice().reverse().forEach((w,i,arr)=>{ const prev=arr[i+1]; const gain=prev?round(w.weight-prev.weight,1):null; const days=prev?daysBetween(prev.date,w.date):null; const adg=(gain!=null&&days>0)?round(gain/days,2):null;
    const fl=flags[w.id];
    const li=el('div','li'); if(fl)li.style.cssText='border-left:3px solid var(--'+(fl.level==='bad'?'bad':'warn')+')';
    li.innerHTML=`<div class="thumb" style="color:${fl?'var(--'+(fl.level==='bad'?'bad':'warn')+')':'var(--purple-3)'}">${fl?ICON.info:ICON.weight}</div>
      <div class="main"><div class="t1 tnum">${w.weight} lb${fl?` <span class="pill ${fl.level==='bad'?'bad':'warn'}" style="font-size:9px">Check</span>`:''}</div><div class="t2">${fmtDate(w.date)}${w.scale?' · '+esc(w.scale):''}${w.by?' · '+esc(userName(w.by)):''}</div>${fl?`<div class="t2" style="color:var(--${fl.level==='bad'?'bad':'warn'});white-space:normal;font-weight:600;margin-top:2px">${esc(fl.reason)}</div>`:''}${weighConfirmed(w)&&w.confirmNote?`<div class="t2" style="color:var(--muted);white-space:normal;margin-top:2px">${ICON.check} ${esc(w.confirmNote)}</div>`:''}</div>
      <div class="r">${gain!=null?`<div style="font-weight:800;color:${gain>=0?'var(--good)':'var(--bad)'}" class="tnum">${gain>=0?'+':''}${gain}</div><div style="font-size:11px;color:var(--muted)" class="tnum">${adg!=null?adg+' lb/d':''}</div>`:'<span class="pill gray" style="font-size:10px">start</span>'}</div>`;
    li.onclick=()=>openWeightSheet(a.id,w.id); L.append(li); }); hist.append(L); }
  if($('#wFlagBanner',box))$('#wFlagBanner',box).onclick=()=>{ const id=Object.keys(flags)[0]; if(id)openWeightSheet(a.id,id); };
  $('#addW',box).onclick=()=>openWeightSheet(a.id);
}

/* ---------- FEED TAB ---------- */
function feedCard(f,showActions){
  const totals=feedDailyTotal(f); const fs=feedProgramStats(f);
  const totalStr=Object.entries(totals).map(([u,v])=>round(v,2)+' '+u).join(' · ');
  return `<div class="card pad">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
      <div><div style="font-weight:800;font-size:15px">${esc(f.name)}${!f.endDate?' <span class="pill good" style="font-size:10px">Current</span>':''}</div>
      <div style="font-size:12px;color:var(--muted);font-weight:600;margin-top:2px">${esc(f.objective||'')} · ${fmtShort(f.startDate)}${f.endDate?' – '+fmtShort(f.endDate):' – now'} · ${fs.days}d</div></div>
      ${totalStr?`<span class="pill t">${esc(totalStr)}/day</span>`:''}
    </div>
    <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">
      ${(f.meals||[]).map(m=>`<div style="background:var(--line-2);border-radius:12px;padding:9px 11px"><div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);margin-bottom:4px">${esc(m.time)}</div>${(m.items||[]).map(it=>`<div style="display:flex;justify-content:space-between;font-size:13.5px;padding:1px 0"><span>${esc(it.product)}</span><span class="tnum" style="font-weight:700;color:var(--ink-2)">${it.amount} ${esc(it.unit)}</span></div>`).join('')||'<span style="color:var(--muted);font-size:12px">—</span>'}</div>`).join('')}
    </div>
    ${f.advisorRec?`<div class="help" style="margin-top:10px">${ICON.wand}<span><b>Advisor:</b> ${esc(f.advisorRec)}</span></div>`:''}
    ${(()=>{ const dc=feedDailyCost(f); if(dc.cost<=0&&!dc.uncosted.length) return '';
      const runCost=dc.cost*feedProgramDays(f);
      return `<div style="display:flex;gap:14px;margin-top:10px;font-size:12px;font-weight:700;color:var(--muted);flex-wrap:wrap">${dc.cost>0?`<span>Feed <b class="tnum" style="color:var(--ink)">${money(dc.cost)}/day</b></span><span>This program <b class="tnum" style="color:var(--ink)">${money(runCost)}</b></span>`:''}${dc.uncosted.length?`<span style="color:var(--warn)">Unpriced: ${esc(dc.uncosted.join(', '))}</span>`:''}</div>`; })()}
    ${fs.adg!=null?`<div style="display:flex;gap:14px;margin-top:8px;font-size:12px;font-weight:700;color:var(--muted)"><span>Gain <b class="tnum" style="color:var(--ink)">${fs.gain>0?'+':''}${fs.gain} lb</b></span><span>ADG <b class="tnum" style="color:var(--ink)">${fs.adg} lb/d</b></span></div>`:''}
  </div>`;
}
function tabFeed(box,a){
  const progs=feedFor(a.id); const cur=currentFeed(a.id);
  box.innerHTML=`<div class="btn-row"><button class="btn primary" id="addFeed" style="flex:1">${ICON.plus} New feed program</button>
    ${progs.length>1?`<button class="btn" id="cmpFeed">${ICON.trend} Compare</button>`:''}</div>
    <div class="help" style="margin-top:12px">${ICON.info}<span>Changing feed never erases the old program — each change is saved as a dated version so you can see what worked.</span></div>
    ${cur?`<div class="section-title">Current program</div><div id="feedCur"></div>`:''}
    ${progs.filter(f=>f.id!==(cur&&cur.id)).length?`<div class="section-title">History</div><div id="feedHist"></div>`:progs.length?'':emptyState(ICON.feed,'No feed program yet','Add the current ration to start tracking feed response against weight.')}`;
  // build a card + Duplicate/Edit bar for one program
  const cardWith=(f)=>{ const wrap=el('div'); wrap.style.marginBottom='10px'; wrap.append(htmlToFrag(feedCard(f)));
    const bar=el('div','btn-row'); bar.style.marginTop='6px';
    bar.innerHTML=`<button class="btn sm ghost" data-dup>${ICON.copy} Duplicate</button><button class="btn sm ghost" data-edit>${ICON.edit} Edit</button>`;
    $('[data-dup]',bar).onclick=()=>openFeedSheet(a.id,null,f); $('[data-edit]',bar).onclick=()=>openFeedSheet(a.id,f.id);
    wrap.append(bar); return wrap; };
  const curBox=$('#feedCur',box);
  if(curBox && cur) curBox.append(cardWith(cur));   // current program is now editable too
  const hist=$('#feedHist',box);
  if(hist){ progs.filter(f=>f.id!==(cur&&cur.id)).forEach(f=>hist.append(cardWith(f))); }
  $('#addFeed',box).onclick=()=>openFeedSheet(a.id);
  if($('#cmpFeed',box))$('#cmpFeed',box).onclick=()=>openFeedCompare(a.id);
}
function openFeedCompare(id){
  const progs=feedFor(id); const body=el('div');
  body.innerHTML=`<p style="font-size:13px;color:var(--muted);margin-bottom:10px">Response of each program — weight gain and ADG while it was active.</p>`+
    barChart(progs.map(f=>{ const s=feedProgramStats(f); return {label:f.name, value:s.adg||0, disp:(s.adg!=null?s.adg+' lb/d':'—')+' · '+s.days+'d', color:'var(--teal-3)'}; }))+
    `<div class="divider"></div>`+progs.map(f=>{ const s=feedProgramStats(f); return `<div class="card pad" style="margin-bottom:8px"><div style="font-weight:800">${esc(f.name)}</div><div style="font-size:12px;color:var(--muted);margin:2px 0 6px">${esc(f.objective||'')} · ${fmtShort(f.startDate)}–${f.endDate?fmtShort(f.endDate):'now'}</div><div style="display:flex;gap:16px;font-size:13px;font-weight:700"><span>Start <b class="tnum">${s.startW??'—'}</b></span><span>End <b class="tnum">${s.endW??'—'}</b></span><span>Gain <b class="tnum">${s.gain!=null?(s.gain>0?'+':'')+s.gain:'—'}</b></span><span>ADG <b class="tnum">${s.adg??'—'}</b></span></div></div>`; }).join('');
  openSheet({title:'Compare feed programs',body});
}

/* ---- weight entry sheet ---- */
function openWeightSheet(animalId, weightId){
  if(!can('addRecord')){ toast('Your role can’t add weights','bad'); return; }
  const a=getAnimal(animalId); const ws=weightsFor(animalId); const lastW=ws.length?+ws[ws.length-1].weight:(a.startWeight||80);
  const rawFlag = weightId ? weightFlags(ws, a.species, {ignoreConfirmed:true})[weightId] : null;
  const wConfirmed = weightId ? weighConfirmed(DB.weights.find(x=>x.id===weightId)||{}) : false;
  const w = weightId?{...DB.weights.find(x=>x.id===weightId)}:{ animalId, weight:Math.round(lastW), date:todayISO(), time:nowTime(), scale:DB.lastScale||'', by:DB.currentUserId };
  const body=el('div');
  body.innerHTML=`
    <div style="text-align:center;margin:6px 0 14px"><div style="font-size:12px;color:var(--muted);font-weight:700">${esc(a.name)}${lastW?` · last ${lastW} lb`:''}</div></div>
    <div class="stepper" style="margin-bottom:16px"><button data-step="-1">−</button><div class="val"><span id="wVal" class="tnum">${w.weight}</span><small> lb</small></div><button data-step="1">+</button></div>
    <div class="field"><input class="control" type="number" inputmode="decimal" id="wInput" value="${w.weight}" style="text-align:center;font-size:20px;font-weight:800"></div>
    <div class="field-row"><div class="field" style="flex:1"><label>Date</label><input class="control" type="date" id="wDate" value="${w.date}"></div>
      <div class="field" style="flex:1"><label>Time</label><input class="control" type="time" id="wTime" value="${w.time||nowTime()}"></div></div>
    <div class="field"><label>Scale used</label><input class="control" id="wScale" value="${esc(w.scale||'')}" placeholder="Barn deck scale"></div>
    <div class="field-row"><div class="field" style="flex:1"><label>Body condition (1–9)</label><input class="control" type="number" min="1" max="9" id="wBcs" value="${w.bcs??''}"></div>
      <div class="field" style="flex:1"><label>Fill</label><select class="control" id="wFill"><option value=""></option>${['Empty','Light','Normal','Full','Heavy'].map(x=>`<option ${w.fill===x?'selected':''}>${x}</option>`).join('')}</select></div></div>
    <div class="field"><label>Notes</label><textarea class="control" id="wNotes" placeholder="How did they look and handle?">${esc(w.notes||'')}</textarea></div>
    ${rawFlag?`<div class="card pad" style="background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.4)">
      <div style="font-weight:800;color:var(--warn);font-size:13px;display:flex;gap:6px;align-items:center">${ICON.info} This weigh-in looks unusual</div>
      <div style="font-size:12.5px;color:var(--ink-2);margin:5px 0 10px">${esc(rawFlag.reason)}</div>
      <label class="li" style="border:1px solid var(--line);border-radius:12px;margin:0 0 8px"><div class="main"><div class="t1" style="font-size:13.5px">This weight is correct</div><div class="t2">Keep it as-is and stop flagging it</div></div><input type="checkbox" id="wConfirm" ${wConfirmed?'checked':''} style="width:22px;height:22px"></label>
      <input class="control" id="wConfirmNote" placeholder="Reason (e.g. ulcer that week — treated, back on gain)" value="${esc(w.confirmNote||'')}">
    </div>`:''}
    <div id="wCalc"></div>`;
  const calc=()=>{ const val=+$('#wInput',body).value; const prev=ws.filter(x=>x.id!==weightId).slice(-1)[0];
    if(prev){ const g=round(val-prev.weight,1); const d=daysBetween(prev.date,$('#wDate',body).value); const adg=d>0?round(g/d,2):null;
      $('#wCalc',body).innerHTML=`<div class="card pad" style="background:var(--line-2);border:none"><div style="display:flex;justify-content:space-around;text-align:center"><div><div style="font-size:11px;color:var(--muted);font-weight:700">GAIN</div><div style="font-weight:800;font-size:17px;color:${g>=0?'var(--good)':'var(--bad)'}" class="tnum">${g>=0?'+':''}${g}</div></div><div><div style="font-size:11px;color:var(--muted);font-weight:700">DAYS</div><div style="font-weight:800;font-size:17px" class="tnum">${d}</div></div><div><div style="font-size:11px;color:var(--muted);font-weight:700">ADG</div><div style="font-weight:800;font-size:17px;color:var(--purple-3)" class="tnum">${adg??'—'}</div></div></div></div>`; }
    else $('#wCalc',body).innerHTML=''; };
  const setVal=v=>{ v=clamp(round(v,1),0,3000); $('#wVal',body).textContent=v; $('#wInput',body).value=v; calc(); };
  const foot=el('div'); foot.innerHTML=`${weightId?`<button class="btn danger" data-del>${ICON.trash}</button>`:''}<button class="btn primary" data-save style="flex:1">${weightId?'Save':'Log weight'}</button>`;
  const sh=openSheet({title:weightId?'Edit weight':'Add weight',body,foot});
  $$('[data-step]',sh).forEach(b=>b.onclick=()=>setVal(+$('#wInput',body).value+(+b.dataset.step)));
  $('#wInput',sh).oninput=()=>{ $('#wVal',body).textContent=$('#wInput',body).value; calc(); };
  $('#wDate',sh).onchange=calc; calc();
  $('[data-save]',sh).onclick=async()=>{ const val=+$('#wInput',body).value; if(!val){toast('Enter a weight','bad');return;}
    const date=$('#wDate',body).value;
    const confirmChk = $('#wConfirm',body) && $('#wConfirm',body).checked;
    const warn = confirmChk ? null : weighInAnomaly(animalId, val, date, weightId);
    if(warn){ const ok=await confirmSheet('Double-check this weigh-in', warn, 'Save anyway'); if(!ok) return; }
    const rec={ weight:val, date, time:$('#wTime',body).value, scale:$('#wScale',body).value.trim(), bcs:$('#wBcs',body).value||null, fill:$('#wFill',body).value||null, notes:$('#wNotes',body).value.trim(), by:DB.currentUserId };
    DB.lastScale=rec.scale;
    if(weightId){ const target=DB.weights.find(x=>x.id===weightId); Object.assign(target,rec);
      if($('#wConfirm',body)){ if(confirmChk){ target.confirmed=true; target.confirmNote=$('#wConfirmNote',body).value.trim(); target.confirmedBy=DB.currentUserId; target.confirmedAt=nowISO(); target.confirmSig=weighSig(target); logAct('weight',`Confirmed weigh-in ${val} lb on ${fmtShort(date)} correct${target.confirmNote?' — '+target.confirmNote:''}`,animalId); }
        else { target.confirmed=false; delete target.confirmSig; logAct('weight','Edited weight '+val+' lb',animalId); } }
      else logAct('weight','Edited weight '+val+' lb',animalId);
      touch(target); }
    else { DB.weights.push(stamp({id:uid('w'),animalId,...rec})); logAct('weight','Logged '+val+' lb',animalId); }
    save(); closeSheet(); toast('Weight saved','good'); render();
    if(!weightId){  // celebrate milestones on a fresh weigh-in
      const prevMax = ws.length ? Math.max(...ws.map(w=>+w.weight)) : (a.startWeight!=null?+a.startWeight:0);
      if(a.targetWeight && val>=+a.targetWeight && prevMax<+a.targetWeight) milestone('goal:'+animalId+':'+a.targetWeight, `${a.name} hit the goal!`, `${val} lb — target reached`, '🎯');
      else if(DB.weights.length===1) milestone('first:weight', 'First weigh-in logged!', 'You’re officially tracking gains', '⚖️');
    }
  };
  if($('[data-del]',sh))$('[data-del]',sh).onclick=async()=>{ if(await confirmSheet('Delete weight','Remove this weight record?','Delete',true)){ DB.weights=DB.weights.filter(x=>x.id!==weightId); save(); closeSheet(); render(); } };
}

/* ---- feed program sheet ---- */
function openFeedSheet(animalId, feedId, dupFrom){
  if(!can('addRecord')){ toast('Your role can’t change feed','bad'); return; }
  const a=getAnimal(animalId);
  let f;
  if(feedId) f={...DB.feed.find(x=>x.id===feedId), meals:JSON.parse(JSON.stringify(DB.feed.find(x=>x.id===feedId).meals||[]))};
  else if(dupFrom) f={ animalId, name:dupFrom.name+' (copy)', objective:dupFrom.objective, startDate:todayISO(), endDate:null, meals:JSON.parse(JSON.stringify(dupFrom.meals||[])), reason:'Duplicated from '+dupFrom.name };
  else f={ animalId, name:'', objective:'Growth', startDate:todayISO(), endDate:null, meals:[{time:'Morning',items:[{product:'',amount:'',unit:'lb'}]},{time:'Evening',items:[{product:'',amount:'',unit:'lb'}]}], reason:'' };
  const body=el('div');
  const draw=()=>{
    body.innerHTML=`
      <div class="field"><label>Program name *</label><input class="control" id="fName" value="${esc(f.name)}" placeholder="Finisher + Shape"></div>
      <div class="field-row"><div class="field" style="flex:1"><label>Objective</label><select class="control" id="fObj">${FEED_OBJECTIVES.map(o=>`<option ${f.objective===o?'selected':''}>${o}</option>`).join('')}</select></div>
        <div class="field" style="flex:1"><label>Start date</label><input class="control" type="date" id="fStart" value="${f.startDate}"></div></div>
      <div id="fMeals"></div>
      <button class="btn sm block" id="addMeal" style="margin:4px 0 8px">${ICON.plus} Add feeding</button>
      <div id="fCostEst" style="margin-bottom:12px"></div>
      <div class="field"><label>Reason for change</label><input class="control" id="fReason" value="${esc(f.reason||'')}" placeholder="e.g. adding cover before show"></div>
      <div class="field"><label>Advisor recommendation</label><input class="control" id="fAdv" value="${esc(f.advisorRec||'')}"></div>
      <datalist id="fProdList">${[...new Set((DB.inventory||[]).map(p=>(p.product||'').trim()).filter(Boolean))].map(n=>`<option value="${esc(n)}"></option>`).join('')}</datalist>`;
    const mc=$('#fMeals',body);
    (f.meals||[]).forEach((m,mi)=>{ const card=el('div','card pad'); card.style.marginBottom='10px';
      const copyFrom=(f.meals[0]&&f.meals[0].time)||'first feeding';
      card.innerHTML=`<div style="display:flex;gap:8px;margin-bottom:8px"><input class="control" value="${esc(m.time)}" data-mtime="${mi}" style="font-weight:700;flex:1" placeholder="Morning"><button class="iconbtn" style="background:var(--line-2);color:var(--bad)" data-mdel="${mi}">${ICON.trash}</button></div>${mi>0?`<button class="btn sm ghost block" data-same="${mi}" style="margin:0 0 8px">${ICON.copy||ICON.plus} Same as ${esc(copyFrom)}</button>`:''}<div data-items="${mi}"></div><button class="btn sm ghost" data-add="${mi}">${ICON.plus} Add product</button>`;
      const ic=$('[data-items="'+mi+'"]',card);
      (m.items||[]).forEach((it,ii)=>{ const row=el('div'); row.style.cssText='display:flex;gap:6px;margin-bottom:6px';
        row.innerHTML=`<input class="control" value="${esc(it.product)}" data-p="${mi}-${ii}" list="fProdList" placeholder="Product" style="flex:2"><input class="control" type="number" inputmode="decimal" value="${it.amount}" data-a="${mi}-${ii}" placeholder="Qty" style="flex:1;min-width:56px"><select class="control" data-u="${mi}-${ii}" style="flex:1;min-width:70px">${UNITS.map(u=>`<option ${it.unit===u?'selected':''}>${u}</option>`).join('')}</select><button class="iconbtn" style="background:var(--line-2);color:var(--muted);flex:none" data-idel="${mi}-${ii}">${ICON.x}</button>`;
        ic.append(row); });
      mc.append(card); });
    // wire
    $$('[data-mtime]',body).forEach(inp=>inp.oninput=()=>f.meals[+inp.dataset.mtime].time=inp.value);
    $$('[data-mdel]',body).forEach(b=>b.onclick=()=>{collectMeals();f.meals.splice(+b.dataset.mdel,1);draw();});
    $$('[data-add]',body).forEach(b=>b.onclick=()=>{collectMeals();f.meals[+b.dataset.add].items.push({product:'',amount:'',unit:'lb'});draw();});
    $$('[data-idel]',body).forEach(b=>b.onclick=()=>{collectMeals();const[mi,ii]=b.dataset.idel.split('-').map(Number);f.meals[mi].items.splice(ii,1);draw();});
    $('#addMeal',body).onclick=()=>{collectMeals();f.meals.push({time:'Midday',items:[{product:'',amount:'',unit:'lb'}]});draw();};
    // "Same as morning" — copy the first feeding's products into this feeding
    $$('[data-same]',body).forEach(b=>b.onclick=()=>{ collectMeals(); const mi=+b.dataset.same;
      const src=(f.meals[0]&&f.meals[0].items)||[]; f.meals[mi].items=JSON.parse(JSON.stringify(src.length?src:[{product:'',amount:'',unit:'lb'}]));
      draw(); toast('Copied from '+((f.meals[0]&&f.meals[0].time)||'first feeding'),'good'); });
    // recognise a typed product from the feed & bedding list → adopt its unit
    $$('[data-p]',body).forEach(inp=>inp.addEventListener('change',()=>{ const p=productByName(inp.value); if(!p)return;
      const[mi,ii]=inp.dataset.p.split('-').map(Number);
      if(p.unit && UNITS.includes(p.unit) && (!f.meals[mi].items[ii].amount || f.meals[mi].items[ii].unit==='lb')){
        f.meals[mi].items[ii].unit=p.unit; const sel=$('[data-u="'+mi+'-'+ii+'"]',body); if(sel)sel.value=p.unit; }
      updateCost(); }));
    const updateCost=()=>{ collectMeals(); const dc=feedDailyCost(f); const est=$('#fCostEst',body); if(!est)return;
      est.innerHTML = dc.cost>0 ? `<div class="help">${ICON.money}<span>Estimated <b>${money(dc.cost)}/day</b> at your current feed prices${dc.uncosted.length?` · unpriced: ${esc(dc.uncosted.join(', '))}`:''}</span></div>`
        : (dc.uncosted.length?`<div class="help">${ICON.info}<span>Price these in <b>Feed &amp; bedding costs</b> to auto-cost this ration: ${esc(dc.uncosted.join(', '))}</span></div>`:''); };
    $$('[data-p],[data-a],[data-u]',body).forEach(inp=>inp.addEventListener('input',updateCost));
    updateCost();
  };
  const collectMeals=()=>{ $$('[data-p]',body).forEach(inp=>{const[mi,ii]=inp.dataset.p.split('-').map(Number);f.meals[mi].items[ii].product=inp.value;});
    $$('[data-a]',body).forEach(inp=>{const[mi,ii]=inp.dataset.a.split('-').map(Number);f.meals[mi].items[ii].amount=inp.value;});
    $$('[data-u]',body).forEach(inp=>{const[mi,ii]=inp.dataset.u.split('-').map(Number);f.meals[mi].items[ii].unit=inp.value;});
    $$('[data-mtime]',body).forEach(inp=>f.meals[+inp.dataset.mtime].time=inp.value);
    // preserve header fields across redraws (add product/feeding, same-as, etc.)
    const g=(id,k)=>{ const e=$(id,body); if(e)f[k]=e.value; };
    g('#fName','name'); g('#fObj','objective'); g('#fStart','startDate'); g('#fReason','reason'); g('#fAdv','advisorRec'); };
  draw();
  const foot=el('div'); foot.innerHTML=`<button class="btn ghost" data-cancel>Cancel</button><button class="btn primary" data-save>${feedId?'Save':'Start program'}</button>`;
  const sh=openSheet({title:feedId?'Edit feed program':'New feed program',body,foot});
  $('[data-cancel]',sh).onclick=()=>closeSheet();
  $('[data-save]',sh).onclick=()=>{ collectMeals(); f.name=$('#fName',body).value.trim(); f.objective=$('#fObj',body).value; f.startDate=$('#fStart',body).value; f.reason=$('#fReason',body).value.trim(); f.advisorRec=$('#fAdv',body).value.trim();
    f.meals.forEach(m=>m.items=m.items.filter(it=>it.product||it.amount));
    if(!f.name){toast('Name the program','bad');return;}
    if(feedId){ Object.assign(DB.feed.find(x=>x.id===feedId),f); touch(DB.feed.find(x=>x.id===feedId)); logAct('feed','Edited feed: '+f.name,animalId); }
    else { // end current program the day before new start
      const cur=currentFeed(animalId); if(cur && !cur.endDate){ cur.endDate=f.startDate; touch(cur); }
      DB.feed.push(stamp({id:uid('f'),by:DB.currentUserId,...f})); logAct('feed','New feed: '+f.name,animalId); }
    save(); closeSheet(); toast('Feed program saved','good'); render();
  };
}

/* ---------- MEDIA TAB ---------- */
let mediaView='timeline', mediaOrder='asc';
function tabMedia(box,a){
  const items=mediaFor(a.id);
  const photos=items.filter(m=>m.kind!=='video').slice().sort((x,y)=>(x.captured||x.date)<(y.captured||y.date)?-1:1);
  const photoCount=photos.length;
  box.innerHTML=`<div class="btn-row"><button class="btn primary" id="upPhoto" style="flex:1">${ICON.camera} Photo</button><button class="btn teal" id="upVideo" style="flex:1">${ICON.video} Video</button></div>
    ${photoCount>=2?`<button class="btn block" id="makeReel" style="margin-top:10px;background:linear-gradient(135deg,var(--purple-3),var(--teal-3));color:#fff;border:none">${ICON.video} Create growth reel</button>`:''}
    <div id="journey"></div>
    <div class="seg" id="mView" style="margin-top:12px"><button data-v="timeline">Timeline</button><button data-v="gallery">Gallery</button><button data-v="compare">Before / After</button></div>
    <div id="mBody" style="margin-top:4px"></div>`;
  const photoIn=hiddenFile('image/*',(files)=>addMedia(a.id,files,'photo'));
  const videoIn=hiddenFile('video/*',(files)=>addMedia(a.id,files,'video'));
  $('#upPhoto',box).onclick=()=>photoIn.click(); $('#upVideo',box).onclick=()=>videoIn.click();
  if($('#makeReel',box))$('#makeReel',box).onclick=()=>openReelSheet(a.id);
  // Growth journey — then → now
  if(photoCount>=2){ const A=photos[0], B=photos[photoCount-1];
    const days=daysBetween(A.captured||A.date, B.captured||B.date);
    const wa=weightNear(a.id,A.captured||A.date), wb=weightNear(a.id,B.captured||B.date);
    const dw=(wa!=null&&wb!=null)?round(wb-wa,1):null;
    const jc=el('div','card pad'); jc.style.cssText='margin-top:12px;cursor:pointer';
    jc.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font-weight:800;font-size:14px">Growth journey</div><span class="pill p" style="font-size:10px">${days} day${days===1?'':'s'}${dw!=null?' · '+(dw>=0?'+':'')+dw+' lb':''}</span></div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="flex:1"><div data-ja style="aspect-ratio:1;border-radius:12px;background:var(--line-2) center/cover"></div><div style="text-align:center;font-size:11px;color:var(--muted);font-weight:700;margin-top:4px">${fmtShort(A.captured||A.date)}${wa!=null?' · '+wa+' lb':''}</div></div>
        <div style="flex:none;color:var(--purple-3)">${ICON.chev}</div>
        <div style="flex:1"><div data-jb style="aspect-ratio:1;border-radius:12px;background:var(--line-2) center/cover"></div><div style="text-align:center;font-size:11px;color:var(--muted);font-weight:700;margin-top:4px">${fmtShort(B.captured||B.date)}${wb!=null?' · '+wb+' lb':''}</div></div>
      </div>`;
    Media.url(A.blobId).then(u=>{ if(u)$('[data-ja]',jc).style.backgroundImage=`url(${u})`; });
    Media.url(B.blobId).then(u=>{ if(u)$('[data-jb]',jc).style.backgroundImage=`url(${u})`; });
    jc.onclick=()=>{ mediaView='compare'; render(); };
    $('#journey',box).append(jc);
  }
  const seg=$('#mView',box); $$('button',seg).forEach(b=>b.classList.toggle('on',b.dataset.v===mediaView));
  const draw=()=>{ const mb=$('#mBody',box); mb.innerHTML='';
    if(!items.length){ mb.innerHTML=emptyState(ICON.media,'No media yet','Upload weekly side, front, rear and walking photos and the app will build a dated growth timeline.'); return; }
    if(mediaView==='gallery'){ const g=el('div','gallery'); items.forEach(m=>g.append(mediaCell(m,a))); mb.append(g); }
    else if(mediaView==='timeline'){
      mb.append(htmlToFrag(`<div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="chip sm" id="mOrder" style="padding:5px 11px;font-size:12px">${mediaOrder==='asc'?ICON.download:ICON.upload} ${mediaOrder==='asc'?'Oldest first':'Newest first'}</button></div>`));
      const tl=el('div'); mb.append(tl); mediaTimeline(tl,a,items,mediaOrder);
      $('#mOrder',mb).onclick=()=>{ mediaOrder=mediaOrder==='asc'?'desc':'asc'; draw(); };
    }
    else { drawCompare(mb,a,items); }
  };
  draw();
  $$('#mView button',box).forEach(b=>b.onclick=()=>{ mediaView=b.dataset.v; $$('#mView button',box).forEach(x=>x.classList.toggle('on',x===b)); draw(); });
}
function mediaCell(m,a,opts){ const cell=el('div','g'); const d=m.captured||m.date;
  cell.innerHTML=`<div class="tag" style="top:auto;bottom:5px;left:5px;background:rgba(0,0,0,.68)">${esc(fmtShort(d))}</div>`+
    ((opts&&opts.showName&&a&&a.name)?`<div class="tag" style="max-width:78%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.name)}</div>`:(m.view&&m.view!=='Profile'?`<div class="tag" style="left:auto;right:5px;background:rgba(139,92,246,.85)">${esc(m.view)}</div>`:''))+
    (m.kind==='video'?`<div class="play">${ICON.video}</div>`:'');
  Media.url(m.blobId).then(u=>{ if(!u)return; const e=m.kind==='video'?el('video'):el('img'); e.src=u; if(m.kind==='video')e.muted=true; cell.prepend(e); });
  cell.onclick=()=>openMediaViewer(m,a); return cell; }
/* weight recorded on or before a date (for growth-timeline context) */
function weightNear(animalId, dateISO){ const ws=weightsFor(animalId); if(!ws.length)return null; let best=null; ws.forEach(w=>{ if(w.date<=dateISO)best=w; }); return best?+best.weight:(+ws[0].weight); }
/* ---- Read the REAL capture date from the file itself ----
   file.lastModified is when the file was written to THIS device (a download, an
   export, an AirDrop, a text message) — not when it was shot. So we parse the
   capture date out of the file's own metadata first: EXIF DateTimeOriginal for
   photos, the QuickTime/MP4 `mvhd` creation time for videos. lastModified is
   only a last resort, and the user always gets to confirm/adjust on upload. */
async function _bytes(file,start,end){ return new Uint8Array(await file.slice(start,end).arrayBuffer()); }
function _lastModDate(file){ const t=file&&file.lastModified; if(!t)return null; return new Date(t).toISOString().slice(0,10); }
async function exifCapturedDate(file){
  try{
    const buf=await _bytes(file,0,Math.min(file.size,256*1024)); const dv=new DataView(buf.buffer);
    if(dv.getUint16(0)!==0xFFD8)return null;               // not a JPEG
    let off=2;
    while(off+4<dv.byteLength){
      if(dv.getUint8(off)!==0xFF)break; const marker=dv.getUint8(off+1);
      if(marker===0xDA||marker===0xD9)break;               // start of scan / end
      const size=dv.getUint16(off+2);
      if(marker===0xE1 && dv.getUint32(off+4)===0x45786966) return _tiffDate(dv,off+10); // APP1 "Exif"
      off+=2+size;
    }
  }catch(e){} return null;
}
function _tiffDate(dv,tiff){
  const le=dv.getUint16(tiff)===0x4949; const u16=o=>dv.getUint16(o,le), u32=o=>dv.getUint32(o,le);
  const readIFD=o=>{ const n=u16(o); const m={}; for(let i=0;i<n;i++){ const e=o+2+i*12; m[u16(e)]={cnt:u32(e+4),val:e+8}; } return m; };
  const ascii=en=>{ let p=en.cnt>4?tiff+u32(en.val):en.val, s=''; for(let i=0;i<en.cnt-1;i++)s+=String.fromCharCode(dv.getUint8(p+i)); return s; };
  const d0=readIFD(tiff+u32(tiff+4)); let ds=null;
  if(d0[0x8769]){ const de=readIFD(tiff+u32(d0[0x8769].val)); if(de[0x9003])ds=ascii(de[0x9003]); else if(de[0x9004])ds=ascii(de[0x9004]); }
  if(!ds && d0[0x0132])ds=ascii(d0[0x0132]);
  const m=ds&&ds.match(/^(\d{4}):(\d{2}):(\d{2})/); return m?`${m[1]}-${m[2]}-${m[3]}`:null;
}
async function videoCapturedDate(file){
  try{ let off=0; const size=file.size;
    while(off+16<=size){
      const h=await _bytes(file,off,off+16); const dv=new DataView(h.buffer);
      let bs=dv.getUint32(0); const type=String.fromCharCode(h[4],h[5],h[6],h[7]); let hl=8;
      if(bs===1){ bs=dv.getUint32(8)*4294967296+dv.getUint32(12); hl=16; } else if(bs===0){ bs=size-off; }
      if(type==='moov') return await _moovDate(file,off+hl,off+bs);
      if(bs<8)break; off+=bs;                              // slice past mdat etc. without reading it
    }
  }catch(e){} return null;
}
async function _moovDate(file,start,end){
  let off=start;
  while(off+8<=end){
    const h=await _bytes(file,off,Math.min(off+16,end)); const dv=new DataView(h.buffer);
    let bs=dv.getUint32(0); const type=String.fromCharCode(h[4],h[5],h[6],h[7]); let hl=8;
    if(bs===1){ bs=dv.getUint32(8)*4294967296+dv.getUint32(12); hl=16; } else if(bs===0){ bs=end-off; }
    if(type==='mvhd'){ const b=await _bytes(file,off+hl,off+hl+24); const bv=new DataView(b.buffer);
      const ver=bv.getUint8(0); const secs=ver===1?bv.getUint32(4)*4294967296+bv.getUint32(8):bv.getUint32(4);
      if(!secs)return null; const unix=(secs-2082844800)*1000; if(unix<=0)return null;   // mvhd epoch = 1904
      return new Date(unix).toISOString().slice(0,10); }
    if(bs<8)break; off+=bs;
  }
  return null;
}
/* Best guess for a file's capture date + where it came from (drives the confirm UI). */
async function readCapturedDate(file){
  let d=null, src='file';
  try{
    if((file.type||'').startsWith('image/')){ d=await exifCapturedDate(file); if(d)src='photo'; }
    else if((file.type||'').startsWith('video/')){ d=await videoCapturedDate(file); if(d)src='video'; }
  }catch(e){}
  if(!d){ d=_lastModDate(file); src='file'; }
  if(!d){ d=todayISO(); src='today'; }
  if(d>todayISO()){ d=todayISO(); src='today'; }
  return { date:d, src };
}
/* growth story: media grouped by date with weight context, start→finish */
function mediaTimeline(box, a, items, order){
  const dir = order==='desc' ? -1 : 1;   // asc = oldest→newest (start to finish)
  const grp={}; items.forEach(m=>{ const d=m.captured||m.date; (grp[d]=grp[d]||[]).push(m); });
  const dates=Object.keys(grp).sort((x,y)=> x<y?-dir:dir);
  box.innerHTML='';
  dates.forEach(d=>{ const w=weightNear(a.id,d);
    box.append(htmlToFrag(`<div style="display:flex;align-items:center;gap:9px;margin:16px 0 8px">
      <div style="width:10px;height:10px;border-radius:50%;background:var(--purple-3);box-shadow:0 0 0 4px rgba(139,92,246,.18);flex:none"></div>
      <div style="font-weight:800;font-size:14.5px">${fmtDate(d)}</div>
      <div style="font-size:12px;color:var(--muted)">${relDays(d)}${w!=null?` · <b style="color:var(--ink)" class="tnum">${w} lb</b>`:''}</div></div>`));
    const g=el('div','gallery'); g.style.marginLeft='19px'; grp[d].forEach(m=>g.append(mediaCell(m,a))); box.append(g);
  });
}
function hiddenFile(accept,cb,opts){ let inp=el('input'); inp.type='file'; inp.accept=accept; inp.style.display='none';
  if(opts&&opts.multiple!==false) inp.multiple=true;
  // No `capture` attribute → the phone shows its full picker (Photo Library,
  // Take Photo/Video, Choose File) instead of forcing a live camera shot.
  if(opts&&opts.capture) inp.capture=opts.capture;
  inp.onchange=()=>{ if(inp.files.length)cb([...inp.files]); inp.value=''; }; document.body.appendChild(inp); return inp; }
async function addMedia(animalId,files,kind){
  if(!can('addRecord')){ toast('Your role can’t upload media','bad'); return; }
  toast('Reading dates…','');
  // read each file's REAL capture date, then let the user confirm/adjust before it lands
  const entries=[];
  for(const file of files){ const g=await readCapturedDate(file); entries.push({file,date:g.date,src:g.src}); }
  openMediaDateSheet(animalId,entries,kind);
}
/* Confirm-capture-date step: shows the date we read from each file (and where it
   came from) so a wrong one — common on shared/downloaded/re-exported clips —
   can be fixed in one tap before it joins the growth timeline. */
function openMediaDateSheet(animalId,entries,kind){
  const objUrls=[];
  const note=s=> s==='photo'?'Read from the photo’s metadata'
    : s==='video'?'Read from the video’s metadata'
    : s==='file'?'From the file date — please check'
    : 'Couldn’t read a date — please set';
  const good=s=> s==='photo'||s==='video';
  const body=el('div');
  body.innerHTML=`<div class="help">${ICON.info}<span>We pull each file’s capture date from the photo or video itself. Anything shared, downloaded or re-exported can lose that — check the dates below and fix any before they land on the timeline.</span></div><div id="mdList"></div>`;
  const list=$('#mdList',body);
  entries.forEach(en=>{
    const row=el('div','card pad'); row.style.marginTop='8px';
    row.innerHTML=`<div style="display:flex;align-items:center;gap:10px">
        <div data-th style="width:46px;height:46px;border-radius:8px;background:var(--line-2) center/cover;flex:none;display:flex;align-items:center;justify-content:center;color:var(--muted)">${kind==='video'?ICON.video:''}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(en.file.name||(kind==='video'?'Video':'Photo'))}</div>
          <div style="font-size:11px;color:${good(en.src)?'var(--good)':'var(--warn)'}">${note(en.src)}</div>
        </div>
        <input class="control" type="date" data-d max="${todayISO()}" value="${en.date}" style="width:148px;flex:none">
      </div>`;
    const inp=$('[data-d]',row); inp.onchange=()=>{ en.date=inp.value||en.date; };
    if(!(en.file.type||'').startsWith('video')){ try{ const u=URL.createObjectURL(en.file); objUrls.push(u); $('[data-th]',row).style.backgroundImage=`url(${u})`; }catch(e){} }
    list.append(row);
  });
  const foot=el('div'); foot.innerHTML=`<button class="btn" data-cancel style="flex:1">Cancel</button><button class="btn primary" data-save style="flex:1">Add ${entries.length>1?entries.length+' files':'to timeline'}</button>`;
  const cleanup=()=>objUrls.forEach(u=>{try{URL.revokeObjectURL(u);}catch(e){}});
  const sh=openSheet({title:'Confirm date'+(entries.length>1?'s':''),body,foot});
  $('[data-cancel]',sh).onclick=()=>{ cleanup(); closeSheet(); };
  $('[data-save]',sh).onclick=()=>{ cleanup(); closeSheet(); commitMedia(animalId,entries,kind); };
}
async function commitMedia(animalId,entries,kind){
  toast('Uploading…','');
  for(const en of entries){ const file=en.file; const blobId=uid('blob'); await Media.put(blobId,file); await Media.upload(blobId,file);
    const cap=en.date;
    const rec=stamp({id:uid('m'),animalId,kind:kind||(file.type.startsWith('video')?'video':'photo'),blobId,size:file.size,mime:file.type,view: kind==='video'?'Walking video':'Side view',date:cap,captured:cap,by:DB.currentUserId,caption:'',shared:false});
    // capture weight+feed context
    const ws=weightsFor(animalId); rec.contextWeight=ws.length?+ws[ws.length-1].weight:null; const cf=currentFeed(animalId); rec.contextFeed=cf?cf.name:null;
    if(!getAnimal(animalId).profileMediaId && kind!=='video'){ getAnimal(animalId).profileMediaId=blobId; }
    DB.media.push(rec);
  }
  logAct('media',`Uploaded ${entries.length} ${kind}${entries.length>1?'s':''}`,animalId); milestone('first:photo','First progress photo!','Your growth timeline starts here 📸','📸'); save(); toast('Media added — dated for your timeline','good'); render();
}
/* pick a photo from the library (or camera) and set it as the animal's profile picture */
function uploadProfilePhoto(animalId){
  if(!can('addRecord')){ toast('Your role can’t change photos','bad'); return; }
  hiddenFile('image/*', async(files)=>{
    const file=files[0]; if(!file) return;
    toast('Uploading…','');
    const blobId=uid('blob'); await Media.put(blobId,file); await Media.upload(blobId,file);
    const a=getAnimal(animalId); if(!a) return;
    const ws=weightsFor(animalId); const cf=currentFeed(animalId); const cap=(await readCapturedDate(file)).date;
    DB.media.push(stamp({id:uid('m'),animalId,kind:'photo',blobId,size:file.size,mime:file.type,view:'Profile',date:cap,captured:cap,by:DB.currentUserId,caption:'',shared:false,contextWeight:ws.length?+ws[ws.length-1].weight:null,contextFeed:cf?cf.name:null}));
    a.profileMediaId=blobId; touch(a);
    logAct('media','Set profile photo',animalId); save(); toast('Profile photo updated','good'); render();
  }, {multiple:false}).click();
}
function openMediaViewer(m,a){
  const body=el('div'); body.innerHTML=`<div style="border-radius:14px;overflow:hidden;background:#000;margin-bottom:12px" id="mvMedia"></div>
    <div class="field"><label>Type / view</label><select class="control" id="mvView">${MEDIA_VIEWS.map(v=>`<option ${m.view===v?'selected':''}>${v}</option>`).join('')}</select></div>
    <div class="field"><label>Date captured</label><input class="control" type="date" id="mvDate" value="${m.captured||m.date}"></div>
    <div class="field"><label>Caption / notes</label><textarea class="control" id="mvCap">${esc(m.caption||'')}</textarea></div>
    ${m.contextWeight?`<div class="help">${ICON.info}<span>At capture: ${m.contextWeight} lb${m.contextFeed?' · on '+esc(m.contextFeed):''}</span></div>`:''}`;
  Media.url(m.blobId).then(u=>{ if(!u)return; const e=m.kind==='video'?el('video'):el('img'); e.src=u; if(m.kind==='video'){e.controls=true;} e.style.width='100%'; $('#mvMedia',body).append(e); });
  const foot=el('div'); foot.innerHTML=`<button class="btn danger" data-del>${ICON.trash}</button>${m.kind!=='video'?`<button class="btn" data-profile>${ICON.star} Set profile</button>`:''}<button class="btn primary" data-save style="flex:1">Save</button>`;
  const sh=openSheet({title:'Media',body,foot});
  $('[data-save]',sh).onclick=()=>{ m.view=$('#mvView',body).value; m.captured=$('#mvDate',body).value; m.caption=$('#mvCap',body).value.trim(); touch(m); save(); closeSheet(); toast('Saved','good'); render(); };
  if($('[data-profile]',sh))$('[data-profile]',sh).onclick=()=>{ a.profileMediaId=m.blobId; save(); closeSheet(); toast('Profile photo set','good'); render(); };
  $('[data-del]',sh).onclick=async()=>{ if(await confirmSheet('Delete media','Remove this file permanently?','Delete',true)){ await Media.del(m.blobId);
    if(Cloud.enabled && Cloud.teamId){ try{ await Cloud.sb.storage.from('media').remove([Cloud.teamId+'/'+m.blobId]); }catch(e){} }
    DB.media=DB.media.filter(x=>x.id!==m.id); if(a.profileMediaId===m.blobId)a.profileMediaId=null; save(); closeSheet(); render(); } };
}
function drawCompare(box,a,items){
  const photos=items.filter(m=>m.kind!=='video').slice().reverse();
  if(photos.length<2){ box.innerHTML='<div class="empty" style="padding:16px">Need at least two photos to compare.</div>'; return; }
  box.innerHTML=`<div class="field-row"><div class="field" style="flex:1"><label>Before</label><select class="control" id="cmpA">${photos.map((m,i)=>`<option value="${m.id}" ${i===0?'selected':''}>${fmtShort(m.captured||m.date)} · ${esc(m.view||'')}</option>`).join('')}</select></div>
    <div class="field" style="flex:1"><label>After</label><select class="control" id="cmpB">${photos.map((m,i)=>`<option value="${m.id}" ${i===photos.length-1?'selected':''}>${fmtShort(m.captured||m.date)} · ${esc(m.view||'')}</option>`).join('')}</select></div></div>
    <div class="grid g2" id="cmpImgs"></div><div class="card pad" id="cmpStats" style="margin-top:12px"></div>`;
  const paint=()=>{ const A=photos.find(m=>m.id===$('#cmpA',box).value), B=photos.find(m=>m.id===$('#cmpB',box).value);
    const ic=$('#cmpImgs',box); ic.innerHTML=''; [A,B].forEach((m,i)=>{ const c=el('div'); c.style.cssText='border-radius:12px;overflow:hidden;background:var(--line-2);aspect-ratio:3/4;position:relative';
      c.innerHTML=`<div class="tag" style="position:absolute;left:6px;top:6px;background:rgba(0,0,0,.6);color:#fff;font-size:10px;font-weight:700;padding:3px 7px;border-radius:6px;z-index:2">${i?'AFTER':'BEFORE'} · ${fmtShort(m.captured||m.date)}</div>`;
      Media.url(m.blobId).then(u=>{ if(u){const im=el('img');im.src=u;im.style.cssText='width:100%;height:100%;object-fit:cover';c.prepend(im);} }); ic.append(c); });
    const days=daysBetween(A.captured||A.date,B.captured||B.date);
    const wA=A.contextWeight!=null?+A.contextWeight:weightNear(a.id,A.captured||A.date), wB=B.contextWeight!=null?+B.contextWeight:weightNear(a.id,B.captured||B.date);
    const dw=(wA!=null&&wB!=null)?round(wB-wA,1):null; const adg=(dw!=null&&Math.abs(days)>0)?round(dw/Math.abs(days),2):null;
    $('#cmpStats',box).innerHTML=`<div style="display:flex;justify-content:space-around;text-align:center"><div><div style="font-size:11px;color:var(--muted);font-weight:700">DAYS</div><div style="font-weight:800;font-size:18px" class="tnum">${Math.abs(days)}</div></div><div><div style="font-size:11px;color:var(--muted);font-weight:700">WEIGHT Δ</div><div style="font-weight:800;font-size:18px" class="tnum">${dw!=null?(dw>0?'+':'')+dw+' lb':'—'}</div></div><div><div style="font-size:11px;color:var(--muted);font-weight:700">ADG</div><div style="font-weight:800;font-size:18px;color:var(--purple-3)" class="tnum">${adg??'—'}</div></div></div>`; };
  $('#cmpA',box).onchange=paint; $('#cmpB',box).onchange=paint; paint();
}

/* ===================================================================
   GROWTH REEL — stitch an animal's weekly photos into a timelapse video
   (canvas + MediaRecorder, fully client-side).
   =================================================================== */
function reelMimeType(){
  // Prefer webm (reliable everywhere it's supported). iOS Safari doesn't support
  // webm in MediaRecorder, so it falls through to mp4, which iOS encodes natively.
  const cands=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4;codecs=avc1.42E01E','video/mp4'];
  if(typeof MediaRecorder==='undefined'||!MediaRecorder.isTypeSupported) return '';
  return cands.find(c=>MediaRecorder.isTypeSupported(c)) || '';
}
function reelSupported(){ try{ const c=document.createElement('canvas'); return typeof MediaRecorder!=='undefined' && typeof c.captureStream==='function'; }catch(e){ return false; } }
function loadImage(url){ return new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=rej; im.src=url; }); }
function drawCover(ctx,img,W,H){ const ir=img.width/img.height, cr=W/H; let dw,dh,dx,dy; if(ir>cr){ dh=H; dw=H*ir; dx=(W-dw)/2; dy=0; } else { dw=W; dh=W/ir; dx=0; dy=(H-dh)/2; } ctx.drawImage(img,dx,dy,dw,dh); }
async function generateReel(a, items, opts, onProgress){
  const S=720; const canvas=document.createElement('canvas'); canvas.width=S; canvas.height=S; const ctx=canvas.getContext('2d');
  // preload as SAME-ORIGIN object URLs (avoid canvas taint)
  const frames=[]; for(const m of items){ const url=await Media.objectURL(m.blobId); if(url){ try{ const img=await loadImage(url); frames.push({img,m}); }catch(e){} } }
  if(frames.length<2) throw new Error('Need at least two photos.');
  const per=opts.holdMs||850, fade=Math.min(280, per*0.35), endHold=900;
  const total=frames.length*per+endHold;
  const stream=canvas.captureStream(30); const mime=reelMimeType();
  const rec=new MediaRecorder(stream, mime?{mimeType:mime, videoBitsPerSecond:4_000_000}:undefined);
  const chunks=[]; rec.ondataavailable=e=>{ if(e.data&&e.data.size) chunks.push(e.data); };
  return await new Promise((resolve,reject)=>{
    let settled=false;
    const finish=()=>{ if(settled)return; settled=true; try{stream.getTracks().forEach(t=>t.stop());}catch(e){} resolve(new Blob(chunks,{type:(mime?mime.split(';')[0]:'video/webm')})); };
    rec.onstop=finish;
    rec.onerror=e=>{ if(!settled){ settled=true; reject((e&&e.error)||new Error('record error')); } };
    const t0=performance.now();
    const watchdog=setTimeout(()=>{ try{ if(rec.state!=='inactive') rec.stop(); }catch(e){} setTimeout(finish,600); }, total+5000);
    function draw(now){
      const t=Math.min(now-t0, total);
      const idx=Math.max(0, Math.min(frames.length-1, Math.floor(t/per))); const localT=t-idx*per;
      const cur=frames[idx]; if(!cur){ if(t>=total){ clearTimeout(watchdog); try{rec.stop();}catch(e){finish();} } else requestAnimationFrame(draw); return; }
      ctx.fillStyle='#0A0D13'; ctx.fillRect(0,0,S,S);
      drawCover(ctx,cur.img,S,S);
      if(idx>0 && frames[idx-1] && localT<fade){ ctx.globalAlpha=1-(localT/fade); drawCover(ctx,frames[idx-1].img,S,S); ctx.globalAlpha=1; }
      // gradient + overlay
      const g=ctx.createLinearGradient(0,S*0.55,0,S); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.72)'); ctx.fillStyle=g; ctx.fillRect(0,S*0.55,S,S*0.45);
      // top-left brand
      ctx.fillStyle='rgba(0,0,0,.35)'; roundRect(ctx,20,20,'auto',0);
      ctx.font='700 26px -apple-system,Segoe UI,Roboto,sans-serif'; ctx.fillStyle='#fff'; ctx.textBaseline='top';
      ctx.fillText(a.name, 26, 26);
      ctx.font='600 18px -apple-system,Segoe UI,Roboto,sans-serif'; ctx.fillStyle='rgba(255,255,255,.85)';
      ctx.fillText((DB.team&&DB.team.name)||'Show Team', 26, 58);
      if(opts.labels!==false){ const m=frames[idx].m; const dd=fmtDate(m.captured||m.date);
        ctx.textBaseline='bottom'; ctx.font='800 40px -apple-system,Segoe UI,Roboto,sans-serif'; ctx.fillStyle='#fff';
        const wt=(m.contextWeight!=null)?(m.contextWeight+' lb'):''; if(wt) ctx.fillText(wt, 26, S-58);
        ctx.font='700 24px -apple-system,Segoe UI,Roboto,sans-serif'; ctx.fillStyle='rgba(255,255,255,.9)';
        ctx.fillText(dd, 26, S-26);
      }
      // progress bar
      ctx.fillStyle='rgba(255,255,255,.25)'; ctx.fillRect(0,S-6,S,6);
      ctx.fillStyle='#8B5CF6'; ctx.fillRect(0,S-6, S*(t/total), 6);
      if(onProgress) onProgress(t/total);
      if(t<total) requestAnimationFrame(draw); else { clearTimeout(watchdog); setTimeout(()=>{ try{rec.stop();}catch(e){finish();} },120); }
    }
    try{ rec.start(1000); }catch(e){ try{rec.start();}catch(e2){ reject(e2); return; } }
    requestAnimationFrame(draw);
  });
}
function roundRect(){ /* reserved for future styling */ }
function openReelSheet(animalId){
  const a=getAnimal(animalId);
  const photos=mediaFor(animalId).filter(m=>m.kind!=='video').slice().sort((x,y)=>(x.captured||x.date)<(y.captured||y.date)?-1:1);
  const views=[...new Set(photos.map(m=>m.view).filter(Boolean))];
  const body=el('div');
  let opts={ view:'', speed:'normal', labels:true };
  const draw=()=>{
    const chosen=opts.view?photos.filter(m=>m.view===opts.view):photos;
    body.innerHTML=`
      <p style="font-size:13px;color:var(--muted);margin:2px 0 12px">Turn ${a.name}'s progress photos into a shareable growth timelapse.</p>
      ${views.length>1?`<div class="field"><label>Angle</label><div class="chips" style="flex-wrap:wrap;white-space:normal"><button class="chip ${!opts.view?'active':''}" data-view="">All (${photos.length})</button>${views.map(v=>`<button class="chip ${opts.view===v?'active':''}" data-view="${esc(v)}">${esc(v)} (${photos.filter(m=>m.view===v).length})</button>`).join('')}</div><div class="hint">Tip: pick one angle (e.g. Side view) for the smoothest reel.</div></div>`:''}
      <div class="field"><label>Speed</label><div class="seg" id="reelSpeed">${[['slow','Slow'],['normal','Normal'],['fast','Fast']].map(([k,l])=>`<button class="${opts.speed===k?'on':''}" data-speed="${k}">${l}</button>`).join('')}</div></div>
      <label class="li" style="border:1px solid var(--line);border-radius:12px"><div class="main"><div class="t1" style="font-size:14px">Show date & weight labels</div></div><input type="checkbox" id="reelLabels" ${opts.labels?'checked':''} style="width:22px;height:22px"></label>
      <div class="help" style="margin-top:12px">${ICON.info}<span>${chosen.length} photo${chosen.length===1?'':'s'} · about ${Math.round((chosen.length*(opts.speed==='fast'?0.6:opts.speed==='slow'?1.1:0.85))+0.9)}s. It records in real time, so hang tight while it builds.</span></div>
      <div id="reelOut" style="margin-top:12px"></div>`;
    $$('[data-view]',body).forEach(b=>b.onclick=()=>{ opts.view=b.dataset.view; draw(); });
    $$('[data-speed]',body).forEach(b=>b.onclick=()=>{ opts.speed=b.dataset.speed; $$('[data-speed]',body).forEach(x=>x.classList.toggle('on',x===b)); });
    $('#reelLabels',body).onchange=()=>{ opts.labels=$('#reelLabels',body).checked; };
  };
  draw();
  const foot=el('div'); foot.innerHTML=`<button class="btn primary" data-gen style="flex:1">${ICON.video} Generate reel</button>`;
  const sh=openSheet({title:'Growth reel',body,foot});
  $('[data-gen]',sh).onclick=async()=>{
    if(!reelSupported()){ toast('This browser can’t build video. Try Safari/Chrome on your phone.','bad'); return; }
    const chosen=opts.view?photos.filter(m=>m.view===opts.view):photos;
    if(chosen.length<2){ toast('Need at least two photos','bad'); return; }
    const out=$('#reelOut',body); const btn=$('[data-gen]',sh); btn.disabled=true;
    out.innerHTML=`<div class="card pad"><div style="font-weight:700;margin-bottom:8px">Building your reel…</div><div style="height:9px;background:var(--line-2);border-radius:6px;overflow:hidden"><div id="reelBar" style="height:100%;width:0;background:linear-gradient(90deg,var(--purple-3),var(--teal-3));transition:width .1s"></div></div></div>`;
    const holdMs=opts.speed==='fast'?600:opts.speed==='slow'?1100:850;
    try{
      const blob=await generateReel(a, chosen, {holdMs, labels:opts.labels}, p=>{ const bar=$('#reelBar',body); if(bar)bar.style.width=Math.round(p*100)+'%'; });
      const url=URL.createObjectURL(blob); const ext=(blob.type.includes('mp4'))?'mp4':'webm';
      const fname=(a.name||'animal').replace(/[^\w]+/g,'-')+'-growth-reel.'+ext;
      out.innerHTML=`<video src="${url}" controls playsinline style="width:100%;border-radius:14px;background:#000"></video>
        <div class="btn-row" style="margin-top:10px"><button class="btn primary" id="reelShare" style="flex:1">${ICON.share} Save / Share</button><button class="btn" id="reelDl">${ICON.download}</button></div>
        <div class="hint" style="margin-top:6px">${(blob.size/1048576).toFixed(1)} MB · ${ext.toUpperCase()}</div>`;
      const file=new File([blob], fname, {type:blob.type});
      $('#reelShare',body).onclick=async()=>{ if(navigator.canShare && navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file], title:a.name+' — growth reel'}); }catch(e){} } else { const x=el('a'); x.href=url; x.download=fname; x.click(); toast('Saved','good'); } };
      $('#reelDl',body).onclick=()=>{ const x=el('a'); x.href=url; x.download=fname; x.click(); };
      logAct('media','Created a growth reel',a.id);
      toast('Reel ready!','good');
    }catch(e){ out.innerHTML=`<div class="help" style="color:var(--bad)">${ICON.info}<span>${esc(e.message||'Could not build the reel')}</span></div>`; }
    btn.disabled=false;
  };
}

/* ===================================================================
   SHARE — public read-only animal page (cloud only; needs supabase/shares.sql)
   =================================================================== */
function shareBaseUrl(){ const dir=location.pathname.replace(/[^/]*$/,''); return location.origin+dir+'share.html#'; }
function randToken(){ return 'shr_'+Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,8); }
function buildSharePayload(a, opts){
  const st=animalStats(a);
  const p={ v:1, name:a.name, barnName:a.barnName||'', species:speciesName(a.species), breed:a.breed||'', sex:a.sex||'', status:a.status,
    curWeight:st.curW, startWeight:st.startW, adg:st.adgLife, gainTotal:st.gainTotal, targetWeight:a.targetWeight||null,
    team:{name:DB.team.name}, generatedAt:nowISO() };
  if(opts.pedigree){ p.breeder=a.breeder||''; p.sire=a.sire||''; p.dam=a.dam||''; p.sireOfDam=a.sireOfDam||''; }
  if(opts.weights){ p.weights=weightsFor(a.id).map(w=>({date:w.date,weight:+w.weight})); }
  if(opts.results){ p.results=DB.entries.filter(e=>e.animalId===a.id&&e.result&&e.result.placing).map(e=>{ const sh=DB.shows.find(s=>s.id===e.showId); return {show:sh?sh.name:'',division:e.division||'',placing:String(e.result.placing),note:e.result.divisionPlacing||e.result.bannerNote||''}; }); }
  return p;
}
async function createShare(a, opts){
  if(!Cloud.enabled || !Cloud.teamId){ toast('Connect to cloud first — sharing needs it','bad'); return null; }
  const token=randToken(); const payload=buildSharePayload(a, opts);
  // upload images to the public shares bucket at <teamId>/<token>/<blobId>
  const pub=(blobId)=>Cloud.sb.storage.from('shares').getPublicUrl(Cloud.teamId+'/'+token+'/'+blobId).data.publicUrl;
  const upload=async(blobId)=>{ try{ const bl=await Media.blob(blobId); if(!bl) return null; await Cloud.sb.storage.from('shares').upload(Cloud.teamId+'/'+token+'/'+blobId, bl, {upsert:true, contentType:bl.type||'image/jpeg'}); return pub(blobId); }catch(e){ console.error('share upload',e); return null; } };
  if(a.profileMediaId){ payload.profileUrl=await upload(a.profileMediaId); }
  if(opts.photos){ const photos=mediaFor(a.id).filter(m=>m.kind!=='video').slice(0,12); payload.photos=[];
    for(const m of photos){ const url=await upload(m.blobId); if(url) payload.photos.push({url,date:m.captured||m.date,view:m.view||''}); } }
  const row={ id:token, team_id:Cloud.teamId, animal_id:a.id, title:a.name, data:payload, revoked:false, expires_at:opts.expires||null, created_by:DB.currentUserId };
  const {error}=await Cloud.sb.from('shares').insert(row);
  if(error){ console.error(error); toast('Sharing not set up yet — run supabase/shares.sql','bad'); return null; }
  DB.shares=DB.shares||[]; DB.shares.push({id:token, animalId:a.id, title:a.name, createdAt:nowISO(), expiresAt:opts.expires||null});
  logAct('share','Created a share link for '+a.name,a.id); save();
  return shareBaseUrl()+token;
}
async function revokeShare(token){
  DB.shares=(DB.shares||[]).filter(s=>s.id!==token); save();
  if(Cloud.enabled){ try{ await Cloud.sb.from('shares').update({revoked:true}).eq('id',token); }catch(e){} }
}
function openShareSheet(animalId){
  const a=getAnimal(animalId);
  if(!Cloud.enabled){ const body=el('div'); body.innerHTML=`<div class="help">${ICON.info}<span>Public share links need cloud sync. Turn it on in <b>More → Connect to cloud</b>, then run <b>supabase/shares.sql</b> once.</span></div>`; openSheet({title:'Share',body}); return; }
  const existing=(DB.shares||[]).filter(s=>s.animalId===animalId);
  const body=el('div');
  let opts={ weights:true, photos:true, pedigree:true, results:true, expires:null };
  const row=(k,label,sub)=>`<label class="li" style="border:1px solid var(--line);border-radius:12px;margin-bottom:8px"><div class="main"><div class="t1" style="font-size:14px">${label}</div>${sub?`<div class="t2">${sub}</div>`:''}</div><input type="checkbox" data-opt="${k}" ${opts[k]?'checked':''} style="width:22px;height:22px"></label>`;
  body.innerHTML=`
    <p style="font-size:13px;color:var(--muted);margin:2px 0 12px">Create a public, view-only page for <b style="color:var(--ink)">${esc(a.name)}</b> to send to buyers, sponsors or family. You choose what's shown — health, prices, expenses and private notes are never included.</p>
    ${row('weights','Weight chart','Growth over time')}
    ${row('photos','Progress photos','Up to 12 photos')}
    ${row('pedigree','Pedigree','Breeder, sire, dam')}
    ${row('results','Show results','Placings & banners')}
    <div class="field" style="margin-top:6px"><label>Link expires</label><select class="control" id="shExp"><option value="">Never (until revoked)</option><option value="7">In 7 days</option><option value="30">In 30 days</option><option value="90">In 90 days</option></select></div>
    <div id="shOut"></div>
    ${existing.length?`<div class="section-title">Active links</div><div id="shList"></div>`:''}`;
  $$('[data-opt]',body).forEach(c=>c.onchange=()=>{ opts[c.dataset.opt]=c.checked; });
  const foot=el('div'); foot.innerHTML=`<button class="btn primary" data-make style="flex:1">${ICON.share} Create share link</button>`;
  const sh=openSheet({title:'Share '+a.name,body,foot});
  const paintList=()=>{ const lc=$('#shList',body); if(!lc)return; const list=(DB.shares||[]).filter(s=>s.animalId===animalId); lc.innerHTML='';
    list.forEach(s=>{ const li=el('div','li'); li.innerHTML=`<div class="thumb" style="color:var(--purple-3)">${ICON.share}</div><div class="main"><div class="t1" style="font-size:13.5px">${shareBaseUrl().replace('https://','').replace(location.hash,'')}${s.id.slice(0,10)}…</div><div class="t2">${s.expiresAt?'expires '+fmtShort(s.expiresAt):'never expires'}</div></div><button class="btn sm ghost" data-copy>${ICON.copy}</button><button class="iconbtn" style="background:var(--line-2);color:var(--bad)" data-rev>${ICON.trash}</button>`;
      $('[data-copy]',li).onclick=()=>{ navigator.clipboard&&navigator.clipboard.writeText(shareBaseUrl()+s.id); toast('Link copied','good'); };
      $('[data-rev]',li).onclick=async()=>{ await revokeShare(s.id); toast('Link turned off','good'); paintList(); };
      lc.append(li); }); };
  paintList();
  $('[data-make]',sh).onclick=async()=>{ const btn=$('[data-make]',sh); btn.disabled=true; const orig=btn.textContent; btn.textContent='Creating…';
    const days=$('#shExp',body).value; opts.expires = days? new Date(Date.now()+ (+days)*864e5).toISOString() : null;
    const link=await createShare(a, opts);
    btn.disabled=false; btn.textContent=orig;
    if(link){ $('#shOut',body).innerHTML=`<div class="card pad" style="background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.4);margin-top:4px"><div style="font-weight:800;margin-bottom:6px">Link ready 🎉</div><div style="font-size:12.5px;word-break:break-all;color:var(--ink-2)">${esc(link)}</div><div class="btn-row" style="margin-top:10px"><button class="btn primary" id="shCopy" style="flex:1">${ICON.copy} Copy link</button><button class="btn" id="shShare">${ICON.share}</button></div></div>`;
      $('#shCopy',body).onclick=()=>{ navigator.clipboard&&navigator.clipboard.writeText(link); toast('Copied','good'); };
      $('#shShare',body).onclick=async()=>{ if(navigator.share){ try{ await navigator.share({title:a.name+' — '+((DB.team&&DB.team.name)||'Show Team'), url:link}); }catch(e){} } else { navigator.clipboard&&navigator.clipboard.writeText(link); toast('Copied','good'); } };
      if(!$('#shList',body)){ /* add list section */ } paintList();
    }
  };
}

/* ---------- Generic record sheet ---------- */
function recordSheet({title,fields,rec,onSave,onDelete,recId}){
  const body=el('div'); const state={...rec};
  body.innerHTML=fields.map(f=>{
    if(f.type==='select') return `<div class="field"><label>${esc(f.label)}</label><select class="control" data-k="${f.k}">${(f.options||[]).map(o=>`<option ${state[f.k]===o?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`;
    if(f.type==='textarea') return `<div class="field"><label>${esc(f.label)}</label><textarea class="control" data-k="${f.k}">${esc(state[f.k]||'')}</textarea></div>`;
    if(f.type==='row') return `<div class="field-row">${f.fields.map(sf=>fieldHTML(sf,state)).join('')}</div>`;
    return fieldHTML(f,state);
  }).join('');
  function fieldHTML(f,state){ const val=state[f.k]!=null?state[f.k]:''; const t=f.type||'text';
    if(t==='select') return `<div class="field" style="flex:1"><label>${esc(f.label)}</label><select class="control" data-k="${f.k}">${f.blank?'<option value=""></option>':''}${(f.options||[]).map(o=>`<option ${state[f.k]===o?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`;
    return `<div class="field" style="flex:1"><label>${esc(f.label)}</label><input class="control" type="${t}" ${t==='number'?'inputmode="decimal"':''} data-k="${f.k}" value="${esc(val)}" placeholder="${esc(f.ph||'')}"></div>`; }
  const foot=el('div'); foot.innerHTML=`${recId&&onDelete?`<button class="btn danger" data-del>${ICON.trash}</button>`:''}<button class="btn primary" data-save style="flex:1">Save</button>`;
  const sh=openSheet({title,body,foot});
  $('[data-save]',sh).onclick=()=>{ $$('[data-k]',body).forEach(inp=>{ let v=inp.value; if(inp.type==='number')v=v===''?null:+v; state[inp.dataset.k]=v; }); onSave(state); closeSheet(); };
  if($('[data-del]',sh))$('[data-del]',sh).onclick=async()=>{ if(await confirmSheet('Delete','Remove this record?','Delete',true)){ onDelete(); closeSheet(); } };
}
function recordList(records,fmt){ if(!records.length)return null; const L=el('div','list'); records.forEach(r=>{ const {icon,t1,t2,right,onClick}=fmt(r); const li=el('div','li'); li.innerHTML=`<div class="thumb" style="color:var(--purple-3)">${icon}</div><div class="main"><div class="t1">${t1}</div><div class="t2">${t2||''}</div></div>${right?`<div class="r">${right}</div>`:ICON.chev}`; if(onClick)li.onclick=onClick; L.append(li); }); return L; }

/* ---------- MEASUREMENTS ---------- */
function tabMeasure(box,a){
  const MTYPES=['Heart girth','Flank circ.','Body length','Height','Hip width','Chest width','Top width','Cannon bone','Scrotal circ.','Body condition','Custom'];
  const recs=DB.measurements.filter(m=>m.animalId===a.id).sort((x,y)=>x.date<y.date?1:-1);
  box.innerHTML=`<button class="btn primary block" id="addM">${ICON.plus} Add measurement</button><div id="mList" style="margin-top:12px"></div>`;
  const add=(id)=>{ const rec=id?DB.measurements.find(m=>m.id===id):{type:'Heart girth',unit:'in',date:todayISO(),by:DB.currentUserId};
    recordSheet({title:id?'Edit measurement':'Measurement',recId:id,rec,fields:[{type:'row',fields:[{k:'type',type:'select',label:'Type',options:MTYPES},{k:'unit',type:'select',label:'Unit',options:['in','cm','score','lb']}]},{type:'row',fields:[{k:'value',type:'number',label:'Value'},{k:'date',type:'date',label:'Date'}]},{k:'notes',type:'textarea',label:'Notes'}],
      onSave:s=>{ if(id){Object.assign(DB.measurements.find(m=>m.id===id),s);}else{DB.measurements.push(stamp({id:uid('ms'),animalId:a.id,...s}));} logAct('measure',s.type+' '+s.value,a.id); save(); toast('Saved','good'); render(); },
      onDelete:()=>{DB.measurements=DB.measurements.filter(m=>m.id!==id);save();render();} }); };
  $('#addM',box).onclick=()=>add();
  const lc=$('#mList',box);
  if(!recs.length){ lc.innerHTML=emptyState(ICON.ruler,'No measurements','Track heart girth, height and more to chart structural growth.'); return; }
  // group by type for latest + chart
  const byType={}; recs.forEach(r=>(byType[r.type]=byType[r.type]||[]).push(r));
  Object.keys(byType).forEach(t=>{ const arr=byType[t].slice().reverse(); lc.append(htmlToFrag(`<div class="section-title" style="margin-top:8px">${esc(t)}</div>`));
    const card=el('div','card pad'); card.innerHTML=lineChart([{color:'var(--purple-3)',data:arr.map(r=>({x:r.date,y:+r.value}))}],{h:120}); lc.append(card); });
  const L=recordList(recs,r=>({icon:ICON.ruler,t1:`${r.type}: ${r.value} ${r.unit||''}`,t2:fmtDate(r.date)+(r.notes?' · '+r.notes:''),onClick:()=>add(r.id)})); lc.append(L);
}

/* ---------- HEALTH ---------- */
function tabHealth(box,a){
  const HTYPES=['General observation','Illness','Injury','Treatment','Vaccination','Deworming','Hoof trimming','Dental care','Veterinary visit','Temperature','Medication','Withdrawal','Recovery','Other'];
  const recs=DB.health.filter(h=>h.animalId===a.id).sort((x,y)=>x.date<y.date?1:-1);
  box.innerHTML=`<button class="btn primary block" id="addH">${ICON.plus} Add health record</button>
    <div class="help" style="margin-top:12px">${ICON.info}<span>This log documents what you or your vet decided. It never suggests medications or dosages.</span></div>
    <div id="hList" style="margin-top:12px"></div>`;
  const add=(id)=>{ const rec=id?DB.health.find(h=>h.id===id):{type:'Treatment',date:todayISO(),by:DB.currentUserId};
    recordSheet({title:id?'Edit health record':'Health record',recId:id,rec,fields:[
      {type:'row',fields:[{k:'type',type:'select',label:'Type',options:HTYPES},{k:'date',type:'date',label:'Date'}]},
      {k:'symptoms',label:'Symptoms / reason',ph:'e.g. lameness, off feed'},
      {k:'treatment',label:'Treatment / product',ph:'What was given/done'},
      {type:'row',fields:[{k:'dosage',label:'Dosage',ph:'as directed'},{k:'route',type:'select',label:'Route',blank:true,options:['Oral','SubQ','IM','IV','Topical','Intranasal']}]},
      {type:'row',fields:[{k:'vet',label:'Vet / by',ph:''},{k:'withdrawal',type:'date',label:'Withdrawal ends'}]},
      {k:'followup',type:'date',label:'Follow-up date'},
      {k:'notes',type:'textarea',label:'Notes'}],
      onSave:s=>{ if(id){Object.assign(DB.health.find(h=>h.id===id),s);}else{DB.health.push(stamp({id:uid('h'),animalId:a.id,...s}));} if(s.followup)DB.tasks.push(stamp({id:uid('t'),title:`Health follow-up: ${a.name}`,animalId:a.id,date:s.followup,done:false,priority:'High'})); logAct('health',s.type,a.id); save(); toast('Saved','good'); render(); },
      onDelete:()=>{DB.health=DB.health.filter(h=>h.id!==id);save();render();} }); };
  $('#addH',box).onclick=()=>add();
  const lc=$('#hList',box);
  if(!recs.length){ lc.innerHTML=emptyState(ICON.health,'No health records','Log treatments, vaccinations and vet visits with withdrawal tracking.'); return; }
  const L=recordList(recs,r=>({icon:ICON.health,t1:esc(r.type)+(r.treatment?': '+esc(r.treatment):''),t2:fmtDate(r.date)+(r.withdrawal?` · withdrawal ends ${fmtShort(r.withdrawal)}`:''),right:r.withdrawal&&r.withdrawal>=todayISO()?'<span class="pill warn" style="font-size:10px">WD</span>':'',onClick:()=>add(r.id)})); lc.append(L);
}

/* ===================================================================
   MEDICATIONS — a catalog of meds (each with a withdrawal time) plus a
   per-animal dose log. Logging a dose auto-computes the withdrawal-clear
   date and warns/blocks when a show the animal is ENTERED IN falls inside
   the window (market animals can't show during withdrawal). The app never
   suggests medications, doses, or withdrawal times — those are user-entered.
   =================================================================== */
const MED_CATS  = ['Antibiotic','Dewormer','Vaccine','Anti-inflammatory','Vitamin/Supplement','Coccidiostat','Hormone/Implant','Topical','Other'];
const MED_ROUTES= ['Oral','SubQ','IM','IV','Topical','Intranasal','In feed','In water'];
const medById = id => (DB.meds||[]).find(m=>m.id===id);
const medDosesFor = animalId => (DB.medLog||[]).filter(d=>d.animalId===animalId).sort((a,b)=>a.date<b.date?1:-1);
/* the date a dose's withdrawal clears (safe to show on/after this date) */
const doseWithdrawalEnds = d => d ? (d.withdrawalEnds || (d.withdrawalDays!=null&&d.withdrawalDays!=='' ? addDaysISO(d.date, +d.withdrawalDays) : null)) : null;
const doseInWithdrawal = (d, onISO) => { const e=doseWithdrawalEnds(d); return e ? (onISO||todayISO()) < e : false; };
/* shows this animal is entered in that start on/after a date, soonest first */
function upcomingShowsForAnimal(animalId, fromISO){ fromISO=fromISO||todayISO();
  return (DB.entries||[]).filter(e=>e.animalId===animalId).map(e=>DB.shows.find(s=>s.id===e.showId)).filter(s=>s&&s.start&&s.start>=fromISO).sort((a,b)=>a.start<b.start?-1:1); }
/* the earliest entered show that starts BEFORE a withdrawal clears (i.e. the conflict), or null */
function medShowConflict(animalId, withdrawalEnds, fromISO){ if(!withdrawalEnds)return null;
  return upcomingShowsForAnimal(animalId, fromISO||todayISO()).find(s=>s.start < withdrawalEnds) || null; }

function tabMeds(box,a){
  const doses=medDosesFor(a.id);
  const active=doses.filter(d=>doseInWithdrawal(d));
  const nextShow=upcomingShowsForAnimal(a.id)[0];
  const conflicts=active.map(d=>({d,s:medShowConflict(a.id,doseWithdrawalEnds(d))})).filter(x=>x.s);
  box.innerHTML=`<button class="btn primary block" id="addDose">${ICON.plus} Log medication</button>
    <div class="help" style="margin-top:12px">${ICON.info}<span>Track meds per animal with automatic <b>withdrawal timing</b>. Times come from your <b>Medications</b> list (More → Medications) or the label — the app never suggests meds, doses, or times.</span></div>
    <div id="medSafe" style="margin-top:12px"></div>
    <div id="medActive"></div>
    <div class="section-title">History</div>
    <div id="medHist"></div>`;
  $('#addDose',box).onclick=()=>openMedDoseSheet(a.id);
  const safe=$('#medSafe',box);
  if(conflicts.length){
    safe.innerHTML=`<div class="card pad" style="background:rgba(248,113,113,.14);border-color:rgba(248,113,113,.5)"><div style="font-weight:800;color:var(--bad);display:flex;align-items:center;gap:6px">${ICON.info} Not show-legal yet</div>
      <div style="font-size:12.5px;margin-top:5px">${conflicts.map(c=>`<b>${esc(c.d.name)}</b> clears ${fmtShort(doseWithdrawalEnds(c.d))} — after <b>${esc(c.s.name)}</b> on ${fmtShort(c.s.start)}.`).join('<br>')}</div></div>`;
  } else if(nextShow){
    safe.innerHTML=`<div class="card pad" style="background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.4)"><div style="font-weight:800;color:var(--good)">${active.length?'On track for '+esc(nextShow.name):'Clear for '+esc(nextShow.name)}</div><div style="font-size:12px;color:var(--muted);margin-top:2px">${fmtShort(nextShow.start)} · ${Math.max(0,daysBetween(todayISO(),nextShow.start))} days out</div></div>`;
  }
  const ab=$('#medActive',box);
  if(active.length){ ab.append(htmlToFrag('<div class="section-title">In withdrawal now</div>'));
    active.forEach(d=>{ const ends=doseWithdrawalEnds(d); const left=Math.max(0,daysBetween(todayISO(),ends)); const conf=medShowConflict(a.id,ends);
      ab.append(htmlToFrag(`<div class="card pad" style="margin-bottom:8px;border-left:4px solid ${conf?'var(--bad)':'var(--warn)'}">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div style="font-weight:800">${esc(d.name)}</div><span class="pill ${conf?'bad':'warn'}" style="font-size:10px">${conf?'CONFLICT':left+'d left'}</span></div>
        <div style="font-size:12.5px;color:var(--muted);margin-top:2px">Given ${fmtShort(d.date)} · clears ${fmtShort(ends)}${d.dose?' · '+esc(d.dose):''}${d.route?' · '+esc(d.route):''}</div>
        ${conf?`<div style="font-size:12px;color:var(--bad);font-weight:600;margin-top:4px">Clears after ${esc(conf.name)} (${fmtShort(conf.start)})</div>`:''}</div>`)); }); }
  const hb=$('#medHist',box);
  if(!doses.length){ hb.innerHTML=emptyState(ICON.pill,'No medications logged','Log a med and the app tracks its withdrawal window and warns if a show falls inside it.'); return; }
  const L=recordList(doses,d=>{ const ends=doseWithdrawalEnds(d); const conf=doseInWithdrawal(d)?medShowConflict(a.id,ends):null;
    return {icon:ICON.pill, t1:esc(d.name)+(d.dose?': '+esc(d.dose):''), t2:'Given '+fmtDate(d.date)+(ends?' · clears '+fmtShort(ends):''), right: doseInWithdrawal(d)?`<span class="pill ${conf?'bad':'warn'}" style="font-size:10px">${conf?'CONFLICT':'WD'}</span>`:'', onClick:()=>openMedDoseSheet(a.id,d.id)}; });
  hb.append(L);
}

function openMedDoseSheet(animalId, doseId){
  if(!can('addRecord')){ toast('Your role can’t log medications','bad'); return; }
  const a=getAnimal(animalId); const editing=!!doseId;
  const d = editing ? {...DB.medLog.find(x=>x.id===doseId)}
    : { animalId, medId:'', name:'', date:todayISO(), dose:'', route:'', notes:'', withdrawalDays:null };
  const body=el('div');
  const opts=()=> (DB.meds||[]).slice().sort((x,y)=>x.name.localeCompare(y.name)).map(m=>`<option value="${m.id}" ${d.medId===m.id?'selected':''}>${esc(m.name)}${m.withdrawalDays!=null&&m.withdrawalDays!==''?` · ${m.withdrawalDays}d`:''}</option>`).join('');
  const selHTML=()=>`<select class="control" id="mdMed"><option value="">— pick from your list —</option>${opts()}</select>`;
  body.innerHTML=`
    <div class="field"><label>Medication</label>
      <div style="display:flex;gap:8px"><div style="flex:1" id="mdMedWrap">${selHTML()}</div><button type="button" class="btn sm" id="mdNew" style="flex:none">${ICON.plus} New</button></div></div>
    <div class="field-row"><div class="field" style="flex:1"><label>Date given</label><input class="control" type="date" id="mdDate" value="${d.date}"></div>
      <div class="field" style="flex:1"><label>Withdrawal (days)</label><input class="control" type="number" inputmode="numeric" id="mdWD" value="${d.withdrawalDays??''}" placeholder="from label"></div></div>
    <div class="field-row"><div class="field" style="flex:1"><label>Dose</label><input class="control" id="mdDose" value="${esc(d.dose||'')}" placeholder="as directed"></div>
      <div class="field" style="flex:1"><label>Route</label><select class="control" id="mdRoute"><option value=""></option>${MED_ROUTES.map(r=>`<option ${d.route===r?'selected':''}>${r}</option>`).join('')}</select></div></div>
    <div id="mdCalc"></div>
    <div class="field"><label>Notes</label><textarea class="control" id="mdNotes" placeholder="lot #, who gave it, reaction">${esc(d.notes||'')}</textarea></div>`;
  const recalc=()=>{
    const date=$('#mdDate',body).value; const wdv=$('#mdWD',body).value; const wd=wdv!==''?+wdv:null;
    const ends=(wd!=null&&date)?addDaysISO(date,wd):null; const c=$('#mdCalc',body);
    if(ends==null){ c.innerHTML=''; return; }
    const clears=`Clears <b>${fmtShort(ends)}</b>${wd?` · ${wd} day${wd===1?'':'s'}`:''}`;
    const conflict=medShowConflict(animalId,ends,date);
    if(conflict){ c.innerHTML=`<div class="card pad" style="background:rgba(248,113,113,.14);border-color:rgba(248,113,113,.5)"><div style="font-weight:800;color:var(--bad);display:flex;align-items:center;gap:6px">${ICON.info} Withdrawal conflicts with a show</div>
      <div style="font-size:12.5px;margin-top:4px">${clears} — but <b>${esc(conflict.name)}</b> is <b>${fmtShort(conflict.start)}</b>. A market animal can’t show inside its withdrawal window.</div></div>`; }
    else { const next=upcomingShowsForAnimal(animalId,date)[0];
      c.innerHTML=`<div class="card pad" style="background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.4)"><div style="font-weight:800;color:var(--good)">${clears}</div>${next?`<div style="font-size:12.5px;margin-top:3px;color:var(--muted)">Clear before <b style="color:var(--ink)">${esc(next.name)}</b> on ${fmtShort(next.start)} ✓</div>`:`<div style="font-size:12px;color:var(--muted);margin-top:2px">No upcoming shows entered for ${esc(a.name)}.</div>`}</div>`; }
  };
  const wireSel=()=>{ $('#mdMed',body).onchange=()=>{ const m=medById($('#mdMed',body).value); if(m){ if(m.withdrawalDays!=null&&m.withdrawalDays!=='')$('#mdWD',body).value=m.withdrawalDays; if(m.route&&!$('#mdRoute',body).value)$('#mdRoute',body).value=m.route; } recalc(); }; };
  wireSel(); $('#mdWD',body).oninput=recalc; $('#mdDate',body).onchange=recalc;
  $('#mdNew',body).onclick=()=>openMedSheet(null,(newId)=>{ d.medId=newId; $('#mdMedWrap',body).innerHTML=selHTML(); wireSel(); const m=medById(newId); if(m){ if(m.withdrawalDays!=null&&m.withdrawalDays!=='')$('#mdWD',body).value=m.withdrawalDays; if(m.route)$('#mdRoute',body).value=m.route; } recalc(); });
  recalc();
  const foot=el('div'); foot.innerHTML=`${editing?`<button class="btn danger" data-del>${ICON.trash}</button>`:''}<button class="btn primary" data-save style="flex:1">${editing?'Save':'Log medication'}</button>`;
  const sh=openSheet({title:editing?'Edit medication log':'Log medication',body,foot});
  $('[data-save]',sh).onclick=async()=>{
    const medId=$('#mdMed',body).value||null; const med=medById(medId); const name=med?med.name:(d.name||'');
    if(!name){ toast('Pick a medication (or add one)','bad'); return; }
    const date=$('#mdDate',body).value; const wdv=$('#mdWD',body).value; const wd=wdv!==''?+wdv:null;
    const ends=(wd!=null&&date)?addDaysISO(date,wd):null;
    const conflict=ends?medShowConflict(animalId,ends,date):null;
    if(conflict){ const ok=await confirmSheet('Withdrawal conflicts with a show', `${name} won’t clear until ${fmtShort(ends)}, but ${conflict.name} is ${fmtShort(conflict.start)}. Showing a market animal inside its withdrawal window isn’t allowed. Log it anyway?`, 'Log anyway', true); if(!ok) return; }
    const data={ animalId, medId, name, date, dose:$('#mdDose',body).value.trim(), route:$('#mdRoute',body).value, withdrawalDays:wd, withdrawalEnds:ends, notes:$('#mdNotes',body).value.trim(), conflictAck:!!conflict, by:DB.currentUserId };
    if(editing){ Object.assign(DB.medLog.find(x=>x.id===doseId),data); touch(DB.medLog.find(x=>x.id===doseId)); }
    else { DB.medLog.push(stamp({id:uid('dose'),...data})); }
    logAct('health','Medication: '+name+(a?' · '+a.name:''),animalId);
    save(); closeSheet(); toast(conflict?'Logged — flagged as a show conflict':'Medication logged','good'); render();
  };
  if($('[data-del]',sh))$('[data-del]',sh).onclick=async()=>{ if(await confirmSheet('Delete','Remove this medication log?','Delete',true)){ DB.medLog=DB.medLog.filter(x=>x.id!==doseId); save(); closeSheet(); render(); } };
}

/* Catalog add/edit. onDone(id) is called after save (used by the dose sheet's "New"). */
function openMedSheet(id, onDone){
  if(!can('edit')){ toast('Your role can’t manage medications','bad'); return; }
  const rec = id ? {...medById(id)} : {name:'',category:'Antibiotic',withdrawalDays:'',route:'',notes:''};
  recordSheet({ title:id?'Edit medication':'New medication', recId:id, rec, fields:[
      {k:'name',label:'Medication name',ph:'product name'},
      {type:'row',fields:[{k:'category',type:'select',label:'Category',options:MED_CATS},{k:'withdrawalDays',type:'number',label:'Withdrawal (days)'}]},
      {k:'route',type:'select',label:'Default route',blank:true,options:MED_ROUTES},
      {k:'notes',type:'textarea',label:'Notes (label directions / source)'} ],
    onSave:s=>{ if(!s.name||!String(s.name).trim()){ toast('Name the medication','bad'); return; } s.name=String(s.name).trim();
      if(id){ Object.assign(medById(id),s); touch(medById(id)); } else { const r=stamp({id:uid('med'),...s}); DB.meds.push(r); id=r.id; }
      logAct('health','Medication list: '+s.name); save(); toast('Saved','good'); if(onDone)onDone(id); else render(); },
    onDelete: id?()=>{ DB.meds=DB.meds.filter(m=>m.id!==id); save(); render(); }:null });
}

route('medications',()=>{
  const v=setView('','more'); const wrap=el('div');
  const meds=(DB.meds||[]).slice().sort((a,b)=>a.name.localeCompare(b.name));
  wrap.innerHTML=pageHeader('Medications',null,`<button class="btn primary sm" id="addMed">${ICON.plus} Add</button>`);
  wrap.append(htmlToFrag(`<div class="help" style="margin-bottom:12px">${ICON.info}<span>Your medications and each one's <b>withdrawal time</b>. Logging a med on an animal applies its withdrawal automatically and warns if it overlaps a show that animal is entered in. The app never suggests meds, doses, or withdrawal times — enter those from the label or your vet.</span></div>`));
  if(!meds.length){ wrap.append(htmlToFrag(emptyState(ICON.pill,'No medications yet','Add the meds you use with their label withdrawal days, then log them from each animal\'s Meds tab.'))); }
  else { const L=el('div','list'); meds.forEach(m=>{ const used=(DB.medLog||[]).filter(d=>d.medId===m.id).length; const li=el('div','li');
    li.innerHTML=`<div class="thumb" style="background:var(--line-2);color:var(--purple)">${ICON.pill}</div><div class="main"><div class="t1">${esc(m.name)}</div><div class="t2">${esc(m.category||'')}${m.withdrawalDays!=null&&m.withdrawalDays!==''?' · '+m.withdrawalDays+'-day withdrawal':' · no withdrawal set'}${used?' · used '+used+'×':''}</div></div>${ICON.chev}`;
    li.onclick=()=>openMedSheet(m.id); L.append(li); }); wrap.append(L); }
  v.append(wrap);
  $('#addMed',wrap).onclick=()=>openMedSheet();
});

/* ---------- EXERCISE ---------- */
function tabExercise(box,a){
  const XT=['Walking','Treadmill','Track work','Driving','Showmanship practice','Free exercise','Hill work','Brace training','Rinsing/washing','Other'];
  const recs=DB.exercise.filter(x=>x.animalId===a.id).sort((x,y)=>x.date<y.date?1:-1);
  const wk=recs.filter(r=>daysBetween(r.date,todayISO())<7);
  box.innerHTML=`<button class="btn primary block" id="addX">${ICON.plus} Log exercise</button>
    ${recs.length?`<div class="grid g2" style="margin-top:12px"><div class="stat"><div class="k">This week</div><div class="v tnum">${wk.length}</div><div class="sub">sessions</div></div><div class="stat"><div class="k">Total min (7d)</div><div class="v tnum">${wk.reduce((s,r)=>s+(+r.duration||0),0)}</div></div></div>`:''}
    <div id="xList" style="margin-top:12px"></div>`;
  const add=(id)=>{ const rec=id?DB.exercise.find(x=>x.id===id):{type:'Walking',date:todayISO(),by:DB.currentUserId};
    recordSheet({title:id?'Edit exercise':'Exercise',recId:id,rec,fields:[
      {type:'row',fields:[{k:'type',type:'select',label:'Type',options:XT},{k:'date',type:'date',label:'Date'}]},
      {type:'row',fields:[{k:'duration',type:'number',label:'Duration (min)'},{k:'intensity',type:'select',label:'Intensity',blank:true,options:['Light','Moderate','Hard']}]},
      {type:'row',fields:[{k:'attitude',label:'Attitude',ph:'fresh, tired…'},{k:'surface',label:'Surface',ph:''}]},
      {k:'notes',type:'textarea',label:'Notes'}],
      onSave:s=>{ if(id){Object.assign(DB.exercise.find(x=>x.id===id),s);}else{DB.exercise.push(stamp({id:uid('x'),animalId:a.id,...s}));} logAct('exercise',s.type,a.id); save(); toast('Saved','good'); render(); },
      onDelete:()=>{DB.exercise=DB.exercise.filter(x=>x.id!==id);save();render();} }); };
  $('#addX',box).onclick=()=>add();
  const lc=$('#xList',box);
  if(!recs.length){ lc.innerHTML=emptyState(ICON.run,'No exercise logged','Track walking, brace work and showmanship practice.'); return; }
  const L=recordList(recs,r=>({icon:ICON.run,t1:esc(r.type),t2:fmtDate(r.date)+(r.duration?` · ${r.duration} min`:'')+(r.intensity?' · '+r.intensity:''),onClick:()=>add(r.id)})); lc.append(L);
}

/* ---------- SHOWS (per animal) ---------- */
function tabShows(box,a){
  const ent=DB.entries.filter(e=>e.animalId===a.id);
  box.innerHTML=`<button class="btn primary block" id="addEnt">${ICON.plus} Enter in a show</button><div id="eList" style="margin-top:12px"></div>`;
  $('#addEnt',box).onclick=()=>openEntrySheet(a.id);
  const lc=$('#eList',box);
  if(!ent.length){ lc.innerHTML=emptyState(ICON.shows,'No show entries','Assign this animal to a show to track classes, results and premiums.'); return; }
  ent.forEach(e=>{ const sh=DB.shows.find(s=>s.id===e.showId); const r=e.result||{}; const card=el('div','card pad'); card.style.marginBottom='10px';
    card.innerHTML=`<div style="display:flex;justify-content:space-between"><div style="font-weight:800">${esc(sh?sh.name:'Show')}</div><div style="font-size:12px;color:var(--muted)">${sh?fmtShort(sh.start):''}</div></div>
      <div style="font-size:13px;color:var(--muted);margin-top:2px">${esc(e.division||'')}${e.cls?' · '+esc(e.cls):''}${e.showWeight?' · '+e.showWeight+' lb':''}</div>
      ${r.placing?`<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><span class="pill p">Placed ${esc(r.placing)}${r.inClass?'/'+r.inClass:''}</span>${r.divisionPlacing?`<span class="pill good">${esc(r.divisionPlacing)}</span>`:''}${r.bannerNote?`<span class="pill t">${esc(r.bannerNote)}</span>`:''}${r.salePrice?`<span class="pill gray">${money(r.salePrice)}</span>`:''}</div>`:'<div style="margin-top:8px"><span class="pill warn" style="font-size:10px">No result yet</span></div>'}`;
    const bar=el('div','btn-row'); bar.style.marginTop='8px'; bar.innerHTML=`<button class="btn sm ghost" data-res>${ICON.star} Result</button><button class="btn sm ghost" data-edit>${ICON.edit} Edit</button>`;
    $('[data-res]',bar).onclick=()=>openResultSheet(e.id); $('[data-edit]',bar).onclick=()=>openEntrySheet(a.id,e.id); card.append(bar); lc.append(card); });
}

/* ---------- PEDIGREE ---------- */
/* ---------- CARE / LAYOVER TAB ---------- */
function tabCare(box,a){
  const items=careForAnimal(a.id);
  const al=activeLayover();
  box.innerHTML=`
    <div class="help">${ICON.info}<span>Log the breeder's time-specific directions during a layover — water, snack, feed, supplements, washing and more. Every entry is timestamped so you build a routine to review and repeat.</span></div>
    <div class="btn-row" style="margin-top:12px"><button class="btn primary" id="careLog" style="flex:1">${ICON.plus} Log care</button><button class="btn" id="careOpen">${ICON.layover} Layovers</button></div>
    <div id="careList" style="margin-top:12px"></div>`;
  $('#careOpen',box).onclick=()=>go('/layovers');
  $('#careLog',box).onclick=()=>{ const lay=(DB.layovers||[]).filter(l=>(l.animalIds||[]).includes(a.id)).sort((x,y)=>x.start<y.start?1:-1)[0]||al;
    openCareSheet({layoverId:lay?lay.id:null, animalId:a.id, date:todayISO(), markDone:true}); };
  const lc=$('#careList',box);
  if(!items.length){ lc.innerHTML=emptyState(ICON.layover,'No care logged yet','When this animal is on layover, log each direction the breeder gives.'); return; }
  // group by layover, then by date
  const byLay={}; items.forEach(c=>{ const k=c.layoverId||'_'; (byLay[k]=byLay[k]||[]).push(c); });
  const order=Object.keys(byLay).sort((x,y)=>{ const lx=getLayover(x), ly=getLayover(y); return (lx?lx.start:'')<(ly?ly.start:'')?1:-1; });
  order.forEach(k=>{ const lay=getLayover(k); const list=byLay[k];
    lc.append(htmlToFrag(`<div class="section-title">${lay?esc(lay.name):'Care log'} <button class="more" ${lay?`onclick="go('/layover/${lay.id}')"`:''}>${lay?'Open':''}</button></div>`));
    const byDate={}; list.forEach(c=>(byDate[c.date]=byDate[c.date]||[]).push(c));
    Object.keys(byDate).sort().reverse().forEach(d=>{ lc.append(htmlToFrag(`<div style="font-size:12px;font-weight:700;color:var(--muted);margin:8px 2px 2px">${fmtDate(d)} · ${relDays(d)}</div>`)); lc.append(careTimeline(byDate[d])); });
  });
}
function tabPedigree(box,a){
  const kids=DB.animals.filter(x=>x.sireLink===a.id||x.damLink===a.id);
  box.innerHTML=`<div class="card pad">
    <div style="font-weight:800;margin-bottom:10px">Lineage</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div style="background:var(--line-2);border-radius:12px;padding:11px"><div style="font-size:11px;color:var(--muted);font-weight:800;text-transform:uppercase">Sire</div><div style="font-weight:700;margin-top:2px">${esc(a.sire||'—')}</div></div>
      <div style="background:var(--line-2);border-radius:12px;padding:11px"><div style="font-size:11px;color:var(--muted);font-weight:800;text-transform:uppercase">Dam</div><div style="font-weight:700;margin-top:2px">${esc(a.dam||'—')}</div></div>
      <div style="background:var(--line-2);border-radius:12px;padding:11px"><div style="font-size:11px;color:var(--muted);font-weight:800;text-transform:uppercase">Sire of dam</div><div style="font-weight:700;margin-top:2px">${esc(a.sireOfDam||'—')}</div></div>
      <div style="background:var(--line-2);border-radius:12px;padding:11px"><div style="font-size:11px;color:var(--muted);font-weight:800;text-transform:uppercase">Breeder</div><div style="font-weight:700;margin-top:2px">${esc(a.breeder||'—')}</div></div>
    </div>
    <button class="btn sm block" id="edPed" style="margin-top:12px">${ICON.edit} Edit pedigree</button>
  </div>
  ${a.marketBreeding==='Breeding'?`<div class="section-title">Breeding records</div><div class="card pad"><button class="btn sm block" id="addBreed">${ICON.plus} Add breeding record</button></div>`:''}
  <div class="section-title">Related animals in app</div><div id="relList"></div>`;
  $('#edPed',box).onclick=()=>{ recordSheet({title:'Pedigree',rec:{...a},fields:[{k:'sire',label:'Sire'},{k:'dam',label:'Dam'},{k:'sireOfDam',label:'Sire of dam'},{k:'breeder',label:'Breeder'},{k:'geneticNotes',type:'textarea',label:'Genetic notes'}],
    onSave:s=>{ Object.assign(a,{sire:s.sire,dam:s.dam,sireOfDam:s.sireOfDam,breeder:s.breeder,geneticNotes:s.geneticNotes}); touch(a); logAct('edit','Updated pedigree',a.id); save(); toast('Saved','good'); render(); } }); };
  const rl=$('#relList',box);
  if(kids.length){ rl.append(recordList(kids,k=>({icon:ICON.dna,t1:esc(k.name),t2:'Offspring · '+esc(k.breed),onClick:()=>go('/animal/'+k.id)}))); }
  else rl.innerHTML='<div class="empty" style="padding:14px">No linked relatives yet.</div>';
}

/* ---------- EXPENSES (per animal) ---------- */
function tabExpenses(box,a){
  const exp=DB.expenses.filter(e=>e.animalId===a.id).sort((x,y)=>x.date<y.date?1:-1);
  const inc=DB.income.filter(e=>e.animalId===a.id);
  const manual=exp.reduce((s,e)=>s+(+e.amount||0),0); const incTotal=inc.reduce((s,e)=>s+(+e.amount||0),0);
  const fb=animalFeedBedding(a.id); const total=manual+fb.feed+fb.bedding;
  const st=animalStats(a); const cog=st.gainTotal>0?total/st.gainTotal:null;
  box.innerHTML=`<div class="grid g2"><div class="stat"><div class="k">Invested</div><div class="v tnum" style="font-size:22px">${money(total)}</div></div><div class="stat"><div class="k">Net</div><div class="v tnum" style="font-size:22px;color:${incTotal-total>=0?'var(--good)':'var(--ink)'}">${money(incTotal-total)}</div><div class="sub">${incTotal?money(incTotal)+' income':''}</div></div></div>
    ${(fb.feed>0||fb.bedding>0)?`<div class="card pad" style="margin-top:10px"><div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:8px">Cost breakdown</div>
      ${fb.feed>0?`<div class="kv"><span class="k">Feed (from rations)</span><span class="v tnum">${money(fb.feed)}</span></div>`:''}
      ${fb.bedding>0?`<div class="kv"><span class="k">Bedding (attributed)</span><span class="v tnum">${money(fb.bedding)}</span></div>`:''}
      ${manual>0?`<div class="kv"><span class="k">Logged expenses</span><span class="v tnum">${money(manual)}</span></div>`:''}
      <div class="kv" style="border-top:1px solid var(--line);margin-top:2px;padding-top:8px"><span class="k" style="font-weight:800;color:var(--ink)">Total invested</span><span class="v tnum" style="font-weight:800">${money(total)}</span></div></div>`:''}
    ${cog?`<div class="help" style="margin-top:10px">${ICON.info}<span>Cost of gain: <b>${money(cog)}/lb</b> over ${st.gainTotal} lb gained${fb.feed>0?' · feed alone '+money(st.gainTotal>0?fb.feed/st.gainTotal:0)+'/lb':''}</span></div>`:''}
    <div class="help" style="margin-top:10px">${ICON.info}<span>Feed &amp; bedding cost auto-fill from your <b>bulk purchases</b> and rations — set them up in <b>More → Feed &amp; bedding costs</b>. No need to log feed as an expense here.</span></div>
    <div class="btn-row" style="margin-top:12px"><button class="btn primary" id="addExp" style="flex:1">${ICON.plus} Expense</button><button class="btn teal" id="addInc" style="flex:1">${ICON.money} Income</button></div>
    <div id="exList" style="margin-top:12px"></div>`;
  $('#addExp',box).onclick=()=>openExpenseSheet(a.id); $('#addInc',box).onclick=()=>openIncomeSheet(a.id);
  const lc=$('#exList',box);
  const rows=[...exp.map(e=>({...e,_inc:false})),...inc.map(e=>({...e,_inc:true}))].sort((x,y)=>x.date<y.date?1:-1);
  if(!rows.length){ lc.innerHTML=emptyState(ICON.money,'No expenses yet','Track purchase, feed, vet and show costs to see cost of gain.'); return; }
  const L=recordList(rows,r=>({icon:ICON.money,t1:esc(r._inc?(r.source||'Income'):r.category),t2:fmtDate(r.date)+(r.vendor?' · '+esc(r.vendor):''),right:`<b style="color:${r._inc?'var(--good)':'var(--ink)'}" class="tnum">${r._inc?'+':''}${money(r.amount)}</b>`,onClick:()=> r._inc?openIncomeSheet(a.id,r.id):openExpenseSheet(a.id,r.id)})); lc.append(L);
}
function openExpenseSheet(animalId,id){ const rec=id?DB.expenses.find(e=>e.id===id):{category:'Feed',date:todayISO(),animalId};
  recordSheet({title:id?'Edit expense':'Expense',recId:id,rec,fields:[{type:'row',fields:[{k:'category',type:'select',label:'Category',options:EXP_CATS},{k:'amount',type:'number',label:'Amount'}]},{type:'row',fields:[{k:'date',type:'date',label:'Date'},{k:'vendor',label:'Vendor'}]},{k:'notes',type:'textarea',label:'Notes'}],
    onSave:s=>{ if(id){Object.assign(DB.expenses.find(e=>e.id===id),s);}else{DB.expenses.push(stamp({id:uid('ex'),animalId,...s}));} logAct('expense',s.category+' '+money(s.amount),animalId); save(); toast('Saved','good'); render(); },
    onDelete:()=>{DB.expenses=DB.expenses.filter(e=>e.id!==id);save();render();} }); }
function openIncomeSheet(animalId,id){ const rec=id?DB.income.find(e=>e.id===id):{source:'Sale proceeds',date:todayISO(),animalId};
  recordSheet({title:id?'Edit income':'Income',recId:id,rec,fields:[{type:'row',fields:[{k:'source',type:'select',label:'Source',options:['Sale proceeds','Premium','Add-on money','Sponsorship','Breeding income','Other']},{k:'amount',type:'number',label:'Amount'}]},{k:'date',type:'date',label:'Date'},{k:'notes',type:'textarea',label:'Notes'}],
    onSave:s=>{ if(id){Object.assign(DB.income.find(e=>e.id===id),s);}else{DB.income.push(stamp({id:uid('in'),animalId,...s}));} save(); toast('Saved','good'); render(); },
    onDelete:()=>{DB.income=DB.income.filter(e=>e.id!==id);save();render();} }); }

/* ---------- NOTES ---------- */
function tabNotes(box,a){
  const notes=DB.notes.filter(n=>n.animalId===a.id).sort((x,y)=>{ if(!!y.pinned-!!x.pinned)return !!y.pinned-!!x.pinned; return x.date<y.date?1:-1; });
  box.innerHTML=`<button class="btn primary block" id="addN">${ICON.plus} Add note</button><div id="nList" style="margin-top:12px"></div>`;
  $('#addN',box).onclick=()=>openNoteSheet(a.id);
  const lc=$('#nList',box);
  if(!notes.length){ lc.innerHTML=emptyState(ICON.note,'No notes yet','Capture feedback, structure, movement and family discussion here.'); return; }
  notes.forEach(n=>{ const card=el('div','card pad'); card.style.marginBottom='10px'; const advisor=DB.users.find(u=>u.id===n.by&&u.role==='Advisor');
    card.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span class="pill ${advisor?'p':'gray'}" style="font-size:10px">${esc(n.type)}${advisor?' · Advisor':''}</span><span style="font-size:11px;color:var(--muted)">${n.pinned?'📌 ':''}${fmtDate(n.date)}</span></div>
      <div style="font-size:14px;line-height:1.5">${esc(n.text)}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:8px">${esc(userName(n.by))}</div>`;
    card.onclick=()=>openNoteSheet(a.id,n.id); lc.append(card); });
}
function openNoteSheet(animalId,id){ const rec=id?DB.notes.find(n=>n.id===id):{type:'General',date:todayISO(),by:DB.currentUserId,text:'',pinned:false};
  const body=el('div'); const state={...rec};
  body.innerHTML=`<div class="field"><label>Type</label><select class="control" id="ntType">${NOTE_TYPES.map(t=>`<option ${state.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
    <div class="field"><label>Note</label><textarea class="control" id="ntText" style="min-height:120px" placeholder="What did you observe?">${esc(state.text)}</textarea></div>
    <label style="display:flex;align-items:center;gap:10px;font-weight:700;font-size:14px"><input type="checkbox" id="ntPin" ${state.pinned?'checked':''} style="width:20px;height:20px"> Pin this note</label>`;
  const foot=el('div'); foot.innerHTML=`${id?`<button class="btn danger" data-del>${ICON.trash}</button>`:''}<button class="btn primary" data-save style="flex:1">Save note</button>`;
  const sh=openSheet({title:id?'Edit note':'New note',body,foot});
  $('[data-save]',sh).onclick=()=>{ const t=$('#ntText',body).value.trim(); if(!t){toast('Write something','bad');return;} const data={type:$('#ntType',body).value,text:t,pinned:$('#ntPin',body).checked};
    if(id){Object.assign(DB.notes.find(n=>n.id===id),data);}else{DB.notes.push(stamp({id:uid('n'),animalId,date:todayISO(),by:DB.currentUserId,...data}));} logAct('note',data.type+' note',animalId); save(); closeSheet(); toast('Note saved','good'); render(); };
  if($('[data-del]',sh))$('[data-del]',sh).onclick=async()=>{ if(await confirmSheet('Delete note','Remove this note?','Delete',true)){DB.notes=DB.notes.filter(n=>n.id!==id);save();closeSheet();render();} };
}

/* ---------- ACTIVITY / HISTORY ---------- */
function tabActivity(box,a){
  const acts=DB.activity.filter(ac=>ac.animalId===a.id);
  box.innerHTML=`<div class="section-title" style="margin-top:0">Full timeline</div><div class="card pad" id="tl"></div>
    <div class="section-title">Audit log</div><div id="al"></div>
    ${!a.archived?`<div style="margin-top:20px"><button class="btn block danger" id="archBtn">${ICON.archive} Archive ${esc(a.name)}</button></div>`:`<div style="margin-top:20px"><button class="btn block teal" id="restoreBtn">${ICON.restore} Restore ${esc(a.name)}</button></div>`}`;
  renderTimeline($('#tl',box),a);
  const al=$('#al',box); al.append(acts.length?activityList(acts):htmlToFrag('<div class="empty" style="padding:14px">No logged changes.</div>'));
  if($('#archBtn',box))$('#archBtn',box).onclick=()=>openArchiveSheet(a.id);
  if($('#restoreBtn',box))$('#restoreBtn',box).onclick=async()=>{ if(await confirmSheet('Restore animal',`Return ${a.name} to active animals?`,'Restore')){ a.archived=false; a.status=a.prevStatus||'Active'; touch(a); logAct('restore','Restored '+a.name,a.id); save(); toast('Restored','good'); render(); } };
}

/* ===================================================================
   QUICK BARN ADD
   =================================================================== */
function openQuickAdd(){
  const body=el('div');
  const acts=[['Add weight',ICON.weight,'var(--purple-3)','weight'],['Log care',ICON.layover,'#38BDF8','care'],['Upload photo',ICON.camera,'var(--info)','photo'],['Upload video',ICON.video,'var(--teal-3)','video'],['Change feed',ICON.feed,'var(--teal-3)','feed'],['Health record',ICON.health,'var(--bad)','health'],['Log exercise',ICON.run,'var(--warn)','exercise'],['Add note',ICON.note,'var(--muted)','note'],['New event',ICON.cal,'#60A5FA','event'],['New animal',ICON.animals,'var(--purple)','animal'],['New task',ICON.check,'var(--good)','task']];
  const recent=(DB._recentAnimals||[]).map(getAnimal).filter(Boolean).slice(0,6);
  const active=activeAnimals();
  body.innerHTML=`<div class="grid g3" style="gap:10px">${acts.map(([l,ic,c,k])=>`<button class="card" data-act="${k}" style="padding:14px 8px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center"><span style="width:30px;height:30px;color:${c}">${ic}</span><span style="font-size:12px;font-weight:700;line-height:1.2">${l}</span></button>`).join('')}</div>
    <div id="qaAnimals" style="display:none;margin-top:16px"></div>`;
  const sh=openSheet({title:'Quick add',body});
  let pending=null;
  const pickAnimal=(kind)=>{ pending=kind; const box=$('#qaAnimals',body); box.style.display='block';
    box.innerHTML=`<div class="section-title" style="margin-top:0">Pick an animal</div><div style="position:relative;margin-bottom:8px"><span style="position:absolute;left:12px;top:13px;color:var(--muted)">${ICON.search}</span><input class="control" id="qaSearch" placeholder="Search…" style="padding-left:40px"></div><div id="qaList"></div>`;
    const paint=(q='')=>{ const list=active.filter(a=>a.name.toLowerCase().includes(q.toLowerCase())).slice(0,30); const L=el('div','list');
      list.forEach(a=>{ const li=animalRow(a,''); li.onclick=()=>{ closeSheet(); runQuick(kind,a.id); }; L.append(li); }); $('#qaList',box).innerHTML=''; $('#qaList',box).append(L); };
    paint(); $('#qaSearch',box).oninput=e=>paint(e.target.value); $('#qaSearch',box).focus();
  };
  $$('[data-act]',body).forEach(b=>b.onclick=()=>{ const k=b.dataset.act;
    if(k==='animal'){ closeSheet(); openAnimalForm(); }
    else if(k==='task'){ closeSheet(); openTaskSheet(); }
    else if(k==='event'){ closeSheet(); openEventSheet(null, todayISO()); }
    else pickAnimal(k); });
}
function runQuick(kind,id){ DB._recentAnimals=[id,...(DB._recentAnimals||[]).filter(x=>x!==id)].slice(0,8); save();
  if(kind==='weight')openWeightSheet(id);
  else if(kind==='feed')openFeedSheet(id);
  else if(kind==='note')openNoteSheet(id);
  else if(kind==='photo'){ hiddenFile('image/*',f=>addMedia(id,f,'photo')).click(); }
  else if(kind==='video'){ hiddenFile('video/*',f=>addMedia(id,f,'video')).click(); }
  else if(kind==='health'){ go('/animal/'+id+'/health'); setTimeout(()=>$('#addH')&&$('#addH').click(),120); }
  else if(kind==='exercise'){ go('/animal/'+id+'/exercise'); setTimeout(()=>$('#addX')&&$('#addX').click(),120); }
  else if(kind==='care'){ const lay=(DB.layovers||[]).filter(l=>(l.animalIds||[]).includes(id)).sort((x,y)=>x.start<y.start?1:-1)[0]||activeLayover(); openCareSheet({layoverId:lay?lay.id:null, animalId:id, date:todayISO(), markDone:true}); }
}

/* ===================================================================
   GLOBAL SEARCH
   =================================================================== */
function openSearch(){
  const body=el('div');
  body.innerHTML=`<div style="position:relative"><span style="position:absolute;left:12px;top:13px;color:var(--muted)">${ICON.search}</span><input class="control" id="gSearch" placeholder="Search animals, tags, breeders…" style="padding-left:40px" autofocus></div><div id="gRes" style="margin-top:12px"></div>`;
  const sh=openSheet({title:'Search',body});
  const paint=(q)=>{ const box=$('#gRes',body); if(!q){box.innerHTML='<div class="empty" style="padding:20px">Type to search your string.</div>';return;}
    const s=q.toLowerCase(); const res=DB.animals.filter(a=>[a.name,a.barnName,a.earTag,a.earNotch,a.registration,a.breeder,a.sire,a.dam,a.breed,a.status].some(f=>(f||'').toLowerCase().includes(s)));
    if(!res.length){box.innerHTML='<div class="empty" style="padding:20px">No matches.</div>';return;}
    box.innerHTML=''; const L=el('div','list'); res.slice(0,30).forEach(a=>{ const li=animalRow(a,a.archived?'<span class="pill gray" style="font-size:10px">Archived</span>':''); li.onclick=()=>{closeSheet(true);go('/animal/'+a.id);}; L.append(li); }); box.append(L);
  };
  $('#gSearch',body).oninput=e=>paint(e.target.value.trim()); paint('');
}

/* ===================================================================
   ALERTS / NOTIFICATIONS
   =================================================================== */
function collectAlerts(){
  const out=[];
  activeAnimals().forEach(a=>activeWeightAlerts(a).forEach(al=>{ if(al.k!=='info')out.push({animal:a,...al}); }));
  DB.tasks.filter(t=>!t.done&&t.date<todayISO()).forEach(t=>out.push({k:'warn',t:'Task overdue: '+t.title,taskId:t.id}));
  DB.shows.filter(s=>s.entryDeadline&&s.entryDeadline>=todayISO()&&daysBetween(todayISO(),s.entryDeadline)<=7).forEach(s=>out.push({k:'info',t:'Entry deadline soon: '+s.name}));
  DB.health.filter(h=>h.withdrawal&&h.withdrawal>=todayISO()).forEach(h=>{ const a=getAnimal(h.animalId); out.push({k:'warn',t:`${a?a.name:''} withdrawal ends ${fmtShort(h.withdrawal)}`,animal:a}); });
  (DB.medLog||[]).filter(d=>doseInWithdrawal(d)).forEach(d=>{ const a=getAnimal(d.animalId); const ends=doseWithdrawalEnds(d); const conf=medShowConflict(d.animalId,ends);
    out.push({k:conf?'warn':'info', t: conf?`${a?a.name:''}: ${d.name} clears ${fmtShort(ends)} — after ${conf.name} (${fmtShort(conf.start)})`:`${a?a.name:''}: ${d.name} withdrawal clears ${fmtShort(ends)}`, animal:a}); });
  DB.recs.filter(r=>r.status==='pending').forEach(r=>{ const a=getAnimal(r.animalId); out.push({k:'p',t:`Advisor rec for ${a?a.name:''}`,animal:a}); });
  return out;
}
function openAlerts(){
  const alerts=collectAlerts(); const body=el('div');
  if(!alerts.length){ body.innerHTML='<div class="empty" style="padding:24px">'+ICON.check+'<div class="h">All clear</div><div class="p">No alerts right now.</div></div>'; }
  else { const L=el('div','list'); alerts.forEach(al=>{ const li=el('div','li');
    li.innerHTML=`<div class="dot" style="background:var(--${al.k==='bad'?'bad':al.k==='warn'?'warn':al.k==='p'?'purple-3':'info'})"></div><div class="main"><div class="t1" style="font-size:13.5px;font-weight:600">${esc(al.t)}</div>${al.animal?`<div class="t2">${esc(al.animal.name)}</div>`:''}</div>${al.animal?ICON.chev:''}`;
    if(al.animal)li.onclick=()=>{ if(al.type && ['stale','under','over','adgdrop'].includes(al.type)){ closeSheet(); openAlertReview(al.animal.id, al.type); } else { closeSheet(); go('/animal/'+al.animal.id); } }; L.append(li); }); body.append(L); }
  openSheet({title:`Alerts${alerts.length?' · '+alerts.length:''}`,body});
}

/* ===================================================================
   ARCHIVE sheet
   =================================================================== */
function openArchiveSheet(id){
  if(!can('archive')){ toast('Only Owner/Admin can archive','bad'); return; }
  const a=getAnimal(id); const st=animalStats(a);
  recordSheet({title:'Archive '+a.name, rec:{finalStatus:'Sold',reason:'',finalWeight:st.curW,buyer:'',salePrice:'',destination:'',date:todayISO()},
    fields:[{type:'row',fields:[{k:'finalStatus',type:'select',label:'Final status',options:['Sold','Retired','Deceased','Kept']},{k:'finalWeight',type:'number',label:'Final weight'}]},
      {type:'row',fields:[{k:'buyer',label:'Buyer'},{k:'salePrice',type:'number',label:'Sale price'}]},
      {k:'destination',label:'Destination'},{k:'reason',label:'Reason archived'},{k:'notes',type:'textarea',label:'Final notes'}],
    onSave:s=>{ a.prevStatus=a.status; a.archived=true; a.status='Archived'; a.archiveInfo={...s,date:todayISO(),by:DB.currentUserId};
      if(s.salePrice)DB.income.push(stamp({id:uid('in'),animalId:a.id,source:'Sale proceeds',amount:+s.salePrice,date:todayISO()}));
      touch(a); logAct('archive','Archived '+a.name+(s.finalStatus?' ('+s.finalStatus+')':''),a.id); save(); toast('Animal archived — records preserved','good'); go('/animals'); } });
}

/* ===================================================================
   SHOW ENTRY + RESULT sheets
   =================================================================== */
function openEntrySheet(animalId,id){
  const ent=id?{...DB.entries.find(e=>e.id===id)}:{animalId,showId:DB.shows[0]?DB.shows[0].id:'',division:'',cls:'',showWeight:'',exhibitor:me().name};
  if(!DB.shows.length){ toast('Add a show first','bad'); openShowSheet(); return; }
  const body=el('div');
  body.innerHTML=`<div class="field"><label>Show</label><select class="control" id="enShow">${DB.shows.map(s=>`<option value="${s.id}" ${ent.showId===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
    <div class="field-row"><div class="field" style="flex:1"><label>Division</label><input class="control" id="enDiv" value="${esc(ent.division||'')}"></div><div class="field" style="flex:1"><label>Class</label><input class="control" id="enCls" value="${esc(ent.cls||'')}"></div></div>
    <div class="field-row"><div class="field" style="flex:1"><label>Show weight</label><input class="control" type="number" id="enW" value="${ent.showWeight||''}"></div><div class="field" style="flex:1"><label>Exhibitor</label><input class="control" id="enEx" value="${esc(ent.exhibitor||'')}"></div></div>`;
  const foot=el('div'); foot.innerHTML=`${id?`<button class="btn danger" data-del>${ICON.trash}</button>`:''}<button class="btn primary" data-save style="flex:1">Save entry</button>`;
  const sh=openSheet({title:id?'Edit entry — '+((getAnimal(ent.animalId)||{}).name||''):'Show entry',body,foot});
  $('[data-save]',sh).onclick=()=>{ const data={showId:$('#enShow',body).value,division:$('#enDiv',body).value.trim(),cls:$('#enCls',body).value.trim(),showWeight:$('#enW',body).value||null,exhibitor:$('#enEx',body).value.trim()};
    if(id){Object.assign(DB.entries.find(e=>e.id===id),data);}else{DB.entries.push(stamp({id:uid('en'),animalId,result:{},...data}));} logAct('show','Entered show',animalId); save(); closeSheet(); toast('Entry saved','good'); render(); };
  if($('[data-del]',sh))$('[data-del]',sh).onclick=async()=>{ if(await confirmSheet('Remove entry','Remove this show entry?','Remove',true)){DB.entries=DB.entries.filter(e=>e.id!==id);save();closeSheet();render();} };
}
function openResultSheet(id){
  const e=DB.entries.find(x=>x.id===id); const r={...(e.result||{})};
  recordSheet({title:'Show result',rec:r,fields:[
    {type:'row',fields:[{k:'placing',label:'Placing',ph:'1'},{k:'inClass',type:'number',label:'# in class'}]},
    {k:'divisionPlacing',label:'Division / champion',ph:'Champion Cross'},
    {k:'bannerNote',label:'Banner / overall',ph:'Reserve Grand'},
    {type:'row',fields:[{k:'showmanship',label:'Showmanship'},{k:'salePrice',type:'number',label:'Sale price'}]},
    {type:'row',fields:[{k:'premium',type:'number',label:'Premium'},{k:'points',type:'number',label:'Points'}]},
    {k:'judgeComments',type:'textarea',label:'Judge comments'},
    {k:'lessons',type:'textarea',label:'Lessons learned'}],
    onSave:s=>{ e.result=s; touch(e); if(s.salePrice)DB.income.push(stamp({id:uid('in'),animalId:e.animalId,source:'Sale proceeds',amount:+s.salePrice,date:todayISO()})); if(s.premium)DB.income.push(stamp({id:uid('in'),animalId:e.animalId,source:'Premium',amount:+s.premium,date:todayISO()})); logAct('show','Recorded result: placed '+(s.placing||'?'),e.animalId); save(); toast('Result saved','good'); render();
      const an=getAnimal(e.animalId); const champ=/champ|grand|reserve|supreme|banner/i.test((s.divisionPlacing||'')+' '+(s.bannerNote||''));
      if(champ) milestone('banner:'+e.id, `${an?an.name:'Your animal'} took a banner!`, esc(s.divisionPlacing||s.bannerNote), '🏆');
      else if(String(s.placing).trim()==='1') milestone('win:'+e.id, `${an?an.name:'Your animal'} won the class!`, '1st place 🥇', '🥇'); } });
}

/* ===================================================================
   CALENDAR + TASKS
   =================================================================== */
let calMonth=null; // Date of first-of-displayed-month

/* ---- recurring tasks: one stored record, expanded into dated occurrences ----
   A repeating task keeps a single row (start `date` + `recur`); its per-day
   completion lives in `doneDates[]`. Occurrences are generated on demand for a
   date window so the calendar shows the task on every day it repeats. */
const RECUR_STEP = { daily:1, weekly:7, biweekly:14 };
const recurStepDays = r => RECUR_STEP[r] || 0;
const addDaysISO = (iso,n) => { const d=new Date(iso+'T00:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); };
const maxISO = (a,b) => a>b?a:b;
function taskOccurrences(t, fromISO, toISO){
  const step=recurStepDays(t.recur);
  if(!step) return (t.date>=fromISO && t.date<=toISO) ? [t.date] : [];
  let d=t.date;
  if(d<fromISO){ const jumps=Math.ceil(daysBetween(d,fromISO)/step); d=addDaysISO(d, jumps*step); }
  const out=[]; let guard=0;
  while(d<=toISO && guard++<1000){ if(d>=fromISO) out.push(d); d=addDaysISO(d, step); }
  return out;
}
const taskAnimalIds = t => t.animalIds || (t.animalId!=null&&t.animalId!==''?[t.animalId]:[]);
function animalsLabel(ids){ ids=(ids||[]).filter(id=>getAnimal(id)); if(ids.length===1) return (getAnimal(ids[0])||{}).name||''; return ids.length>1 ? ids.length+' animals' : ''; }
// Per-animal completion for a given date lives in t.progress[date] = [animalIds done].
const taskProgress = (t,date) => (t.progress && t.progress[date]) || [];
function setTaskAnimalDone(t,date,animalId,val){ t.progress=t.progress||{}; const arr=t.progress[date]||(t.progress[date]=[]);
  const i=arr.indexOf(animalId); if(val&&i<0)arr.push(animalId); else if(!val&&i>=0)arr.splice(i,1); if(!arr.length)delete t.progress[date]; touch(t); }
// An occurrence is "done" when every assigned animal is checked (or, with no
// animals, the whole task is marked done for that date).
const taskDoneOn = (t,date) => { const ids=taskAnimalIds(t);
  if(ids.length){ const p=(t.progress&&t.progress[date])||[]; return ids.every(id=>p.includes(id)); }
  return t.recur ? (t.doneDates||[]).includes(date) : !!t.done; };
function setTaskDone(t,date,val){
  const ids=taskAnimalIds(t);
  if(ids.length){ t.progress=t.progress||{}; if(val) t.progress[date]=[...ids]; else delete t.progress[date]; }
  else if(t.recur){ t.doneDates=t.doneDates||[]; const has=t.doneDates.includes(date);
    if(val&&!has) t.doneDates.push(date); else if(!val&&has) t.doneDates=t.doneDates.filter(x=>x!==date); }
  else t.done=!!val;
  touch(t);
}
function calItems(range){
  const from=range&&range.from, to=range&&range.to;
  const inR = d => (!from||d>=from) && (!to||d<=to);
  const items=[];
  (DB.events||[]).forEach(e=>{ if(inR(e.date)) items.push({date:e.date,time:e.startTime||'',kind:'event',title:e.title,ref:e,cat:e.category}); });
  const tFrom=from||todayISO(), tTo=to||addDaysISO(todayISO(),60);
  DB.tasks.forEach(t=>{
    if(t.recur){ taskOccurrences(t,tFrom,tTo).forEach(d=>items.push({date:d,occDate:d,time:t.time||'',kind:'task',title:t.title,ref:t,done:taskDoneOn(t,d),priority:t.priority,animalIds:taskAnimalIds(t),recurring:true})); }
    else if(inR(t.date)) items.push({date:t.date,occDate:t.date,time:t.time||'',kind:'task',title:t.title,ref:t,done:taskDoneOn(t,t.date),priority:t.priority,animalIds:taskAnimalIds(t)});
  });
  DB.shows.forEach(s=>{ if(inR(s.start))items.push({date:s.start,time:'',kind:'show',title:s.name,ref:s});
    if(s.entryDeadline&&inR(s.entryDeadline))items.push({date:s.entryDeadline,time:'',kind:'deadline',title:'Entry deadline · '+s.name,ref:s}); });
  DB.health.forEach(h=>{ if(h.withdrawal&&inR(h.withdrawal)){const a=getAnimal(h.animalId);items.push({date:h.withdrawal,kind:'withdrawal',title:(a?a.name+' ':'')+'withdrawal ends',animalId:h.animalId});} if(h.followup&&inR(h.followup)){const a=getAnimal(h.animalId);items.push({date:h.followup,kind:'health',title:(a?a.name+' ':'')+'health follow-up',animalId:h.animalId});} });
  (DB.medLog||[]).forEach(d=>{ const e=doseWithdrawalEnds(d); if(e&&inR(e)){ const a=getAnimal(d.animalId); items.push({date:e,kind:'withdrawal',title:(a?a.name+' ':'')+d.name+' clears',animalId:d.animalId}); } });
  return items;
}
const itemSort=(a,b)=>{ const ka=a.date+(a.time||'99:99'), kb=b.date+(b.time||'99:99'); return ka<kb?-1:ka>kb?1:0; };
route('calendar',()=>{
  const v=setView('','calendar');
  if(!calMonth){ const n=new Date(); calMonth=new Date(n.getFullYear(),n.getMonth(),1); }
  const wrap=el('div'); v.append(wrap);
  const draw=()=>{
    const y=calMonth.getFullYear(), m=calMonth.getMonth(); const last=new Date(y,m+1,0).getDate();
    const monthEnd=`${y}-${String(m+1).padStart(2,'0')}-${String(last).padStart(2,'0')}`;
    const to=maxISO(monthEnd, addDaysISO(todayISO(),60));       // cover the shown month + 60 days for recurrence
    const items=calItems({to});
    const today=todayISO();
    // Upcoming: collapse each repeating task to its next occurrence so a daily
    // task doesn't flood the list; the month grid still shows every day.
    const seenR=new Set();
    const upcoming=items.filter(e=>e.date>=today).sort(itemSort).filter(e=>{
      if(e.kind==='task'&&e.recurring){ if(seenR.has(e.ref.id))return false; seenR.add(e.ref.id); } return true; });
    const overdue=items.filter(e=>e.kind==='task'&&!e.done&&!e.recurring&&e.date<today).sort(itemSort);
    wrap.innerHTML=`${pageHeader('Calendar',null,`<div style="display:flex;gap:8px"><button class="btn sm" id="addT">${ICON.check}</button><button class="btn primary sm" id="addE">${ICON.plus} Event</button></div>`)}
      <div id="monthWrap"></div>
      <div class="btn-row" style="margin:2px 0 10px"><button class="btn sm ghost" id="exportCal">${ICON.calPlus} Export to Apple / Outlook</button></div>
      ${overdue.length?`<div class="section-title" style="color:var(--bad)">Overdue</div><div id="ovd"></div>`:''}
      <div class="section-title">Upcoming</div><div id="upc"></div>`;
    $('#monthWrap',wrap).innerHTML=miniMonth(items, calMonth);
    $('#addE',wrap).onclick=()=>openEventSheet(null, todayISO());
    $('#addT',wrap).onclick=()=>openTaskSheet();
    $('#exportCal',wrap).onclick=()=>exportCalendarICS();
    $('#calPrev',wrap).onclick=()=>{ calMonth=new Date(calMonth.getFullYear(),calMonth.getMonth()-1,1); draw(); };
    $('#calNext',wrap).onclick=()=>{ calMonth=new Date(calMonth.getFullYear(),calMonth.getMonth()+1,1); draw(); };
    $$('[data-cal-day]',wrap).forEach(c=>c.onclick=()=>openDaySheet(c.dataset.calDay));
    if($('#ovd',wrap))$('#ovd',wrap).append(itemList(overdue));
    const uc=$('#upc',wrap); if(upcoming.length)uc.append(itemList(upcoming.slice(0,50))); else uc.innerHTML=emptyState(ICON.cal,'Nothing scheduled','Tap a day, or Add Event, to put visits, weigh days and shows on the calendar.');
  };
  draw();
});
function miniMonth(items, ref){
  const y=ref.getFullYear(), m=ref.getMonth();
  const first=new Date(y,m,1).getDay(); const days=new Date(y,m+1,0).getDate();
  const byDay={}; items.forEach(e=>{ const d=parseD(e.date); if(d&&d.getFullYear()===y&&d.getMonth()===m)(byDay[d.getDate()]=byDay[d.getDate()]||[]).push(e); });
  const todayS=todayISO();
  const dotColor=e=>({event:eventCat(e.cat).color, show:'var(--purple-3)', deadline:'var(--bad)', task:'var(--good)', withdrawal:'var(--warn)', health:'var(--bad)'}[e.kind]||'var(--teal-3)');
  let cells=''; for(let i=0;i<first;i++)cells+='<div></div>';
  for(let d=1;d<=days;d++){ const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; const isToday=iso===todayS; const ev=byDay[d]||[];
    cells+=`<button data-cal-day="${iso}" style="aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:10px;position:relative;font-size:13px;font-weight:700;color:${isToday?'#fff':'var(--ink)'};background:${isToday?'var(--purple)':ev.length?'var(--line-2)':'transparent'}">${d}${ev.length?`<div style="display:flex;gap:2px;margin-top:2px">${ev.slice(0,3).map(e=>`<span style="width:4px;height:4px;border-radius:50%;background:${isToday?'#fff':dotColor(e)}"></span>`).join('')}</div>`:''}</button>`; }
  return `<div class="card pad">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <button class="iconbtn" style="background:var(--line-2);color:var(--ink)" id="calPrev">${ICON.back}</button>
      <div style="font-weight:800">${ref.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</div>
      <button class="iconbtn" style="background:var(--line-2);color:var(--ink)" id="calNext">${ICON.chev}</button></div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;font-size:10px;color:var(--muted);font-weight:700;text-align:center;margin-bottom:4px">${['S','M','T','W','T','F','S'].map(d=>`<div>${d}</div>`).join('')}</div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">${cells}</div></div>`;
}
function timeLabel(t){ if(!t) return ''; const [h,mi]=t.split(':').map(Number); const ap=h<12?'AM':'PM'; const h12=(h%12)||12; return h12+(mi?':'+String(mi).padStart(2,'0'):'')+' '+ap; }
function itemList(items){
  const L=el('div','list');
  items.forEach(e=>{ const a=e.animalId?getAnimal(e.animalId):null; const li=el('div','li');
    const taskIds=e.kind==='task'?(e.animalIds||[]).filter(id=>getAnimal(id)):[];
    const taskWho=e.kind!=='task'?'':(taskIds.length>=2? taskProgress(e.ref,e.occDate||e.date).filter(id=>taskIds.includes(id)).length+'/'+taskIds.length+' animals' : animalsLabel(taskIds));
    const cat=e.kind==='event'?eventCat(e.cat):null;
    const ic=e.kind==='event'?ICON[cat.icon]:({task:ICON.check,show:ICON.shows,deadline:ICON.flag,withdrawal:ICON.health,health:ICON.health}[e.kind]||ICON.cal);
    const col=e.kind==='event'?cat.color:({task:'var(--good)',show:'var(--purple-3)',deadline:'var(--bad)',withdrawal:'var(--warn)',health:'var(--bad)'}[e.kind]);
    const timeStr=e.kind==='event'?(e.ref.allDay?'All day':timeLabel(e.time)):'';
    const loc=e.kind==='event'&&e.ref.location?' · '+esc(e.ref.location):'';
    const recurLbl=e.recurring?' · repeats '+e.ref.recur:'';
    li.innerHTML=`<button class="thumb" style="color:${col}" ${e.kind==='task'?'data-done':''}>${e.kind==='task'&&e.done?ICON.check:ic}</button>
      <div class="main"><div class="t1" style="${e.done?'text-decoration:line-through;color:var(--muted)':''}">${esc(e.title)}</div><div class="t2">${fmtShort(e.date)}${timeStr?' · '+timeStr:''} · ${relDays(e.date)}${a?' · '+esc(a.name):''}${taskWho?' · '+esc(taskWho):''}${loc}${recurLbl}</div></div>
      ${e.kind==='event'?`<button class="iconbtn" style="background:var(--line-2);color:var(--purple-3)" data-ics title="Add to Calendar">${ICON.calPlus}</button>`:e.priority==='High'?'<span class="pill bad" style="font-size:10px">High</span>':''}`;
    if(e.kind==='task'){ $('[data-done]',li).onclick=(ev)=>{ev.stopPropagation(); const nd=!e.done; setTaskDone(e.ref, e.occDate||e.date, nd); if(nd)logAct('task','Completed: '+e.ref.title,taskIds[0]||null); save();render();};
      li.onclick=()=> taskIds.length>=2 ? openTaskProgressSheet(e.ref.id, e.occDate||e.date) : openTaskSheet(e.ref.id); }
    else if(e.kind==='event'){ $('[data-ics]',li).onclick=(ev)=>{ev.stopPropagation();addToCalendar(e.ref);}; li.onclick=()=>openEventSheet(e.ref.id); }
    else if(e.kind==='show'||e.kind==='deadline'){ li.onclick=()=>go('/show/'+e.ref.id); }
    else if(a){ li.onclick=()=>go('/animal/'+a.id); }
    L.append(li); });
  return L;
}
function openDaySheet(date){
  const items=calItems({from:date,to:date}).sort(itemSort);
  const body=el('div');
  body.innerHTML=`<div class="btn-row" style="margin-bottom:12px"><button class="btn primary" id="dayAddE" style="flex:1">${ICON.plus} Event</button><button class="btn" id="dayAddT">${ICON.check} Task</button></div><div id="dayList"></div>`;
  const sh=openSheet({title:fmtDate(date,{weekday:'long',month:'long',day:'numeric'}),body});
  $('#dayAddE',body).onclick=()=>{ closeSheet(); openEventSheet(null, date); };
  $('#dayAddT',body).onclick=()=>{ closeSheet(); openTaskSheet(null, date); };
  const dl=$('#dayList',body);
  if(!items.length) dl.innerHTML='<div class="empty" style="padding:16px">Nothing scheduled this day.</div>';
  else { const L=itemList(items); dl.append(L); }
}
/* Reusable multi-animal picker with "Select all / by species / clear" quick
   actions. `selected` is an array that is mutated in place. Mount it in a
   container and call the returned paint() to (re)render after quick actions. */
function mountAnimalPicker(container, selected){
  const paint=()=>{
    const species=[...new Set(activeAnimals().map(a=>a.species))];
    const quick=`<div class="chips" style="flex-wrap:wrap;white-space:normal;margin-bottom:8px">
      <button type="button" class="chip" data-qk="all" style="font-weight:700">Select all</button>
      ${species.map(s=>`<button type="button" class="chip" data-qk="sp:${s}">All ${esc(speciesName(s).toLowerCase())}</button>`).join('')}
      ${selected.length?`<button type="button" class="chip" data-qk="none">Clear (${selected.length})</button>`:''}</div>`;
    const chips=`<div class="chips" style="flex-wrap:wrap;white-space:normal">${activeAnimals().map(a=>`<button type="button" class="chip ${selected.includes(a.id)?'active':''}" data-an="${a.id}">${esc(a.name)}</button>`).join('')||'<span style="font-size:12px;color:var(--muted)">No active animals</span>'}</div>`;
    container.innerHTML=quick+chips;
    $$('[data-an]',container).forEach(b=>b.onclick=()=>{ const id=b.dataset.an; const i=selected.indexOf(id); if(i>=0)selected.splice(i,1); else selected.push(id); paint(); });
    $$('[data-qk]',container).forEach(b=>b.onclick=()=>{ const v=b.dataset.qk;
      if(v==='all') selected.splice(0,selected.length,...activeAnimals().map(a=>a.id));
      else if(v==='none') selected.splice(0,selected.length);
      else if(v.startsWith('sp:')){ const sp=v.slice(3); activeAnimals().filter(a=>a.species===sp).forEach(a=>{ if(!selected.includes(a.id))selected.push(a.id); }); }
      paint(); });
  };
  paint(); return paint;
}
function openTaskSheet(id, presetDate){
  const t=id?{...DB.tasks.find(x=>x.id===id)}:{title:'',date:presetDate||todayISO(),priority:'Normal',done:false,recur:''};
  const sel=[...taskAnimalIds(t)];
  const body=el('div');
  body.innerHTML=`<div class="field"><label>Task *</label><input class="control" id="tkTitle" value="${esc(t.title)}" placeholder="Rinse, condition & walk pigs"></div>
    <div class="field-row"><div class="field" style="flex:1"><label>Date</label><input class="control" type="date" id="tkDate" value="${t.date}"></div>
      <div class="field" style="flex:1"><label>Priority</label><select class="control" id="tkPri">${['Low','Normal','High'].map(p=>`<option ${t.priority===p?'selected':''}>${p}</option>`).join('')}</select></div></div>
    <div class="field"><label>Animals <span style="text-transform:none;letter-spacing:0;color:var(--muted);font-weight:600">(optional — pick any, or all)</span></label><div id="tkAnimals"></div></div>
    <div class="field"><label>Repeats</label><select class="control" id="tkRecur">${[['','No'],['weekly','Weekly'],['biweekly','Every 2 weeks'],['daily','Daily']].map(([v,l])=>`<option value="${v}" ${t.recur===v?'selected':''}>${l}</option>`).join('')}</select></div>`;
  const foot=el('div'); foot.innerHTML=`${id?`<button class="btn danger" data-del>${ICON.trash}</button>`:''}<button class="btn primary" data-save style="flex:1">Save task</button>`;
  const sh=openSheet({title:id?'Edit task':'New task',body,foot});
  mountAnimalPicker($('#tkAnimals',body), sel);
  $('[data-save]',sh).onclick=()=>{ const data={title:$('#tkTitle',body).value.trim(),date:$('#tkDate',body).value,priority:$('#tkPri',body).value,animalIds:[...sel],recur:$('#tkRecur',body).value}; if(!data.title){toast('Name the task','bad');return;}
    if(id){const T=DB.tasks.find(x=>x.id===id); Object.assign(T,data); delete T.animalId;}else{DB.tasks.push(stamp({id:uid('t'),done:false,doneDates:[],...data}));} save(); closeSheet(); toast(data.recur?'Repeating task saved — it’s on every '+({daily:'day',weekly:'week',biweekly:'2 weeks'}[data.recur]||'time'):'Task saved','good'); render(); };
  if($('[data-del]',sh))$('[data-del]',sh).onclick=async()=>{ if(await confirmSheet('Delete task','Remove this task?','Delete',true)){DB.tasks=DB.tasks.filter(x=>x.id!==id);save();closeSheet();render();} };
}
/* Per-animal check-off for a multi-animal task on a given date — work through
   the group one animal at a time and watch the progress bar fill. */
function openTaskProgressSheet(taskId, date){
  const t=DB.tasks.find(x=>x.id===taskId); if(!t) return;
  const ids=taskAnimalIds(t).filter(id=>getAnimal(id));
  if(ids.length<2){ openTaskSheet(taskId); return; }
  date = date || (t.recur?todayISO():t.date);
  const body=el('div');
  const draw=()=>{
    const done=taskProgress(t,date).filter(id=>ids.includes(id)); const pct=Math.round(done.length/ids.length*100); const all=done.length===ids.length;
    body.innerHTML=`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="font-weight:800;font-size:15px;flex:1">${esc(t.title)}</div>${t.recur?`<span class="pill" style="font-size:10px">repeats ${t.recur}</span>`:''}</div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;font-size:12.5px;color:var(--muted);margin-bottom:6px"><span>${fmtDate(date)}${t.recur&&date===todayISO()?' · today':''}</span><span style="font-weight:800;color:${all?'var(--good)':'var(--ink)'};font-size:15px" class="tnum">${done.length}/${ids.length}</span></div>
      <div style="height:9px;background:var(--line-2);border-radius:6px;overflow:hidden;margin-bottom:10px"><div style="height:100%;width:${pct}%;background:${all?'var(--good)':'var(--purple-3)'};border-radius:6px;transition:width .2s"></div></div>
      <div class="btn-row" style="margin-bottom:10px"><button class="btn sm ghost" data-all style="flex:1">${ICON.check} Mark all done</button>${done.length?'<button class="btn sm ghost" data-none style="flex:1">Reset</button>':''}</div>
      <div class="list" id="taList"></div>`;
    const L=$('#taList',body);
    ids.map(getAnimal).forEach(a=>{ const on=done.includes(a.id); const li=el('div','li'); li.style.cursor='pointer';
      li.innerHTML=`<button class="thumb" style="background:${on?'var(--good)':'var(--line-2)'};color:${on?'#fff':'var(--purple-3)'}" data-tk>${on?ICON.check:`<span style="width:20px;height:20px">${spIcon(a.species)}</span>`}</button>
        <div class="main"><div class="t1" style="${on?'color:var(--muted);text-decoration:line-through':''}">${esc(a.name)}</div><div class="t2">${esc(speciesName(a.species))}${a.penLocation?' · '+esc(a.penLocation):''}</div></div>
        ${on?'<span class="pill good" style="font-size:10px">done</span>':''}`;
      const toggle=()=>{ setTaskAnimalDone(t,date,a.id,!on); save(); draw(); };
      $('[data-tk]',li).onclick=(e)=>{e.stopPropagation();toggle();}; li.onclick=toggle;
      L.append(li); });
    $('[data-all]',body).onclick=()=>{ setTaskDone(t,date,true); logAct('task','Completed all: '+t.title,ids[0]); save(); draw(); };
    if($('[data-none]',body))$('[data-none]',body).onclick=()=>{ setTaskDone(t,date,false); save(); draw(); };
  };
  draw();
  const foot=el('div'); foot.innerHTML=`<button class="btn ghost" data-edit>${ICON.edit}</button><button class="btn primary" data-close style="flex:1">Done</button>`;
  const sh=openSheet({title:'Work through the list',body,foot,onClose:()=>render()});
  $('[data-edit]',sh).onclick=()=>{ closeSheet(); openTaskSheet(taskId); };
  $('[data-close]',sh).onclick=()=>closeSheet();
}

/* ---- calendar event sheet ---- */
function openEventSheet(id, presetDate){
  if(!can('addRecord')){ toast('Your role can’t add events','bad'); return; }
  const e = id?{...(DB.events||[]).find(x=>x.id===id), animalIds:[...((DB.events||[]).find(x=>x.id===id).animalIds||[])]}
    : { title:'', category:'Visit', date:presetDate||todayISO(), startTime:'18:00', endTime:'', allDay:false, location:'', notes:'', animalIds:[], showId:null };
  const body=el('div');
  const draw=()=>{
    body.innerHTML=`
      <div class="field"><label>What's happening? *</label><input class="control" id="evTitle" value="${esc(e.title)}" placeholder="Kade over for showmanship"></div>
      <div class="field"><label>Type</label><div class="chips" id="evCats" style="flex-wrap:wrap;white-space:normal">${EVENT_CATS.map(c=>`<button type="button" class="chip ${e.category===c.key?'active':''}" data-cat="${c.key}"><span style="width:15px;height:15px;color:${e.category===c.key?'#fff':c.color}">${ICON[c.icon]}</span>${c.key}</button>`).join('')}</div></div>
      <div class="field-row"><div class="field" style="flex:1"><label>Date</label><input class="control" type="date" id="evDate" value="${e.date}"></div>
        <div class="field" style="flex:1"><label>&nbsp;</label><label class="control" style="display:flex;align-items:center;gap:8px;min-height:48px"><input type="checkbox" id="evAllDay" ${e.allDay?'checked':''} style="width:20px;height:20px"> All day</label></div></div>
      <div class="field-row" id="evTimes" style="${e.allDay?'display:none':''}"><div class="field" style="flex:1"><label>Start</label><input class="control" type="time" id="evStart" value="${e.startTime||'18:00'}"></div>
        <div class="field" style="flex:1"><label>End (optional)</label><input class="control" type="time" id="evEnd" value="${e.endTime||''}"></div></div>
      <div class="field"><label>Location</label><input class="control" id="evLoc" value="${esc(e.location||'')}" placeholder="Home barn"></div>
      <div class="field"><label>Link a show (optional)</label><select class="control" id="evShow"><option value="">— none —</option>${DB.shows.map(s=>`<option value="${s.id}" ${e.showId===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Animals involved</label><div id="evAnimals"></div></div>
      <div class="field"><label>Notes</label><textarea class="control" id="evNotes" placeholder="What's the plan?">${esc(e.notes||'')}</textarea></div>`;
    $$('[data-cat]',body).forEach(b=>b.onclick=()=>{ e.category=b.dataset.cat; collect(); draw(); });
    mountAnimalPicker($('#evAnimals',body), e.animalIds);
    $('#evAllDay',body).onchange=()=>{ e.allDay=$('#evAllDay',body).checked; $('#evTimes',body).style.display=e.allDay?'none':''; };
  };
  const collect=()=>{ e.title=$('#evTitle',body).value.trim(); e.date=$('#evDate',body).value; e.allDay=$('#evAllDay',body).checked; e.startTime=$('#evStart',body)?$('#evStart',body).value:e.startTime; e.endTime=$('#evEnd',body)?$('#evEnd',body).value:''; e.location=$('#evLoc',body).value.trim(); e.showId=$('#evShow',body).value||null; e.notes=$('#evNotes',body).value; };
  draw();
  const foot=el('div'); foot.innerHTML=`${id?`<button class="btn danger" data-del>${ICON.trash}</button>`:''}<button class="btn" data-cal>${ICON.calPlus}</button><button class="btn primary" data-save style="flex:1">${id?'Save':'Add event'}</button>`;
  const sh=openSheet({title:id?'Edit event':'New event',body,foot});
  const persist=()=>{ collect(); if(!e.title){toast('Add a title','bad');return null;}
    if(id){ Object.assign((DB.events).find(x=>x.id===id),e); touch((DB.events).find(x=>x.id===id)); }
    else { const rec=stamp({id:uid('ev'),...e}); DB.events.push(rec); id=rec.id; }
    logAct('event','Event: '+e.title); save(); return (DB.events).find(x=>x.id===id); };
  $('[data-save]',sh).onclick=()=>{ const rec=persist(); if(rec){ closeSheet(); toast('Event saved','good'); render(); } };
  $('[data-cal]',sh).onclick=()=>{ const rec=persist(); if(rec){ addToCalendar(rec); } };
  if($('[data-del]',sh))$('[data-del]',sh).onclick=async()=>{ if(await confirmSheet('Delete event','Remove this event?','Delete',true)){ DB.events=DB.events.filter(x=>x.id!==id); save(); closeSheet(); render(); } };
}

/* ===================================================================
   ADD TO CALENDAR — iCalendar (.ics) for Apple/Outlook + web links
   =================================================================== */
function icsEsc(s){ return String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n'); }
function pad2(n){ return String(n).padStart(2,'0'); }
function evEndTime(ev){ if(ev.endTime) return ev.endTime; if(!ev.startTime) return '19:00'; const [h,m]=ev.startTime.split(':').map(Number); return pad2((h+1)%24)+':'+pad2(m||0); }
function icsStamp(){ const d=new Date(); return d.getUTCFullYear()+pad2(d.getUTCMonth()+1)+pad2(d.getUTCDate())+'T'+pad2(d.getUTCHours())+pad2(d.getUTCMinutes())+pad2(d.getUTCSeconds())+'Z'; }
function eventDescription(ev){ const parts=[]; if(ev.notes)parts.push(ev.notes);
  const ans=(ev.animalIds||[]).map(id=>(getAnimal(id)||{}).name).filter(Boolean); if(ans.length)parts.push('Animals: '+ans.join(', '));
  const sh=ev.showId?DB.shows.find(s=>s.id===ev.showId):null; if(sh)parts.push('Show: '+sh.name);
  return parts.join('\n'); }
function buildICS(events){
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Show Team//EN','CALSCALE:GREGORIAN'];
  events.forEach(ev=>{ const d=ev.date.replace(/-/g,'');
    lines.push('BEGIN:VEVENT'); lines.push('UID:'+(ev.id||uid('ev'))+'@dfst'); lines.push('DTSTAMP:'+icsStamp());
    if(ev.allDay){ const next=new Date(parseD(ev.date)); next.setDate(next.getDate()+1); const nd=next.getFullYear()+pad2(next.getMonth()+1)+pad2(next.getDate());
      lines.push('DTSTART;VALUE=DATE:'+d); lines.push('DTEND;VALUE=DATE:'+nd); }
    else { const st=(ev.startTime||'18:00').replace(':',''); const en=evEndTime(ev).replace(':','');
      lines.push('DTSTART:'+d+'T'+st+'00'); lines.push('DTEND:'+d+'T'+en+'00'); }
    lines.push('SUMMARY:'+icsEsc(ev.title));
    if(ev.recur){ const fr={daily:'DAILY',weekly:'WEEKLY',biweekly:'WEEKLY'}[ev.recur]; if(fr) lines.push('RRULE:FREQ='+fr+(ev.recur==='biweekly'?';INTERVAL=2':'')); }
    if(ev.location) lines.push('LOCATION:'+icsEsc(ev.location));
    const desc=eventDescription(ev); if(desc) lines.push('DESCRIPTION:'+icsEsc(desc));
    lines.push('BEGIN:VALARM','TRIGGER:-PT1H','ACTION:DISPLAY','DESCRIPTION:'+icsEsc(ev.title),'END:VALARM');
    lines.push('END:VEVENT'); });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
function downloadICS(filename, events){ const ics=buildICS(events); const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'}); const url=URL.createObjectURL(blob);
  const a=el('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},1500); }
function googleCalUrl(ev){ const d=ev.date.replace(/-/g,'');
  let dates; if(ev.allDay){ const n=new Date(parseD(ev.date)); n.setDate(n.getDate()+1); dates=d+'/'+(n.getFullYear()+pad2(n.getMonth()+1)+pad2(n.getDate())); }
  else dates=d+'T'+(ev.startTime||'18:00').replace(':','')+'00/'+d+'T'+evEndTime(ev).replace(':','')+'00';
  const p=new URLSearchParams({action:'TEMPLATE',text:ev.title||'Event',dates,details:eventDescription(ev)||'',location:ev.location||''});
  return 'https://calendar.google.com/calendar/render?'+p.toString(); }
function outlookCalUrl(ev){ const iso=(t)=>ev.date+'T'+(t||'18:00')+':00';
  const p=new URLSearchParams({path:'/calendar/action/compose',rru:'addevent',subject:ev.title||'Event',body:eventDescription(ev)||'',location:ev.location||'',
    startdt:ev.allDay?ev.date:iso(ev.startTime), enddt:ev.allDay?ev.date:iso(evEndTime(ev)), allday:String(!!ev.allDay)});
  return 'https://outlook.live.com/calendar/0/deeplink/compose?'+p.toString(); }
function addToCalendar(ev){
  const body=el('div');
  body.innerHTML=`<p style="font-size:13px;color:var(--muted);margin:2px 0 12px">Add “<b style="color:var(--ink)">${esc(ev.title)}</b>” — ${fmtDate(ev.date)}${ev.allDay?' · all day':(ev.startTime?' · '+timeLabel(ev.startTime):'')}${ev.location?' · '+esc(ev.location):''}</p>
    <button class="btn primary block" id="icsBtn" style="margin-bottom:10px">${aicon()} <span style="margin-left:2px"></span> Apple Calendar / download .ics</button>
    <button class="btn block" id="gBtn" style="margin-bottom:10px">${gicon()} Google Calendar</button>
    <button class="btn block" id="oBtn">Outlook.com</button>
    <div class="help" style="margin-top:12px">${ICON.info}<span>On iPhone, the .ics opens Apple Calendar with “Add Event.” Google/Outlook open the web composer. (Live two-way sync is a future option.)</span></div>`;
  const sh=openSheet({title:'Add to Calendar',body});
  $('#icsBtn',body).onclick=()=>{ downloadICS((ev.title||'event').replace(/[^\w]+/g,'-').slice(0,40)+'.ics',[ev]); toast('Calendar file created','good'); };
  $('#gBtn',body).onclick=()=>{ window.open(googleCalUrl(ev),'_blank'); };
  $('#oBtn',body).onclick=()=>{ window.open(outlookCalUrl(ev),'_blank'); };
}
function exportCalendarICS(){
  const evs=[]; (DB.events||[]).filter(e=>e.date>=todayISO()).forEach(e=>evs.push(e));
  DB.shows.filter(s=>s.start>=todayISO()).forEach(s=>evs.push({id:s.id,title:'Show: '+s.name,date:s.start,allDay:true,location:s.location||s.city||'',notes:s.notes||''}));
  // repeating tasks export once with an RRULE so they recur in Apple/Outlook too
  DB.tasks.filter(t=>t.recur).forEach(t=>evs.push({id:t.id,title:t.title,date:t.date,allDay:!t.time,startTime:t.time||'07:00',recur:t.recur,notes:''}));
  if(!evs.length){ toast('Nothing upcoming to export','bad'); return; }
  downloadICS('dfst-calendar.ics', evs); toast(`Exported ${evs.length} to calendar`,'good');
}

/* ===================================================================
   SHOWS
   =================================================================== */
route('shows',()=>{
  const v=setView('','shows');
  const up=DB.shows.filter(s=>s.start>=todayISO()).sort((a,b)=>a.start<b.start?-1:1);
  const past=DB.shows.filter(s=>s.start<todayISO()).sort((a,b)=>a.start<b.start?1:-1);
  const wrap=el('div');
  wrap.innerHTML=pageHeader('Shows',null,`<button class="btn primary sm" id="addShow">${ICON.plus} Show</button>`);
  const sec=(title,arr)=>{ if(!arr.length)return; wrap.append(htmlToFrag(`<div class="section-title">${title}</div>`)); const L=el('div','list');
    arr.forEach(s=>{ const entries=DB.entries.filter(e=>e.showId===s.id); const li=el('div','li');
      li.innerHTML=`<div class="thumb" style="color:var(--purple)">${ICON.shows}</div><div class="main"><div class="t1">${esc(s.name)}</div><div class="t2">${fmtDate(s.start)} · ${esc(s.location||s.city||'')} · ${entries.length} entr${entries.length===1?'y':'ies'}</div></div>${s.start>=todayISO()?`<span class="pill p" style="font-size:10px">${daysBetween(todayISO(),s.start)}d</span>`:ICON.chev}`;
      li.onclick=()=>go('/show/'+s.id); L.append(li); }); wrap.append(L); };
  sec('Upcoming',up); sec('Past shows',past);
  if(!DB.shows.length)wrap.append(htmlToFrag(emptyState(ICON.shows,'No shows yet','Add a show to track entries, classes and results.')));
  v.append(wrap); $('#addShow',wrap).onclick=()=>openShowSheet();
});
route('show',(parts)=>{
  const s=DB.shows.find(x=>x.id===parts[1]); if(!s){go('/shows');return;}
  const v=setView('','shows'); const entries=DB.entries.filter(e=>e.showId===s.id);
  const wrap=el('div');
  wrap.innerHTML=`${pageHeader(s.name,'/shows',`<button class="iconbtn" style="background:var(--line-2);color:var(--ink)" id="edShow">${ICON.edit}</button>`)}
    <div class="card pad">
      ${s.start>=todayISO()?`<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px"><div style="background:var(--purple);color:#fff;border-radius:12px;padding:8px 14px;text-align:center"><div style="font-size:24px;font-weight:800" class="tnum">${daysBetween(todayISO(),s.start)}</div><div style="font-size:9px;font-weight:700">DAYS</div></div><div style="font-size:13px;color:var(--muted);font-weight:600">until show day</div></div>`:''}
      ${[['Dates',fmtDate(s.start)+(s.end&&s.end!==s.start?' – '+fmtDate(s.end):'')],['Location',s.location||s.city],['Entry deadline',s.entryDeadline?fmtDate(s.entryDeadline):''],['Weigh-in',s.weighIn?fmtDate(s.weighIn):''],['Judge',s.judge],['Organization',s.org],['Entry fee',s.fee?money(s.fee):'']].filter(r=>r[1]).map(r=>`<div class="kv"><span class="k">${r[0]}</span><span class="v">${esc(r[1])}</span></div>`).join('')}
    </div>
    <div class="btn-row" style="margin:12px 0 4px"><button class="btn primary" id="showDayBtn" style="flex:1">${ICON.clipboard} Show-day mode</button><button class="btn ghost" id="showRecBtn">${ICON.medal} Record book</button></div>
    <div class="section-title">Who's going <button class="more" id="addEnt2">${ICON.plus} Choose animals</button></div>
    <div id="shEntries"></div>`;
  v.append(wrap);
  $('#edShow',wrap).onclick=()=>openShowSheet(s.id);
  $('#showDayBtn',wrap).onclick=()=>go('/showday/'+s.id);
  $('#showRecBtn',wrap).onclick=()=>go('/records');
  $('#addEnt2',wrap).onclick=()=>openShowRoster(s.id);
  const ec=$('#shEntries',wrap);
  if(!entries.length){ ec.innerHTML=`<div class="card"><div class="empty">${ICON.animals}<div class="h">No animals yet</div><div class="p">Tap “Choose animals” to set who's going — you can fill in division, class and weight later.</div></div></div>`; return; }
  const L=el('div','list'); entries.forEach(e=>{ const a=getAnimal(e.animalId); if(!a)return; const r=e.result||{}; const li=el('div','li'); li.style.cursor='pointer';
    const details=[e.division,e.cls,e.showWeight?e.showWeight+' lb':''].filter(Boolean).map(esc).join(' · ');
    li.innerHTML=`<div class="thumb">${esc(initials(a.name))}</div><div class="main"><div class="t1">${esc(a.name)}</div><div class="t2">${details||'<span style="color:var(--warn)">Tap to add division / class / weight</span>'}</div></div>
      <div class="r" style="display:flex;align-items:center;gap:6px">${r.placing?`<button class="pill p" style="font-size:10px;border:none;cursor:pointer" data-res>${esc(r.placing)}${r.inClass?'/'+r.inClass:''}</button>`:'<button class="btn sm teal" data-res>Result</button>'}<span style="color:var(--muted)">${ICON.chev}</span></div>`;
    li.onclick=()=>openEntrySheet(e.animalId,e.id);
    $('[data-res]',li).onclick=(ev)=>{ev.stopPropagation();openResultSheet(e.id);};
    L.append(li); });
  ec.append(L);
});
/* Pick which animals are going to a show, all at once (with Select all /
   by species). Adds entries for newly-picked animals; removes de-selected
   ones that don't yet have a recorded result. */
function openShowRoster(showId){
  const s=DB.shows.find(x=>x.id===showId); if(!s) return;
  if(!activeAnimals().length){ toast('Add some animals first','bad'); return; }
  const entered=DB.entries.filter(e=>e.showId===showId);
  const sel=entered.map(e=>e.animalId).filter(id=>getAnimal(id));
  const body=el('div');
  body.innerHTML=`<div class="help" style="margin-bottom:10px">${ICON.info}<span>Pick who's going to <b>${esc(s.name)}</b>. Fill in division, class and weight per animal afterward — just tap an entry.</span></div><div id="rosterPick"></div>`;
  mountAnimalPicker($('#rosterPick',body), sel);
  const foot=el('div'); foot.innerHTML=`<button class="btn primary" data-save style="flex:1">Save roster</button>`;
  const sh=openSheet({title:'Who’s going',body,foot});
  $('[data-save]',sh).onclick=()=>{
    let added=0, removed=0, keptResult=0;
    sel.forEach(aid=>{ if(!entered.some(e=>e.animalId===aid)){ DB.entries.push(stamp({id:uid('en'),animalId:aid,showId,division:'',cls:'',showWeight:'',exhibitor:me().name,result:{}})); added++; } });
    entered.forEach(e=>{ if(!sel.includes(e.animalId)){ if(e.result&&e.result.placing){ keptResult++; } else { DB.entries=DB.entries.filter(x=>x.id!==e.id); removed++; } } });
    logAct('show','Updated roster: '+s.name); save(); closeSheet();
    toast(`${added} added${removed?' · '+removed+' removed':''}${keptResult?' · '+keptResult+' kept (has result)':''}`,'good'); render();
  };
}
function openShowSheet(id){
  const s=id?{...DB.shows.find(x=>x.id===id)}:{name:'',start:todayISO(),type:'Jackpot'};
  const body=el('div');
  body.innerHTML=`<div class="field"><label>Show name *</label><input class="control" id="shName" value="${esc(s.name)}"></div>
    <div class="field-row"><div class="field" style="flex:1"><label>Type</label><select class="control" id="shType">${['Jackpot','County Fair','State Fair','Major','Breed Show','Prospect Show','Other'].map(t=>`<option ${s.type===t?'selected':''}>${t}</option>`).join('')}</select></div><div class="field" style="flex:1"><label>Location</label><input class="control" id="shLoc" value="${esc(s.location||'')}"></div></div>
    <div class="field-row"><div class="field" style="flex:1"><label>Start</label><input class="control" type="date" id="shStart" value="${s.start}"></div><div class="field" style="flex:1"><label>End</label><input class="control" type="date" id="shEnd" value="${s.end||''}"></div></div>
    <div class="field-row"><div class="field" style="flex:1"><label>Entry deadline</label><input class="control" type="date" id="shDl" value="${s.entryDeadline||''}"></div><div class="field" style="flex:1"><label>Weigh-in</label><input class="control" type="date" id="shWi" value="${s.weighIn||''}"></div></div>
    <div class="field-row"><div class="field" style="flex:1"><label>Judge</label><input class="control" id="shJudge" value="${esc(s.judge||'')}"></div><div class="field" style="flex:1"><label>Entry fee</label><input class="control" type="number" id="shFee" value="${s.fee||''}"></div></div>
    <div class="field"><label>Organization</label><input class="control" id="shOrg" value="${esc(s.org||'')}"></div>`;
  const foot=el('div'); foot.innerHTML=`${id?`<button class="btn danger" data-del>${ICON.trash}</button>`:''}<button class="btn primary" data-save style="flex:1">Save show</button>`;
  const sh=openSheet({title:id?'Edit show':'New show',body,foot});
  $('[data-save]',sh).onclick=()=>{ const data={name:$('#shName',body).value.trim(),type:$('#shType',body).value,location:$('#shLoc',body).value.trim(),start:$('#shStart',body).value,end:$('#shEnd',body).value,entryDeadline:$('#shDl',body).value,weighIn:$('#shWi',body).value,judge:$('#shJudge',body).value.trim(),fee:$('#shFee',body).value||null,org:$('#shOrg',body).value.trim()}; if(!data.name){toast('Name the show','bad');return;}
    if(id){Object.assign(DB.shows.find(x=>x.id===id),data);}else{DB.shows.push(stamp({id:uid('show'),...data}));} logAct('show','Show: '+data.name); save(); closeSheet(); toast('Show saved','good'); render(); };
  if($('[data-del]',sh))$('[data-del]',sh).onclick=async()=>{ if(await confirmSheet('Delete show','Remove this show and its entries?','Delete',true)){DB.entries=DB.entries.filter(e=>e.showId!==id);DB.shows=DB.shows.filter(x=>x.id!==id);save();closeSheet();go('/shows');} };
}

/* ===================================================================
   LAYOVER — central-barn staging before big shows. Track the breeder's
   time-specific directions (water, snack, feed, supplement, wash, walk…)
   per animal as a timestamped care log that builds historical data.
   =================================================================== */
route('layovers',()=>{
  const v=setView('','more'); const wrap=el('div');
  const lays=(DB.layovers||[]).slice().sort((a,b)=>a.start<b.start?1:-1);
  wrap.innerHTML=pageHeader('Layover',null,`<button class="btn primary sm" id="addLay">${ICON.plus} New</button>`);
  wrap.append(htmlToFrag(`<div class="help" style="margin-bottom:12px">${ICON.info}<span>A layover is a staging period at a central barn before a show. Log the breeder's directions here — every entry is timestamped so you build a routine you can review and repeat.</span></div>`));
  if(!lays.length){ wrap.append(htmlToFrag(emptyState(ICON.layover,'No layovers yet','Create one when you drop animals at the breeder’s barn, then log each direction as it comes.'))); }
  else { const L=el('div','list'); lays.forEach(l=>{ const active=l.start<=todayISO()&&(!l.end||l.end>=todayISO()); const cnt=careForLayover(l.id).length; const done=careForLayover(l.id).filter(c=>c.done).length; const li=el('div','li');
    li.innerHTML=`<div class="thumb" style="color:var(--purple-3)">${ICON.layover}</div><div class="main"><div class="t1">${esc(l.name)}${active?' <span class="pill good" style="font-size:9px">Active</span>':''}</div><div class="t2">${fmtShort(l.start)}${l.end&&l.end!==l.start?'–'+fmtShort(l.end):''} · ${(l.animalIds||[]).length} animals · ${done}/${cnt} logged</div></div>${ICON.chev}`;
    li.onclick=()=>go('/layover/'+l.id); L.append(li); }); wrap.append(L); }
  v.append(wrap);
  $('#addLay',wrap).onclick=()=>openLayoverSheet();
});

route('layover',(parts,q)=>{
  const l=getLayover(parts[1]); if(!l){ go('/layovers'); return; }
  const v=setView('','more');
  const days=layoverDays(l);
  let day=q.get('day')||(days.includes(todayISO())?todayISO():days[0])||l.start;
  let animalId=q.get('a')||'all';
  const wrap=el('div'); v.append(wrap);
  const draw=()=>{
    const ids=(l.animalIds||[]);
    let items=careForLayover(l.id).filter(c=>c.date===day);
    if(animalId!=='all') items=items.filter(c=>c.animalId===animalId);
    items.sort(careSort);
    wrap.innerHTML=`${pageHeader(l.name,'/layovers',`<button class="iconbtn" style="background:var(--line-2);color:var(--ink)" id="edLay">${ICON.edit}</button>`)}
      <div class="card pad">
        ${[['Breeder',l.breeder],['Barn / location',l.location],['Target show',l.showId?(DB.shows.find(s=>s.id===l.showId)||{}).name:''],['Dates',fmtDate(l.start)+(l.end&&l.end!==l.start?' – '+fmtDate(l.end):'')]].filter(r=>r[1]).map(r=>`<div class="kv"><span class="k">${r[0]}</span><span class="v">${esc(r[1])}</span></div>`).join('')||'<div style="color:var(--muted);font-size:13px">Tap edit to add breeder, barn and dates.</div>'}
      </div>
      ${days.length>1?`<div class="chips" id="dayChips">${days.map((d,i)=>`<button class="chip ${d===day?'active':''}" data-day="${d}">Day ${i+1} · ${fmtShort(d)}</button>`).join('')}</div>`:''}
      <div class="chips" id="anChips"><button class="chip ${animalId==='all'?'active':''}" data-an="all">All animals</button>${ids.map(id=>{const a=getAnimal(id);return a?`<button class="chip ${animalId===id?'active':''}" data-an="${id}">${esc(a.name)}</button>`:''}).join('')}</div>
      <div class="btn-row" style="margin:2px 0 12px"><button class="btn primary" id="logCare" style="flex:1">${ICON.plus} Log care</button><button class="btn" id="schedCare">${ICON.clock} Schedule</button></div>
      <div id="careBody"></div>`;
    $('#edLay',wrap).onclick=()=>openLayoverSheet(l.id);
    $$('[data-day]',wrap).forEach(b=>b.onclick=()=>{day=b.dataset.day;draw();});
    $$('[data-an]',wrap).forEach(b=>b.onclick=()=>{animalId=b.dataset.an;draw();});
    $('#logCare',wrap).onclick=()=>openCareSheet({layoverId:l.id, date:day, animalIds:animalId!=='all'?[animalId]:[...ids], markDone:true});
    $('#schedCare',wrap).onclick=()=>openCareSheet({layoverId:l.id, date:day, animalIds:animalId!=='all'?[animalId]:[...ids], markDone:false});
    const cb=$('#careBody',wrap);
    if(!ids.length){ cb.innerHTML=emptyState(ICON.animals,'No animals on this layover','Tap edit to add the animals staged at the breeder’s barn.'); return; }
    if(!items.length){ cb.innerHTML=emptyState(ICON.clock,'Nothing logged for this day','Tap “Log care” each time the breeder gives a direction — it’s stamped with the time automatically.'); return; }
    cb.innerHTML='';
    if(animalId==='all'){ // group by animal
      const byAn={}; items.forEach(c=>(byAn[c.animalId]=byAn[c.animalId]||[]).push(c));
      Object.keys(byAn).forEach(aid=>{ const a=getAnimal(aid); cb.append(htmlToFrag(`<div class="section-title" style="margin-top:6px">${esc(a?a.name:'—')}</div>`)); cb.append(careTimeline(byAn[aid])); });
    } else cb.append(careTimeline(items));
  };
  draw();
});

function careTimeline(items){
  const box=el('div','timeline'); box.style.marginTop='4px';
  items.slice().sort(careSort).forEach(c=>{ const cat=careCat(c.category); const a=getAnimal(c.animalId);
    const it=el('div','tl-item');
    const t = c.done ? (c.doneAt?new Date(c.doneAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):(c.time||'')) : (c.time||'');
    it.innerHTML=`<div class="node" style="border-color:${cat.color};color:${cat.color}">${ICON[cat.icon]}</div>
      <div style="display:flex;align-items:flex-start;gap:8px">
        <button class="thumb" data-done style="width:26px;height:26px;border-radius:8px;flex:none;background:${c.done?'var(--good)':'var(--line-2)'};color:${c.done?'#fff':'var(--muted)'};display:grid;place-items:center">${c.done?ICON.check:ICON.clock}</button>
        <div style="flex:1">
          <div class="tl-t">${esc(c.category)}${c.title?': '+esc(c.title):''}</div>
          <div class="tl-d">${c.done?'Done '+t:(c.time?'Scheduled '+c.time:'Logged')}${c.by?' · '+esc(userName(c.by)):''}</div>
          ${c.detail?`<div class="tl-b">${esc(c.detail)}</div>`:''}
          ${c.notes?`<div class="tl-b" style="color:var(--muted)">“${esc(c.notes)}”</div>`:''}
        </div></div>`;
    $('[data-done]',it).onclick=(e)=>{ e.stopPropagation(); c.done=!c.done; c.doneAt=c.done?nowISO():null; if(c.done&&!c.by)c.by=DB.currentUserId; touch(c); logAct('care',(c.done?'Did ':'Unchecked ')+c.category+(a?' · '+a.name:''),c.animalId); save(); render(); };
    it.querySelector('div').style.cursor='pointer';
    it.querySelector('.tl-t').onclick=()=>openCareSheet({edit:c.id});
    box.append(it);
  });
  return box;
}

function openLayoverSheet(id){
  if(!can('edit')){ toast('Your role can’t manage layovers','bad'); return; }
  const l=id?{...getLayover(id), animalIds:[...(getLayover(id).animalIds||[])]}:{name:'',start:todayISO(),end:todayISO(),animalIds:[]};
  const body=el('div');
  const draw=()=>{
    body.innerHTML=`
      <div class="field"><label>Layover name *</label><input class="control" id="loName" value="${esc(l.name)}" placeholder="State Fair Layover 2026"></div>
      <div class="field-row"><div class="field" style="flex:1"><label>Start</label><input class="control" type="date" id="loStart" value="${l.start||''}"></div>
        <div class="field" style="flex:1"><label>End</label><input class="control" type="date" id="loEnd" value="${l.end||''}"></div></div>
      <div class="field-row"><div class="field" style="flex:1"><label>Breeder</label><input class="control" id="loBreeder" value="${esc(l.breeder||'')}"></div>
        <div class="field" style="flex:1"><label>Barn / location</label><input class="control" id="loLoc" value="${esc(l.location||'')}"></div></div>
      <div class="field"><label>Target show</label><select class="control" id="loShow"><option value="">— none —</option>${DB.shows.map(s=>`<option value="${s.id}" ${l.showId===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Animals at this layover</label>
        <div class="chips" style="flex-wrap:wrap;white-space:normal">${activeAnimals().map(a=>`<button type="button" class="chip ${l.animalIds.includes(a.id)?'active':''}" data-tog="${a.id}">${esc(a.name)}</button>`).join('')||'<span style="font-size:12px;color:var(--muted)">No active animals</span>'}</div></div>
      <div class="field"><label>Notes</label><textarea class="control" id="loNotes">${esc(l.notes||'')}</textarea></div>`;
    $$('[data-tog]',body).forEach(b=>b.onclick=()=>{ const aid=b.dataset.tog; if(l.animalIds.includes(aid))l.animalIds=l.animalIds.filter(x=>x!==aid); else l.animalIds.push(aid); collect(); draw(); });
  };
  const collect=()=>{ l.name=$('#loName',body).value.trim(); l.start=$('#loStart',body).value; l.end=$('#loEnd',body).value; l.breeder=$('#loBreeder',body).value.trim(); l.location=$('#loLoc',body).value.trim(); l.showId=$('#loShow',body).value||null; l.notes=$('#loNotes',body).value; };
  draw();
  const foot=el('div'); foot.innerHTML=`${id?`<button class="btn danger" data-del>${ICON.trash}</button>`:''}<button class="btn primary" data-save style="flex:1">${id?'Save':'Create layover'}</button>`;
  const sh=openSheet({title:id?'Edit layover':'New layover',body,foot});
  $('[data-save]',sh).onclick=()=>{ collect(); if(!l.name){toast('Name the layover','bad');return;} if(l.end&&l.start&&l.end<l.start)l.end=l.start;
    if(id){ Object.assign(getLayover(id),l); touch(getLayover(id)); } else { const rec=stamp({id:uid('lay'),...l}); DB.layovers.push(rec); id=rec.id; }
    logAct('layover','Layover: '+l.name); save(); closeSheet(); toast('Layover saved','good'); go('/layover/'+id); };
  if($('[data-del]',sh))$('[data-del]',sh).onclick=async()=>{ if(await confirmSheet('Delete layover','Remove this layover and its care log? The animals and their other records are untouched.','Delete',true)){ DB.care=DB.care.filter(c=>c.layoverId!==id); DB.layovers=DB.layovers.filter(x=>x.id!==id); save(); closeSheet(); go('/layovers'); } };
}

/* Care entry sheet — opts: {layoverId, date, animalId, markDone} or {edit:careId} */
function openCareSheet(opts){
  if(!can('addRecord')){ toast('Your role can’t log care','bad'); return; }
  const editing = !!opts.edit;
  const c = editing ? {...DB.care.find(x=>x.id===opts.edit)}
    : { layoverId:opts.layoverId||null, animalId:opts.animalId||null, category:'Water', title:'', detail:'', date:opts.date||todayISO(), time:nowTime(), done:!!opts.markDone, notes:'' };
  const animals = c.layoverId ? (getLayover(c.layoverId)?.animalIds||[]).map(getAnimal).filter(Boolean) : activeAnimals();
  // New entries can fan out across animals — a breeder direction rarely applies to just one head.
  let selected = editing ? [] :
    (Array.isArray(opts.animalIds)&&opts.animalIds.length ? opts.animalIds.slice()
     : opts.animalId ? [opts.animalId]
     : animals.map(a=>a.id));
  selected = selected.filter(id=>animals.some(a=>a.id===id));
  const animalField = editing
    ? (animals.length?`<div class="field"><label>Animal</label><select class="control" id="caAnimal">${animals.map(a=>`<option value="${a.id}" ${c.animalId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div>`:'')
    : (animals.length?`<div class="field"><label>Animals <span id="caCount" style="color:var(--muted);font-weight:600"></span></label>
        <div style="display:flex;gap:8px;margin-bottom:6px"><button type="button" class="chip sm" id="caAll">Select all</button><button type="button" class="chip sm" id="caNone">Clear</button></div>
        <div class="chips" id="caAnimals" style="flex-wrap:wrap;white-space:normal">${animals.map(a=>`<button type="button" class="chip ${selected.includes(a.id)?'active':''}" data-an="${a.id}">${esc(a.name)}</button>`).join('')}</div></div>`
      : '');
  const body=el('div');
  body.innerHTML=`
    ${animalField}
    <div class="field"><label>What did the breeder direct?</label>
      <div class="chips" id="caCats" style="flex-wrap:wrap;white-space:normal">${CARE_CATS.map(cat=>`<button type="button" class="chip ${c.category===cat.key?'active':''}" data-cat="${cat.key}"><span style="width:15px;height:15px;color:${c.category===cat.key?'#fff':cat.color}">${ICON[cat.icon]}</span>${cat.key}</button>`).join('')}</div></div>
    <div class="field"><label>Detail / amount</label><input class="control" id="caDetail" value="${esc(c.detail||'')}" placeholder="e.g. 2 oz Game On · walk 15 min · rinse & blow out"></div>
    <div class="field-row"><div class="field" style="flex:1"><label>Date</label><input class="control" type="date" id="caDate" value="${c.date}"></div>
      <div class="field" style="flex:1"><label>Time</label><input class="control" type="time" id="caTime" value="${c.time||nowTime()}"></div></div>
    <label class="li" style="border:1px solid var(--line);border-radius:12px;margin-bottom:12px"><div class="main"><div class="t1" style="font-size:14px">Mark done now</div><div class="t2">Stamps the actual time it was completed</div></div><input type="checkbox" id="caDone" ${c.done?'checked':''} style="width:22px;height:22px"></label>
    <div class="field"><label>Notes / how they responded</label><textarea class="control" id="caNotes" placeholder="drank well · stayed fresh · a little hot">${esc(c.notes||'')}</textarea></div>`;
  let cat=c.category;
  $$('[data-cat]',body).forEach(b=>b.onclick=()=>{ cat=b.dataset.cat; $$('[data-cat]',body).forEach(x=>{ const cc=careCat(x.dataset.cat); x.classList.toggle('active',x===b); const sp=x.querySelector('span'); if(sp)sp.style.color=(x===b)?'#fff':cc.color; }); });
  // multi-animal picker (new entries) — log the same direction across several head at once
  const syncCount=()=>{ const el2=$('#caCount',body); if(el2)el2.textContent=selected.length?('· '+selected.length+' selected'):'· none'; };
  if(!editing){
    const paint=()=>{ $$('#caAnimals [data-an]',body).forEach(b=>b.classList.toggle('active',selected.includes(b.dataset.an))); syncCount(); };
    $$('#caAnimals [data-an]',body).forEach(b=>b.onclick=()=>{ const id=b.dataset.an; if(selected.includes(id))selected=selected.filter(x=>x!==id); else selected.push(id); paint(); });
    if($('#caAll',body))$('#caAll',body).onclick=()=>{ selected=animals.map(a=>a.id); paint(); };
    if($('#caNone',body))$('#caNone',body).onclick=()=>{ selected=[]; paint(); };
    syncCount();
  }
  const foot=el('div'); foot.innerHTML=`${editing?`<button class="btn danger" data-del>${ICON.trash}</button>`:''}<button class="btn primary" data-save style="flex:1">${editing?'Save':'Log it'}</button>`;
  const sh=openSheet({title:editing?'Edit care entry':'Log care',body,foot});
  $('[data-save]',sh).onclick=()=>{
    const data={ category:cat, title:'', detail:$('#caDetail',body).value.trim(), date:$('#caDate',body).value, time:$('#caTime',body).value, notes:$('#caNotes',body).value.trim(), done:$('#caDone',body).checked };
    if(editing){
      const rec=DB.care.find(x=>x.id===opts.edit);
      data.animalId = $('#caAnimal',body) ? $('#caAnimal',body).value : rec.animalId;
      Object.assign(rec,data); if(data.done&&!rec.doneAt)rec.doneAt=nowISO(); if(!data.done)rec.doneAt=null; touch(rec);
      logAct('care',(data.done?'Logged ':'Scheduled ')+data.category+(data.detail?' · '+data.detail:''),data.animalId);
      save(); closeSheet(); toast('Care updated','good'); render(); return;
    }
    // new — fan the direction out to each selected animal as its own timestamped entry
    if(!selected.length){ toast('Pick at least one animal','bad'); return; }
    selected.forEach(aid=>{ const rec=stamp({id:uid('care'),layoverId:c.layoverId,by:DB.currentUserId,...data,animalId:aid}); if(data.done)rec.doneAt=nowISO(); DB.care.push(rec); });
    logAct('care',(data.done?'Logged ':'Scheduled ')+data.category+(data.detail?' · '+data.detail:'')+(selected.length>1?' · '+selected.length+' animals':''), selected[0]);
    save(); closeSheet(); toast(selected.length>1?('Logged for '+selected.length+' animals'):'Care logged','good'); render();
  };
  if($('[data-del]',sh))$('[data-del]',sh).onclick=async()=>{ if(await confirmSheet('Delete entry','Remove this care entry?','Delete',true)){ DB.care=DB.care.filter(x=>x.id!==opts.edit); save(); closeSheet(); render(); } };
}

/* ===================================================================
   HELPERS — people who help feed / guide specific animals. Assignable
   per animal, filterable, with a per-helper snapshot you can share.
   =================================================================== */
route('helpers',()=>{
  const v=setView('','more'); const wrap=el('div');
  const helpers=(DB.helpers||[]).slice().sort((a,b)=>a.name.localeCompare(b.name));
  wrap.innerHTML=pageHeader('Helpers',null,`<button class="btn primary sm" id="addHelper">${ICON.plus} Add</button>`);
  wrap.append(htmlToFrag(`<div class="help" style="margin-bottom:12px">${ICON.info}<span>Add the people who help you feed out or guide specific animals, then tag each animal with its helper. You can filter the herd by helper and share a snapshot of just their animals.</span></div>`));
  if(!helpers.length){ wrap.append(htmlToFrag(emptyState(ICON.team,'No helpers yet','Add someone like Blake Goss or Casey Sidwell, then assign them to the animals they help with.'))); }
  else { const L=el('div','list'); helpers.forEach(h=>{ const n=animalsForHelper(h.id).filter(a=>!a.archived).length; const li=el('div','li');
    li.innerHTML=`<div class="thumb" style="background:var(--line-2);color:var(--purple)">${esc(initials(h.name))}</div><div class="main"><div class="t1">${esc(h.name)}</div><div class="t2">${n} animal${n===1?'':'s'}${h.note?' · '+esc(h.note):''}</div></div>${ICON.chev}`;
    li.onclick=()=>go('/helper/'+h.id); L.append(li); }); wrap.append(L); }
  v.append(wrap);
  $('#addHelper',wrap).onclick=()=>openHelperSheet();
});
function openHelperSheet(id){
  if(!can('edit')){ toast('Your role can’t manage helpers','bad'); return; }
  const h=id?{...getHelper(id)}:{name:'',note:''};
  const body=el('div');
  body.innerHTML=`<div class="field"><label>Name *</label><input class="control" id="hpName" value="${esc(h.name)}" placeholder="Blake Goss"></div>
    <div class="field"><label>Role / note</label><input class="control" id="hpNote" value="${esc(h.note||'')}" placeholder="Swine feeding · phone, etc."></div>`;
  const foot=el('div'); foot.innerHTML=`${id?`<button class="btn danger" data-del>${ICON.trash}</button>`:''}<button class="btn primary" data-save style="flex:1">Save</button>`;
  const sh=openSheet({title:id?'Edit helper':'New helper',body,foot});
  $('[data-save]',sh).onclick=()=>{ const nm=$('#hpName',body).value.trim(); if(!nm){toast('Name required','bad');return;} const note=$('#hpNote',body).value.trim();
    if(id){ Object.assign(getHelper(id),{name:nm,note}); } else { DB.helpers.push(stamp({id:uid('help'),name:nm,note})); }
    save(); closeSheet(); toast('Saved','good'); render(); };
  if($('[data-del]',sh))$('[data-del]',sh).onclick=async()=>{ if(await confirmSheet('Remove helper','Remove '+h.name+'? They’ll be unassigned from all animals; the animals are untouched.','Remove',true)){ DB.animals.forEach(a=>{ if(a.helperIds)a.helperIds=a.helperIds.filter(x=>x!==id); }); DB.helpers=DB.helpers.filter(x=>x.id!==id); save(); closeSheet(); go('/helpers'); } };
}
route('helper',(parts)=>{
  const h=getHelper(parts[1]); if(!h){ go('/helpers'); return; }
  const v=setView('','more'); const wrap=el('div');
  const animals=animalsForHelper(h.id).filter(a=>!a.archived).sort((a,b)=>a.name.localeCompare(b.name));
  wrap.innerHTML=`${pageHeader(h.name,'/helpers',`<button class="iconbtn" style="background:var(--line-2);color:var(--ink)" id="edHelper">${ICON.edit}</button>`)}
    <div class="btn-row" style="margin-bottom:12px"><button class="btn primary" id="viewAll" style="flex:1">${ICON.animals} Filter herd to ${esc(h.name.split(' ')[0])}</button><button class="btn" id="shareSnap">${ICON.share} Share</button></div>
    <div class="section-title">${h.name.split(' ')[0]}’s animals · ${animals.length}</div>
    <div id="hAnimals"></div>`;
  v.append(wrap);
  $('#edHelper',wrap).onclick=()=>openHelperSheet(h.id);
  $('#viewAll',wrap).onclick=()=>go('/animals?helper='+h.id);
  $('#shareSnap',wrap).onclick=()=>helperSnapshot(h.id);
  const hc=$('#hAnimals',wrap);
  if(!animals.length){ hc.innerHTML=emptyState(ICON.animals,'No animals yet','Assign '+h.name+' to animals from each animal’s Edit screen (Helpers field).'); return; }
  animals.forEach(a=>{ const st=animalStats(a); const cf=currentFeed(a.id); const card=el('div','card pad'); card.style.marginBottom='10px';
    card.innerHTML=`<div style="display:flex;align-items:center;gap:10px"><div class="thumb" data-th>${esc(initials(a.name))}</div>
      <div style="flex:1"><div style="font-weight:800">${esc(a.name)}</div><div style="font-size:12px;color:var(--muted)">${esc(speciesName(a.species))} · ${esc(a.breed||'')} · ${esc(a.status)}</div></div>
      <div style="text-align:right">${st.curW!=null?`<div style="font-weight:800" class="tnum">${st.curW} lb</div>`:''}${st.adgLife!=null?`<div style="font-size:11px;color:var(--muted)" class="tnum">${st.adgLife} lb/d</div>`:''}</div></div>
      ${cf?`<div style="margin-top:8px;background:var(--line-2);border-radius:10px;padding:8px 10px;font-size:12.5px"><b>${esc(cf.name)}</b>${cf.objective?' · '+esc(cf.objective):''}${(cf.meals||[]).length?'<br><span style="color:var(--muted)">'+esc((cf.meals||[]).map(m=>m.time+': '+(m.items||[]).map(it=>it.amount+(it.unit||'')+' '+it.product).join(', ')).join(' · '))+'</span>':''}</div>`:''}`;
    if(a.profileMediaId) Media.url(a.profileMediaId).then(u=>{ if(u){ const t=$('[data-th]',card); t.style.backgroundImage=`url(${u})`; t.style.backgroundSize='cover'; t.textContent=''; }});
    card.onclick=()=>go('/animal/'+a.id); hc.append(card); });
});
function helperSnapshot(id){
  const h=getHelper(id); const animals=animalsForHelper(id).filter(a=>!a.archived).sort((a,b)=>a.name.localeCompare(b.name));
  const w=window.open('','_blank');
  const rows=animals.map(a=>{ const st=animalStats(a); const cf=currentFeed(a.id);
    const feed=cf?`<b>${esc(cf.name)}</b>${cf.objective?' ('+esc(cf.objective)+')':''}<br>`+(cf.meals||[]).map(m=>`<span class="muted">${esc(m.time)}:</span> ${esc((m.items||[]).map(it=>it.amount+' '+(it.unit||'')+' '+it.product).join(', '))}`).join('<br>'):'<span class="muted">No current feed program</span>';
    return `<tr><td><b>${esc(a.name)}</b><div class="muted">${esc(speciesName(a.species))} · ${esc(a.breed||'')}${a.earTag?' · Tag '+esc(a.earTag):''}</div></td><td class="num">${st.curW??'—'} lb<div class="muted">${st.adgLife!=null?'ADG '+st.adgLife:''}</div></td><td>${feed}</td></tr>`; }).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(h.name)} — Animals Snapshot</title>
    <style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:820px;margin:20px auto;padding:0 18px;line-height:1.5}
    h1{color:#4C1D95;margin-bottom:2px}.sub{color:#777;font-size:13px;margin-bottom:16px}
    table{width:100%;border-collapse:collapse;font-size:13px}td,th{padding:8px 10px;border-bottom:1px solid #eee;text-align:left;vertical-align:top}
    th{background:#f5f5f7;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#555}.num{white-space:nowrap;font-variant-numeric:tabular-nums}.muted{color:#888;font-size:12px}
    @media print{.noprint{display:none}} .btn{background:#4C1D95;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-weight:700;margin-top:18px;cursor:pointer}</style></head>
    <body><h1>${esc(h.name)} — animals I'm helping with</h1><div class="sub">${esc(DB.team.name)} · ${fmtDate(todayISO())} · ${animals.length} animal${animals.length===1?'':'s'}</div>
    ${animals.length?`<table><tr><th>Animal</th><th>Weight</th><th>Current feed program</th></tr>${rows}</table>`:'<p class="muted">No animals assigned yet.</p>'}
    <button class="btn noprint" onclick="window.print()">Print / Save as PDF</button>
    <p class="noprint muted" style="margin-top:10px">Tip: “Save as PDF” or screenshot this to text it to ${esc(h.name.split(' ')[0])}.</p>
    </body></html>`);
  w.document.close();
}

/* ===================================================================
   REPORTS
   =================================================================== */
route('reports',()=>{
  const v=setView('','reports'); const active=activeAnimals();
  const adgRows=active.map(a=>({a,st:animalStats(a)})).filter(r=>r.st.adgLife!=null).sort((x,y)=>y.st.adgLife-x.st.adgLife);
  const manualExp=DB.expenses.reduce((s,e)=>s+(+e.amount||0),0);
  const totalFeed=DB.animals.reduce((s,a)=>s+feedCostForAnimal(a.id),0);
  const totalBed=beddingTotal();
  const totalInvest=manualExp+totalFeed+totalBed;
  const totalIncome=DB.income.reduce((s,e)=>s+(+e.amount||0),0);
  const totGain=active.reduce((s,a)=>{const st=animalStats(a);return s+(st.gainTotal>0?st.gainTotal:0);},0);
  const feedCog=totGain>0?totalFeed/totGain:null;
  const weighedThisWeek=active.filter(a=>{const ws=weightsFor(a.id);return ws.length&&daysBetween(ws[ws.length-1].date,todayISO())<7;}).length;
  const results=DB.entries.filter(e=>e.result&&e.result.placing);
  const wrap=el('div');
  wrap.innerHTML=`${pageHeader('Reports')}
    <div class="grid g2">
      <div class="stat"><div class="k">Weekly weigh-in</div><div class="v tnum">${weighedThisWeek}<small>/${active.length}</small></div><div class="sub">completed this week</div></div>
      <div class="stat"><div class="k">Avg herd ADG</div><div class="v tnum">${adgRows.length?round(adgRows.reduce((s,r)=>s+r.st.adgLife,0)/adgRows.length,2):'—'}</div><div class="sub">lb/day</div></div>
      <div class="stat"><div class="k">Total invested</div><div class="v tnum" style="font-size:20px">${money(totalInvest)}</div><div class="sub">${totalFeed>0?money(totalFeed)+' feed':''}</div></div>
      <div class="stat"><div class="k">Net result</div><div class="v tnum" style="font-size:20px;color:${totalIncome-totalInvest>=0?'var(--good)':'var(--ink)'}">${money(totalIncome-totalInvest)}</div><div class="sub">${feedCog!=null?money(feedCog)+'/lb feed cost of gain':''}</div></div>
    </div>
    <div class="section-title">Average daily gain ranking</div>
    <div class="card pad">${adgRows.length?barChart(adgRows.map(r=>({label:r.a.name,value:r.st.adgLife,disp:r.st.adgLife+' lb/d',color:'var(--purple-3)'}))):'<div class="empty" style="padding:14px">Add weights to rank ADG.</div>'}</div>
    <div class="section-title">Active by species</div>
    <div class="card pad">${barChart(DB.species.filter(s=>s.active).map(s=>({label:s.name,value:active.filter(a=>a.species===s.id).length,color:'var(--teal-3)'})))}</div>
    <div class="section-title">Show results</div>
    <div class="card pad">${results.length?results.map(e=>{const a=getAnimal(e.animalId);const sh=DB.shows.find(x=>x.id===e.showId);return `<div class="kv"><span class="k">${esc(a?a.name:'')} · ${esc(sh?sh.name:'')}</span><span class="v">${esc(e.result.placing)}${e.result.divisionPlacing?' · '+esc(e.result.divisionPlacing):''}</span></div>`;}).join(''):'<div class="empty" style="padding:14px">No results recorded.</div>'}</div>
    <div class="section-title">Export</div>
    <div class="grid g2">
      <button class="btn" id="expSeason">${ICON.reports} Season summary</button>
      <button class="btn" id="expCsv">${ICON.download} CSV export</button>
      <button class="btn" id="expWeights">${ICON.weight} Weights CSV</button>
      <button class="btn" id="expBackup">${ICON.boxes} Full backup</button>
    </div>
    <div style="height:8px"></div>`;
  v.append(wrap);
  $('#expSeason',wrap).onclick=()=>openSeasonPicker();
  $('#expCsv',wrap).onclick=()=>exportAnimalsCSV();
  $('#expWeights',wrap).onclick=()=>exportWeightsCSV();
  $('#expBackup',wrap).onclick=()=>exportBackup();
});
function openSeasonPicker(){
  const body=el('div'); const L=el('div','list'); DB.animals.forEach(a=>{ const li=animalRow(a,ICON.chev); li.onclick=()=>{closeSheet();seasonSummary(a.id);}; L.append(li); }); body.append(L);
  openSheet({title:'Season summary — pick animal',body});
}
function seasonSummary(id){
  const a=getAnimal(id); const st=animalStats(a); const ws=weightsFor(id); const progs=feedFor(id); const ent=DB.entries.filter(e=>e.animalId===id);
  const manual=DB.expenses.filter(e=>e.animalId===id).reduce((s,e)=>s+(+e.amount||0),0); const inc=DB.income.filter(e=>e.animalId===id).reduce((s,e)=>s+(+e.amount||0),0);
  const fb=animalFeedBedding(id); const exp=manual+fb.feed+fb.bedding;
  const w=window.open('','_blank');
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(a.name)} — Season Summary</title>
    <style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:800px;margin:20px auto;padding:0 20px;line-height:1.5}
    h1{color:#4C1D95}h2{color:#0D9488;border-bottom:2px solid #eee;padding-bottom:4px;margin-top:26px;font-size:16px}
    .head{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #4C1D95;padding-bottom:10px}
    table{width:100%;border-collapse:collapse;font-size:13px}td,th{padding:6px 8px;border-bottom:1px solid #eee;text-align:left}
    .grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin:10px 0}.box{background:#f5f5f7;border-radius:10px;padding:10px}.box b{display:block;font-size:20px;color:#4C1D95}
    .muted{color:#777;font-size:12px}@media print{.noprint{display:none}}</style></head>
    <body><div class="head"><h1>${esc(a.name)}${a.barnName?' “'+esc(a.barnName)+'”':''}</h1><div style="text-align:right"><b>${esc(DB.team.name)}</b><div class="muted">Season ${esc(a.season||'')} · ${fmtDate(todayISO())}</div></div></div>
    <p class="muted">${esc(speciesName(a.species))} · ${esc(a.breed)} · ${esc(a.sex||'')}${a.earTag?' · Tag '+esc(a.earTag):''} · Breeder ${esc(a.breeder||'—')}</p>
    <div class="grid"><div class="box"><span class="muted">Start weight</span><b>${st.startW??'—'}</b></div><div class="box"><span class="muted">Final weight</span><b>${st.curW??'—'}</b></div><div class="box"><span class="muted">Total gain</span><b>${st.gainTotal??'—'}</b></div><div class="box"><span class="muted">Lifetime ADG</span><b>${st.adgLife??'—'}</b></div></div>
    <h2>Weight history</h2><table><tr><th>Date</th><th>Weight</th><th>Gain</th><th>ADG</th><th>Notes</th></tr>${ws.map((x,i)=>{const p=ws[i-1];const g=p?round(x.weight-p.weight,1):null;const d=p?daysBetween(p.date,x.date):null;return `<tr><td>${fmtDate(x.date)}</td><td>${x.weight} lb</td><td>${g!=null?(g>0?'+':'')+g:'—'}</td><td>${g!=null&&d>0?round(g/d,2):'—'}</td><td>${esc(x.notes||'')}</td></tr>`;}).join('')}</table>
    <h2>Feed programs</h2>${progs.slice().reverse().map(f=>{const fs=feedProgramStats(f);return `<div style="margin-bottom:12px"><b>${esc(f.name)}</b> <span class="muted">(${esc(f.objective||'')} · ${fmtShort(f.startDate)}–${f.endDate?fmtShort(f.endDate):'now'} · ${fs.days}d · ADG ${fs.adg??'—'})</span><table>${(f.meals||[]).map(m=>`<tr><td style="width:90px"><b>${esc(m.time)}</b></td><td>${(m.items||[]).map(it=>esc(it.product)+' '+it.amount+' '+esc(it.unit)).join(', ')}</td></tr>`).join('')}</table></div>`;}).join('')||'<p class="muted">None</p>'}
    <h2>Shows & results</h2>${ent.length?`<table><tr><th>Show</th><th>Division</th><th>Placing</th><th>Notes</th></tr>${ent.map(e=>{const sh=DB.shows.find(s=>s.id===e.showId);const r=e.result||{};return `<tr><td>${esc(sh?sh.name:'')}</td><td>${esc(e.division||'')}</td><td>${esc(r.placing||'—')}${r.divisionPlacing?' · '+esc(r.divisionPlacing):''}</td><td>${esc(r.bannerNote||r.judgeComments||'')}</td></tr>`;}).join('')}</table>`:'<p class="muted">No shows</p>'}
    <h2>Financials</h2><div class="grid"><div class="box"><span class="muted">Invested</span><b>${money(exp)}</b></div><div class="box"><span class="muted">Income</span><b>${money(inc)}</b></div><div class="box"><span class="muted">Net</span><b>${money(inc-exp)}</b></div><div class="box"><span class="muted">Cost/lb gain</span><b>${st.gainTotal>0?money(exp/st.gainTotal):'—'}</b></div></div>
    <p class="muted">Feed ${money(fb.feed)}${fb.bedding?' · Bedding '+money(fb.bedding):''}${manual?' · Other logged '+money(manual):''}</p>
    ${a.archiveInfo?`<h2>Disposition</h2><p>${esc(a.archiveInfo.finalStatus||'')}${a.archiveInfo.buyer?' · Buyer: '+esc(a.archiveInfo.buyer):''}${a.archiveInfo.salePrice?' · '+money(a.archiveInfo.salePrice):''}<br><span class="muted">${esc(a.archiveInfo.notes||'')}</span></p>`:''}
    <p class="noprint" style="margin-top:24px"><button onclick="window.print()" style="background:#4C1D95;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:700">Print / Save as PDF</button></p>
    </body></html>`;
  w.document.write(html); w.document.close();
}
function download(filename,text,type='text/csv'){ const blob=new Blob([text],{type}); const u=URL.createObjectURL(blob); const a=el('a'); a.href=u; a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(u),1000); toast('Exported '+filename,'good'); }
function csvRow(arr){ return arr.map(v=>{ v=v==null?'':String(v); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; }).join(','); }
function exportAnimalsCSV(){ const rows=[['Name','Barn','Species','Breed','Sex','Status','Start wt','Current wt','ADG','Target wt','Breeder','Ear tag','Season']];
  DB.animals.forEach(a=>{const s=animalStats(a);rows.push([a.name,a.barnName,speciesName(a.species),a.breed,a.sex,a.status,s.startW,s.curW,s.adgLife,a.targetWeight,a.breeder,a.earTag,a.season]);});
  download('dfst-animals.csv',rows.map(csvRow).join('\n')); }
function exportWeightsCSV(){ const rows=[['Animal','Date','Weight','Scale','By','Notes']];
  DB.weights.forEach(w=>{const a=getAnimal(w.animalId);rows.push([a?a.name:'',w.date,w.weight,w.scale,userName(w.by),w.notes]);});
  download('dfst-weights.csv',rows.map(csvRow).join('\n')); }
function exportBackup(){ download('dfst-backup-'+todayISO()+'.json',JSON.stringify(DB,null,2),'application/json'); }

/* ===================================================================
   TEAM
   =================================================================== */
const ROLE_COLORS={Owner:'#4C1D95',Administrator:'#6D28D9',Editor:'#0D9488',Contributor:'#0891B2',Viewer:'#6B7280',Advisor:'#B45309'};
route('team',()=>{
  const v=setView('','team'); const wrap=el('div');
  wrap.innerHTML=`${pageHeader('Team',null,can('invite')?`<button class="btn primary sm" id="inv">${ICON.plus} Invite</button>`:'')}
    <div class="card pad" style="background:linear-gradient(135deg,var(--purple-2),var(--purple));color:#fff;border:none">
      <div style="display:flex;align-items:center;gap:12px"><div class="brandmark" style="width:44px;height:44px">${brandImg()}</div>
      <div><div style="font-weight:800;font-size:16px">${esc(DB.team.name)}</div><div style="font-size:12px;opacity:.85">${DB.users.length} member${DB.users.length===1?'':'s'} · ${activeAnimals().length} active animals</div></div></div>
    </div>
    <div class="section-title">Members</div><div id="members"></div>
    <div class="section-title">Advisor recommendations</div><div id="recs"></div>`;
  v.append(wrap);
  if($('#inv',wrap))$('#inv',wrap).onclick=()=>openInvite();
  const L=el('div','list');
  DB.users.forEach(u=>{ const assigned=u.role==='Advisor'?DB.animals.filter(a=>a.advisorId===u.id).length:null; const li=el('div','li');
    li.innerHTML=`<div class="thumb" style="background:${ROLE_COLORS[u.role]||'var(--muted)'};color:#fff">${esc(initials(u.name))}</div>
      <div class="main"><div class="t1">${esc(u.name)}${u.id===DB.currentUserId?' <span class="pill gray" style="font-size:9px">You</span>':''}</div><div class="t2">${esc(u.email||'')}${assigned!=null?' · '+assigned+' animals':''}${u.invited&&!u.verified?' · invite pending':''}</div></div>
      <span class="badge-role" style="background:${ROLE_COLORS[u.role]}22;color:${ROLE_COLORS[u.role]}">${esc(u.role)}</span>`;
    if(can('manageTeam'))li.onclick=()=>openMemberSheet(u.id); L.append(li); });
  $('#members',wrap).append(L);
  const rc=$('#recs',wrap); const recs=DB.recs.slice().sort((a,b)=>a.date<b.date?1:-1);
  if(!recs.length)rc.innerHTML='<div class="empty" style="padding:14px">No advisor recommendations yet.</div>';
  else recs.forEach(r=>{ const a=getAnimal(r.animalId); const card=el('div','card pad'); card.style.marginBottom='10px';
    card.innerHTML=`<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span class="pill p" style="font-size:10px">${esc(userName(r.advisorId))} · ${esc(r.type||'Rec')}</span>${r.urgent?'<span class="pill bad" style="font-size:10px">Urgent</span>':`<span class="pill ${r.status==='accepted'?'good':r.status==='declined'?'gray':'warn'}" style="font-size:10px">${esc(r.status)}</span>`}</div>
      <div style="font-weight:700;font-size:13px;margin-bottom:2px">${esc(a?a.name:'')}</div><div style="font-size:14px;line-height:1.5">${esc(r.text)}</div>`;
    if(r.status==='pending'&&can('edit')){ const bar=el('div','btn-row'); bar.style.marginTop='10px'; bar.innerHTML=`<button class="btn sm teal" data-acc>${ICON.check} Accept</button><button class="btn sm ghost" data-dec>Decline</button>`;
      $('[data-acc]',bar).onclick=()=>{r.status='accepted';logAct('advisor','Accepted rec for '+(a?a.name:''),r.animalId);save();toast('Recommendation accepted','good');render();};
      $('[data-dec]',bar).onclick=()=>{r.status='declined';save();render();}; card.append(bar); }
    rc.append(card); });
});
function openInvite(){ const body=el('div');
  body.innerHTML=`<div class="field"><label>Email</label><input class="control" id="ivEmail" type="email" placeholder="name@example.com"></div>
    <div class="field"><label>Name</label><input class="control" id="ivName" placeholder="Optional"></div>
    <div class="field"><label>Role</label><select class="control" id="ivRole">${['Administrator','Editor','Contributor','Viewer','Advisor'].map(r=>`<option>${r}</option>`).join('')}</select></div>
    <div class="help">${ICON.info}<span>They'll get their own secure login. Advisors only see the animals you assign to them.</span></div>`;
  const foot=el('div'); foot.innerHTML=`<button class="btn primary" data-save style="flex:1">Send invite</button>`;
  const sh=openSheet({title:'Invite member',body,foot});
  $('[data-save]',sh).onclick=async()=>{ const e=$('#ivEmail',body).value.trim(); if(!e){toast('Enter email','bad');return;}
    const role=$('#ivRole',body).value;
    DB.users.push({id:'pending_'+e.toLowerCase(),name:$('#ivName',body).value.trim()||e.split('@')[0],email:e,role,invited:true,verified:false}); logAct('team','Invited '+e);
    if(Cloud.enabled && Cloud.teamId){ try{ const {error}=await Cloud.sb.from('team_invites').upsert({ team_id:Cloud.teamId, email:e.toLowerCase(), role }, {onConflict:'team_id,email'}); if(error)throw error; save(); closeSheet(); toast('Invite sent — they can sign up with '+e,'good'); render(); }
      catch(err){ save(); closeSheet(); toast('Saved locally; invite sync failed: '+err.message,'bad'); render(); } }
    else { save(); closeSheet(); toast('Invite added (connect cloud to send)','good'); render(); }
  };
}
function openMemberSheet(uid_){ const u=DB.users.find(x=>x.id===uid_);
  const body=el('div');
  body.innerHTML=`<div class="field"><label>Name</label><input class="control" id="mbName" value="${esc(u.name)}"></div>
    <div class="field"><label>Role</label><select class="control" id="mbRole">${ROLES.map(r=>`<option ${u.role===r?'selected':''}>${r}</option>`).join('')}</select></div>
    <div class="help">${ICON.info}<span>${esc(roleDesc(u.role))}</span></div>`;
  const foot=el('div'); foot.innerHTML=`${u.id!==DB.currentUserId&&u.role!=='Owner'?`<button class="btn danger" data-del>Remove</button>`:''}<button class="btn primary" data-save style="flex:1">Save</button>`;
  const sh=openSheet({title:u.name,body,foot});
  $('#mbRole',body).onchange=()=>$('.help span',body).textContent=roleDesc($('#mbRole',body).value);
  $('[data-save]',sh).onclick=()=>{ u.name=$('#mbName',body).value.trim(); u.role=$('#mbRole',body).value; save(); closeSheet(); toast('Saved','good'); render(); };
  if($('[data-del]',sh))$('[data-del]',sh).onclick=async()=>{ if(await confirmSheet('Remove member','Remove '+u.name+' from the team?','Remove',true)){DB.users=DB.users.filter(x=>x.id!==uid_);save();closeSheet();render();} };
}
function roleDesc(r){ return {Owner:'Full access — manage team, billing, and everything.',Administrator:'Manage animals, records, most settings; can invite.',Editor:'Add and edit animals, weights, feed, media, notes, results.',Contributor:'Add weights, feed, media and notes; view records.',Viewer:'View approved animals, progress and reports only.',Advisor:'View assigned animals and leave recommendations only.'}[r]||''; }

/* ===================================================================
   ARCHIVE
   =================================================================== */
route('archive',()=>{
  const v=setView('','archive'); const arch=DB.animals.filter(a=>a.archived);
  const wrap=el('div'); wrap.innerHTML=pageHeader('Archive');
  if(!arch.length){ wrap.append(htmlToFrag(emptyState(ICON.archive,'No archived animals','When an animal finishes its show career, archive it here — every record is preserved.'))); }
  else { wrap.append(htmlToFrag(`<p style="font-size:13px;color:var(--muted);margin:0 2px 10px">${arch.length} archived · all records preserved and searchable</p>`));
    const L=el('div','list'); arch.forEach(a=>{ const ai=a.archiveInfo||{}; const li=animalRow(a,`<span class="pill gray" style="font-size:10px">${esc(ai.finalStatus||'Archived')}</span>`, `${esc(a.breed)} · ${ai.date?'archived '+fmtShort(ai.date):''}${ai.salePrice?' · '+money(ai.salePrice):''}`); L.append(li); }); wrap.append(L); }
  v.append(wrap);
});

/* ===================================================================
   SETTINGS + MORE
   =================================================================== */
route('more',()=>{
  const v=setView('','more'); const u=me(); const wrap=el('div');
  wrap.innerHTML=`${pageHeader('More')}
    <div class="card pad" style="display:flex;align-items:center;gap:12px"><div class="thumb" style="width:52px;height:52px;background:${ROLE_COLORS[u.role]};color:#fff;font-size:18px;border-radius:14px">${esc(initials(u.name))}</div>
      <div style="flex:1"><div style="font-weight:800;font-size:16px">${esc(u.name)}</div><div style="font-size:12.5px;color:var(--muted)">${esc(u.email||'')} · ${esc(u.role)}</div></div></div>
    <div class="section-title">Manage</div>
    <div class="list">
      ${moreRow('team',ICON.team,'Team & members')}
      ${moreRow('coach',ICON.target,'Game Plan')}
      ${moreRow('records',ICON.medal,'Record Book')}
      ${moreRow('reports',ICON.reports,'Reports & analytics')}
      ${moreRow('archive',ICON.archive,'Archive')}
      ${moreRow('shows',ICON.shows,'Shows')}
      ${moreRow('layovers',ICON.layover,'Layover care')}
      ${moreRow('medications',ICON.pill,'Medications')}
      ${moreRow('helpers',ICON.team,'Helpers')}
      ${moreRow('__breeds',ICON.dna,'Species & breeds')}
      ${moreRow('costs',ICON.receipt,'Feed & bedding costs')}
      ${moreRow('__notif',ICON.bell,'Notifications')}
      ${moreRow('__settings',ICON.settings,'Team settings')}
    </div>
    <div class="section-title">Sync</div>
    <div class="list">
      ${moreRow('__cloud',ICON.share, Cloud.enabled?'Cloud sync':'Connect to cloud')}
    </div>
    <div class="section-title">Data</div>
    <div class="list">
      ${moreRow('__backup',ICON.download,'Export full backup')}
      ${moreRow('__import',ICON.upload,'Import backup')}
      ${moreRow('__demo',DB.seeded?ICON.check:ICON.boxes,DB.seeded?'Demo animals — keep or remove':'Load demo data')}
    </div>
    <div class="section-title">App</div>
    <div class="list">
      <button class="li" data-more="__update" style="width:100%;text-align:left"><div class="thumb" style="background:var(--line-2);color:var(--purple)">${ICON.refresh}</div><div class="main"><div class="t1">Check for updates</div><div class="t2" id="appVer">Checking version…</div></div>${ICON.chev}</button>
    </div>
    <div style="margin-top:18px"><button class="btn block" id="logout">${ICON.logout} Sign out</button></div>
    <p style="text-align:center;font-size:11px;color:var(--muted);margin-top:16px">${esc(DB.team.name)}${Cloud.enabled?' · Cloud sync on':' · Local-first build'}<br>${Cloud.enabled&&Cloud.teamId?'Shared & synced across your team':'Data stored on this device'}</p>`;
  v.append(wrap);
  $$('[data-more]',wrap).forEach(b=>b.onclick=()=>{ const k=b.dataset.more;
    if(k==='__breeds')openBreeds(); else if(k==='__notif')openNotif(); else if(k==='__settings')openTeamSettings();
    else if(k==='__inventory')openInventory(); else if(k==='__backup')exportBackup();
    else if(k==='__import')importBackup(); else if(k==='__demo')toggleDemo(); else if(k==='__cloud')openCloudConnect(); else if(k==='__update')checkForUpdate(); else go('/'+k); });
  $('#logout',wrap).onclick=async()=>{ if(Cloud.enabled){ await Cloud.signOut(); } DB.currentUserId=null; save(true); render(); };
  appVersion().then(x=>{ const e=$('#appVer',wrap); if(e)e.textContent = x?('Version '+x+' · tap to update'):'Tap to reload the latest'; });
});
/* the running app version = the active service-worker cache key (single source of truth) */
async function appVersion(){ try{ if(!('caches' in window))return null; const keys=await caches.keys(); const k=keys.find(x=>/^dfst-v/.test(x)); return k?k.replace('dfst-',''):null; }catch(e){ return null; } }
/* Force-fetch the newest deploy: re-check the service worker; when a fresh one
   takes control, reload so the new app.js (cache-first) is picked up. If nothing
   changed, say so. Falls back to a plain reload where there's no SW. */
async function checkForUpdate(){
  if(!('serviceWorker' in navigator)){ toast('Reloading…',''); setTimeout(()=>location.reload(),300); return; }
  toast('Checking for updates…','');
  let reg=null; try{ reg = await navigator.serviceWorker.getRegistration() || await navigator.serviceWorker.ready; }catch(e){}
  if(!reg){ location.reload(); return; }
  let done=false; const reload=()=>{ if(done)return; done=true; toast('Updating — reloading…','good'); setTimeout(()=>location.reload(),250); };
  navigator.serviceWorker.addEventListener('controllerchange', reload, {once:true});
  reg.addEventListener('updatefound', ()=>{ const nw=reg.installing; if(!nw)return;
    nw.addEventListener('statechange', ()=>{ if(nw.state==='activated' || (nw.state==='installed' && navigator.serviceWorker.controller)) reload(); }); });
  try{ await reg.update(); }catch(e){}
  setTimeout(async()=>{ if(done)return; if(reg.installing||reg.waiting)return; const v=await appVersion(); toast('You’re on the latest version'+(v?' ('+v+')':''),'good'); }, 3500);
}
function openCloudConnect(){
  const cfg=cloudConfig()||{}; const body=el('div');
  const connected = Cloud.enabled && Cloud.teamId;
  body.innerHTML=`
    ${Cloud.enabled?`<div class="card pad" style="margin-bottom:14px;${connected?'background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.4)':''}">
      <div style="display:flex;align-items:center;gap:10px"><span class="dot" style="width:10px;height:10px;background:${connected?'var(--good)':'var(--warn)'}"></span>
      <div><div style="font-weight:800">${connected?'Connected & syncing live':'Cloud configured — sign in to sync'}</div>
      <div style="font-size:12px;color:var(--muted)">${connected?esc(Cloud.user?.email||'')+' · '+esc(Cloud.role)+' · team shared':'Not signed in yet'}</div></div></div></div>`:''}
    <p style="font-size:13px;color:var(--muted);margin-bottom:12px">Paste your Supabase project keys to turn on shared, multi-device sync. Both values are safe to store in the app — row-level security protects the data. See <b>supabase/SETUP.md</b> for the 5-minute setup.</p>
    <div class="field"><label>Supabase Project URL</label><input class="control" id="cbUrl" placeholder="https://xxxx.supabase.co" value="${esc(cfg.supabaseUrl||'')}"></div>
    <div class="field"><label>Anon public key</label><textarea class="control" id="cbKey" style="min-height:70px;font-family:monospace;font-size:12px" placeholder="eyJhbGciOi...">${esc(cfg.supabaseAnonKey||'')}</textarea></div>
    <div class="help">${ICON.info}<span>Your current on-device animals become this team's shared data the first time you sign in as owner.</span></div>`;
  const foot=el('div'); foot.innerHTML=`${Cloud.enabled?`<button class="btn danger" data-off>Disconnect</button>`:''}<button class="btn primary" data-save style="flex:1">${Cloud.enabled?'Update & reload':'Connect & reload'}</button>`;
  const sh=openSheet({title:'Cloud sync',body,foot});
  $('[data-save]',sh).onclick=()=>{ const url=$('#cbUrl',body).value.trim().replace(/\/$/,''); const key=$('#cbKey',body).value.trim();
    if(!url||!key){ toast('Enter both values','bad'); return; }
    if(!/^https:\/\/.+\.supabase\.(co|in)/.test(url)){ toast('That doesn’t look like a Supabase URL','bad'); return; }
    localStorage.setItem('dfst_cloud_cfg', JSON.stringify({supabaseUrl:url, supabaseAnonKey:key}));
    toast('Reloading with cloud…','good'); setTimeout(()=>location.reload(),500); };
  if($('[data-off]',sh))$('[data-off]',sh).onclick=async()=>{ if(await confirmSheet('Disconnect cloud','Stop cloud sync on this device? Your data stays on the device. Other devices keep their cloud copy.','Disconnect',true)){ localStorage.removeItem('dfst_cloud_cfg'); if(window.DFST_CONFIG){window.DFST_CONFIG.supabaseUrl='';} toast('Disconnected — reloading','good'); setTimeout(()=>location.reload(),500); } };
}
function moreRow(k,ic,label){ return `<button class="li" data-more="${k}" style="width:100%;text-align:left"><div class="thumb" style="background:var(--line-2);color:var(--purple)">${ic}</div><div class="main"><div class="t1">${esc(label)}</div></div>${ICON.chev}</button>`; }
function openBreeds(){ const body=el('div');
  const draw=()=>{ body.innerHTML=`<div class="help" style="margin-bottom:10px">${ICON.info}<span>Toggle a species on to show it on the dashboard and in the Add-animal list. Species that have animals stay on automatically.</span></div>`+
    DB.species.map(sp=>{ const hasAnimals=DB.animals.some(a=>a.species===sp.id); return `<div class="section-title" style="margin-top:8px"><span style="width:16px;height:16px;color:${sp.active?'var(--purple-3)':'var(--muted)'}">${spIcon(sp.id)}</span>${esc(sp.name)} <label style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;text-transform:none;letter-spacing:0"><input type="checkbox" data-spact="${sp.id}" ${sp.active?'checked':''} ${hasAnimals?'disabled':''} style="width:18px;height:18px"><span style="font-size:11px;color:var(--muted)">${sp.active?'On':'Off'}</span></label> <button class="more" data-addbr="${sp.id}">+ Breed</button></div>
    <div class="list">${breedsFor(sp.id).map(b=>`<div class="li"><div class="main"><div class="t1" style="font-size:14px">${esc(b.name)}${b.system?'':' <span class="pill t" style="font-size:9px">custom</span>'}</div></div>${b.system?'':`<button class="iconbtn" style="background:var(--line-2);color:var(--bad)" data-delbr="${b.id}">${ICON.x}</button>`}</div>`).join('')}</div>`; }).join('')+
    `<button class="btn block" id="addSp" style="margin-top:14px">${ICON.plus} Add species</button>`;
    $$('[data-spact]',body).forEach(cb=>cb.onchange=()=>{ const sp=DB.species.find(s=>s.id===cb.dataset.spact); sp.active=cb.checked; save(); draw(); if(location.hash==='#/dashboard'||location.hash===''){} });
    $$('[data-addbr]',body).forEach(btn=>btn.onclick=()=>{ const nm=prompt('New breed name'); if(nm){DB.breeds.push({id:uid('br'),speciesId:btn.dataset.addbr,name:nm,system:false,active:true,order:999});save();draw();} });
    $$('[data-delbr]',body).forEach(btn=>btn.onclick=()=>{ DB.breeds=DB.breeds.filter(b=>b.id!==btn.dataset.delbr);save();draw(); });
    $('#addSp',body).onclick=()=>{ const nm=prompt('New species name (e.g. Rabbits)'); if(nm){const id=nm.toLowerCase().replace(/\s+/g,'');DB.species.push({id,name:nm,active:true,idFields:['earTag','tattoo']});DB.breeds.push({id:uid('br'),speciesId:id,name:'Crossbred',system:false,active:true,order:0},{id:uid('br'),speciesId:id,name:'Other',system:false,active:true,order:1});save();draw();} };
  };
  draw(); openSheet({title:'Species & breeds',body});
}
function openNotif(){ const body=el('div'); const p=DB.notifPrefs;
  const items=[['weightDue','Weekly weight due'],['missingPhoto','Missing progress photo'],['upcomingShow','Upcoming show & deadline'],['health','Health follow-up & withdrawal'],['advisor','Advisor comments'],['mentions','Mentions & tasks']];
  const draw=(pushState)=>{
    body.innerHTML=`<div id="pushBox"></div>
      <div class="section-title" style="margin-top:6px">Notify me about</div>
      <p style="font-size:12.5px;color:var(--muted);margin-bottom:10px">Applies to phone push and in-app alerts.</p>`+
      items.map(([k,l])=>`<label class="li" style="border:1px solid var(--line);border-radius:12px;margin-bottom:8px"><div class="main"><div class="t1" style="font-size:14px">${l}</div></div><input type="checkbox" data-n="${k}" ${p[k]?'checked':''} style="width:22px;height:22px"></label>`).join('');
    $$('[data-n]',body).forEach(c=>c.onchange=()=>{p[c.dataset.n]=c.checked;save(); if(Push.ready()&&Push.permission()==='granted')Push.syncOnLoad();});
    drawPush(pushState);
  };
  const drawPush=async(state)=>{
    const box=$('#pushBox',body); if(!box) return;
    if(!Push.supported()){ box.innerHTML=`<div class="help">${ICON.info}<span>This browser doesn’t support push notifications. On iPhone, add the app to your Home Screen first (Share → Add to Home Screen), then open it from there.</span></div>`; return; }
    if(!Push.ready()){ box.innerHTML=`<div class="help">${ICON.info}<span>Phone push needs cloud sync${Push.vapid()?'':' and a push key'}. Turn on <b>More → Connect to cloud</b>${Push.vapid()?'':', then finish <b>supabase/PUSH_SETUP.md</b>'}.</span></div>`; return; }
    const perm=Push.permission(); const sub= state!==undefined? state : await Push.current();
    const on = perm==='granted' && !!sub;
    box.innerHTML=`<div class="card pad" style="${on?'background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.4)':''}">
      <div style="display:flex;align-items:center;gap:10px"><span style="width:22px;height:22px;color:${on?'var(--good)':'var(--purple-3)'}">${ICON.bell}</span>
        <div style="flex:1"><div style="font-weight:800;font-size:14.5px">Phone push${on?' · on':''}</div><div style="font-size:12px;color:var(--muted)">${perm==='denied'?'Blocked in browser settings':on?'This device will get reminders even when the app is closed':'Get reminders on this device even when the app is closed'}</div></div></div>
      <div class="btn-row" style="margin-top:10px">${on?`<button class="btn ghost" data-poff style="flex:1">Turn off</button><button class="btn" data-ptest>Send test</button>`:`<button class="btn primary" data-pon style="flex:1">${ICON.bell} Enable on this device</button>`}</div></div>`;
    if($('[data-pon]',box))$('[data-pon]',box).onclick=async()=>{ const ok=await Push.enable(); drawPush(ok?await Push.current():undefined); };
    if($('[data-poff]',box))$('[data-poff]',box).onclick=async()=>{ await Push.disable(); drawPush(null); };
    if($('[data-ptest]',box))$('[data-ptest]',box).onclick=()=>Push.test();
  };
  draw(); openSheet({title:'Notifications',body});
}
function openTeamSettings(){ const body=el('div');
  body.innerHTML=`<div class="field"><label>Team name</label><input class="control" id="tsName" value="${esc(DB.team.name)}"></div>
    <div class="field"><label>Subtitle</label><input class="control" id="tsSub" value="${esc(DB.team.subtitle||'')}"></div>
    <div class="field"><label>Weekly weigh-in day</label><select class="control" id="tsDay">${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d,i)=>`<option value="${i}" ${DB.team.weighDay===i?'selected':''}>${d}</option>`).join('')}</select></div>
    <div class="field"><label>Team logo</label><div id="tsLogoPrev" style="width:60px;height:60px;border-radius:14px;overflow:hidden;border:1px solid var(--line);margin-bottom:8px">${brandImg()}</div><button class="btn sm" id="tsLogoBtn">${ICON.upload} Upload logo</button></div>`;
  const foot=el('div'); foot.innerHTML=`<button class="btn primary" data-save style="flex:1">Save settings</button>`;
  const sh=openSheet({title:'Team settings',body,foot});
  $('[data-save]',sh).onclick=()=>{ DB.team.name=$('#tsName',body).value.trim()||DB.team.name; DB.team.subtitle=$('#tsSub',body).value.trim(); DB.team.weighDay=+$('#tsDay',body).value; save(); closeSheet(); $('.app-header').remove(); toast('Settings saved','good'); render(); };
}
function openInventory(){ const body=el('div');
  const draw=()=>{ body.innerHTML=`<button class="btn primary block" id="addInv">${ICON.plus} Add feed product</button><div style="margin-top:12px">`+
    (DB.inventory.length?DB.inventory.map(p=>{const low=(+p.onHand||0)<=(+p.reorder||0);return `<div class="card pad" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between"><div><b>${esc(p.product)}</b><div style="font-size:12px;color:var(--muted)">${esc(p.brand||'')}${p.bagSize?' · '+esc(p.bagSize):''}</div></div><div style="text-align:right"><b class="tnum">${p.onHand||0}</b><div style="font-size:11px;color:${low?'var(--bad)':'var(--muted)'}">${low?'reorder':'on hand'}</div></div></div></div>`;}).join(''):'<div class="empty" style="padding:14px">No inventory tracked. Add products to monitor stock and get low-stock alerts.</div>')+`</div>`;
    $('#addInv',body).onclick=()=>recordSheet({title:'Feed product',rec:{product:'',brand:'',onHand:'',reorder:''},fields:[{k:'product',label:'Product'},{k:'brand',label:'Brand'},{type:'row',fields:[{k:'onHand',type:'number',label:'On hand'},{k:'reorder',type:'number',label:'Reorder at'}]},{k:'bagSize',label:'Bag size'}],onSave:s=>{DB.inventory.push(stamp({id:uid('inv'),...s}));save();draw();}}); };
  draw(); openSheet({title:'Feed inventory',body});
}
function importBackup(){ const inp=hiddenFile('application/json',async(files)=>{ try{ const txt=await files[0].text(); const data=JSON.parse(txt); if(!data.animals){toast('Invalid backup','bad');return;} if(await confirmSheet('Import backup','This replaces all current data on this device. Continue?','Import',true)){ DB=data; save(); toast('Backup imported','good'); location.hash='#/dashboard'; $('#app').innerHTML=''; render(); } }catch(e){toast('Could not read file','bad');} }); inp.click(); }
function toggleDemo(){
  if(!DB.seeded){ seedDemo(DB); save(); toast('Demo data loaded','good'); render(); return; }
  const demoCount=DB.animals.filter(a=>a.demo).length;
  const body=el('div');
  body.innerHTML=`<p style="font-size:14px;color:var(--ink-2);line-height:1.55;margin:2px 0 6px">You have <b>${demoCount}</b> animal${demoCount===1?'':'s'} still tagged <span class="pill" style="font-size:10px">Demo</span>. What do you want to do with them?</p>
    <div class="help" style="margin-bottom:4px">${ICON.info}<span>Adding real history to these animals? Choose <b>Keep</b> — it just removes the “Demo” label and makes them permanent. Nothing is deleted.</span></div>`;
  const foot=el('div');
  foot.innerHTML=`<button class="btn danger" data-del>${ICON.trash} Delete</button><button class="btn primary" data-keep style="flex:1">${ICON.check} Keep as my animals</button>`;
  const sh=openSheet({title:'Demo animals',body,foot});
  $('[data-keep]',sh).onclick=()=>{ const n=promoteDemo(); closeSheet(); toast(`${n} animal${n===1?'':'s'} are now permanent`,'good'); render(); };
  $('[data-del]',sh).onclick=async()=>{ closeSheet(); if(await confirmSheet('Delete demo data',`Permanently delete the ${demoCount} demo animal${demoCount===1?'':'s'} and all their records? This cannot be undone.`,'Delete everything',true)){ removeDemo(); toast('Demo data removed','good'); render(); } };
}

route('media',()=>{ // all media across the barn, newest capture first
  const v=setView('','dashboard'); const all=DB.media.slice().sort((a,b)=>(a.captured||a.date)<(b.captured||b.date)?1:-1);
  const wrap=el('div'); wrap.innerHTML=pageHeader('Progress media','/dashboard');
  if(!all.length)wrap.append(htmlToFrag(emptyState(ICON.media,'No media yet','Upload photos and videos from any animal profile.')));
  else { const g=el('div','gallery'); all.forEach(m=>g.append(mediaCell(m,getAnimal(m.animalId)||{},{showName:true}))); wrap.append(g); }
  v.append(wrap);
});

/* ===================================================================
   COACHING / GAME PLAN — turn each animal's target show into a plan with
   a straight-line pace, required ADG, projected finish and concrete advice.
   Reuses the existing target weight/date; adds a per-animal `plan` note.
   =================================================================== */
function coachEligible(a){ return !a.archived && a.targetWeight && a.targetDate; }
function coachStatus(a){
  const st=animalStats(a);
  const target=+a.targetWeight, tdate=a.targetDate;
  const daysLeft=daysBetween(todayISO(), tdate);
  const cur=st.curW;
  // straight-line pace from start → target; where SHOULD the animal be today?
  let idealNow=null, paceDelta=null;
  if(st.startW!=null && st.startD){
    const total=daysBetween(st.startD, tdate);
    const elapsed=daysBetween(st.startD, todayISO());
    const frac=total>0?clamp(elapsed/total,0,1):1;
    idealNow=Math.round(st.startW + (target-st.startW)*frac);
    if(cur!=null) paceDelta=Math.round(cur-idealNow);
  }
  const reqAdg=st.reqAdg, actAdg=st.adgLife, recentAdg=st.adgPeriod, proj=st.projWeight;
  const gap=(proj!=null)?Math.round(proj-target):null;            // + = trending over target
  const tol=Math.max(5, Math.round(target*0.03));
  // progress toward the goal weight (for the ring)
  let pct=null; if(st.startW!=null && cur!=null && target!==st.startW) pct=clamp((cur-st.startW)/(target-st.startW)*100,0,100);
  let state,label,color;
  if(daysLeft<0){ state='past'; label='Show passed'; color='var(--muted)'; }
  else if(cur==null || gap==null){ state='nodata'; label='Weigh in to start'; color='var(--warn)'; }
  else if(Math.abs(gap)<=tol){ state='ontrack'; label='On track'; color='var(--good)'; }
  else if(gap>tol){ state='over'; label='Trending heavy'; color='var(--warn)'; }
  else { state='under'; label='Behind pace'; color='var(--bad)'; }
  return {st,target,tdate,daysLeft,cur,idealNow,paceDelta,reqAdg,actAdg,recentAdg,proj,gap,tol,pct,state,label,color};
}
function coachAdvice(a,cs){
  const out=[];
  if(cs.state==='nodata'){ out.push('Log a current weight so the game plan can project to show day.'); return out; }
  if(cs.state==='past'){ out.push('This target date has passed — set a new goal for the next show to keep coaching.'); return out; }
  if(cs.state==='under'){
    out.push(`Projected ${cs.proj} lb — about ${Math.abs(cs.gap)} lb under your ${cs.target} lb target.`);
    if(cs.reqAdg!=null) out.push(`You now need ${cs.reqAdg} lb/day to hit target; you're averaging ${cs.actAdg??'—'} lb/day.`);
    out.push('Push gain: raise energy density, add a feeding, and rule out health, water or heat holding him back.');
  } else if(cs.state==='over'){
    out.push(`Projected ${cs.proj} lb — about ${cs.gap} lb over your ${cs.target} lb target.`);
    out.push('Ease the throttle: trim the top-end ration or add exercise so you finish on weight, not past it.');
    if(cs.reqAdg!=null && cs.reqAdg>0) out.push(`Aim for about ${cs.reqAdg} lb/day the rest of the way.`);
  } else if(cs.state==='ontrack'){
    out.push(`Projected ${cs.proj} lb — right on your ${cs.target} lb target. Hold the current program.`);
    if(cs.reqAdg!=null) out.push(`Maintain about ${cs.reqAdg} lb/day for the last ${cs.daysLeft} day${cs.daysLeft===1?'':'s'}.`);
  }
  if(cs.paceDelta!=null) out.push(cs.paceDelta>=0?`You're ${cs.paceDelta} lb ahead of the straight-line pace today.`:`You're ${Math.abs(cs.paceDelta)} lb behind the straight-line pace today.`);
  if(cs.daysLeft>=0 && cs.daysLeft<=14) out.push(`${cs.daysLeft} day${cs.daysLeft===1?'':'s'} out — lock in hair/hide work, exercise and a tight weigh-in cadence.`);
  return out;
}
function coachMilestones(a,cs){
  if(cs.st.startW==null || !cs.st.startD) return [];
  const start=parseD(cs.st.startD); const total=daysBetween(cs.st.startD,cs.tdate); if(!(total>7)) return [];
  const ws=weightsFor(a.id); const marks=[];
  for(let d=7; d<total; d+=7){ const date=new Date(start.getTime()+d*86400000).toISOString().slice(0,10); const ideal=Math.round(cs.st.startW+(cs.target-cs.st.startW)*(d/total)); marks.push({date,ideal}); }
  marks.push({date:cs.tdate,ideal:cs.target});
  marks.forEach(m=>{ let best=null,bd=5; ws.forEach(w=>{const dd=Math.abs(daysBetween(w.date,m.date)); if(dd<bd){bd=dd;best=w;}}); m.actual=best?+best.weight:null; m.future=m.date>todayISO(); });
  return marks;
}
function ringSVG(pct,color,label,sub){
  const r=26,c=2*Math.PI*r,off=c*(1-clamp((pct||0)/100,0,1));
  return `<svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--line-2)" stroke-width="7"/>
    <circle cx="32" cy="32" r="${r}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 32 32)"/>
    <text x="32" y="31" text-anchor="middle" font-size="15" font-weight="800" fill="var(--ink)">${label}</text>${sub?`<text x="32" y="43" text-anchor="middle" font-size="8" fill="var(--muted)">${sub}</text>`:''}</svg>`;
}
function coachSummary(){ const list=activeAnimals().filter(coachEligible).map(coachStatus);
  return {total:list.length, under:list.filter(c=>c.state==='under').length, over:list.filter(c=>c.state==='over').length, ontrack:list.filter(c=>c.state==='ontrack').length}; }
route('coach',()=>{
  const v=setView('','more'); const wrap=el('div');
  const active=activeAnimals();
  const planned=active.filter(coachEligible).map(a=>({a,cs:coachStatus(a)}));
  const noGoal=active.filter(a=>!coachEligible(a));
  const order={under:0,over:1,nodata:2,ontrack:3,past:4};
  planned.sort((x,y)=>(order[x.cs.state]-order[y.cs.state])||(x.cs.daysLeft-y.cs.daysLeft));
  const sum=coachSummary();
  wrap.innerHTML=pageHeader('Game Plan');
  wrap.append(htmlToFrag(`<div class="help" style="margin-bottom:12px">${ICON.info}<span>Set a target weight and show date on an animal and the app coaches you to it — required daily gain, projected finish, and whether you're on pace, behind or getting heavy.</span></div>`));
  if(planned.length){
    wrap.append(htmlToFrag(`<div class="grid g4" style="margin-bottom:4px">
      <div class="stat"><div class="k">On plan</div><div class="v tnum">${planned.length}</div><div class="sub">with a goal</div></div>
      <div class="stat"><div class="k">On track</div><div class="v tnum" style="color:var(--good)">${sum.ontrack}</div></div>
      <div class="stat"><div class="k">Behind</div><div class="v tnum" style="color:var(--bad)">${sum.under}</div></div>
      <div class="stat"><div class="k">Heavy</div><div class="v tnum" style="color:var(--warn)">${sum.over}</div></div></div>`));
    const L=el('div'); L.style.marginTop='6px';
    planned.forEach(({a,cs})=>{
      const card=el('div','card pad'); card.style.marginBottom='10px'; card.style.cursor='pointer';
      const ringLabel=cs.pct!=null?Math.round(cs.pct)+'%':'—';
      card.innerHTML=`<div style="display:flex;gap:14px;align-items:center">
        <div style="flex:none">${ringSVG(cs.pct,cs.color,ringLabel,'to goal')}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px"><div style="font-weight:800;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(a.name)}</div><span class="pill" style="background:${cs.color}22;color:${cs.color};font-size:10px;flex:none">${cs.label}</span></div>
          <div style="font-size:12.5px;color:var(--muted);margin-top:3px">${cs.cur!=null?cs.cur+' lb now':'no weight'} → ${cs.target} lb by ${fmtShort(cs.tdate)}${cs.daysLeft>=0?' · '+cs.daysLeft+'d':''}</div>
          <div style="display:flex;gap:14px;margin-top:6px;font-size:12px">
            <span><span style="color:var(--muted)">Need </span><b class="tnum">${cs.reqAdg!=null?cs.reqAdg:'—'}</b><span style="color:var(--muted)"> lb/d</span></span>
            <span><span style="color:var(--muted)">Now </span><b class="tnum">${cs.actAdg!=null?cs.actAdg:'—'}</b><span style="color:var(--muted)"> lb/d</span></span>
            <span><span style="color:var(--muted)">Proj </span><b class="tnum">${cs.proj!=null?cs.proj:'—'}</b></span>
          </div>
        </div><span style="color:var(--muted);flex:none">${ICON.chev}</span></div>`;
      card.onclick=()=>openGamePlanSheet(a.id); L.append(card);
    });
    wrap.append(L);
  } else {
    wrap.append(htmlToFrag(emptyState(ICON.target,'No game plans yet','Set a target weight and show date on an animal to start coaching toward it.')));
  }
  if(noGoal.length){
    wrap.append(htmlToFrag(`<div class="section-title">Set a goal</div>`));
    const L=el('div','list');
    noGoal.forEach(a=>{ const li=animalRow(a,`<button class="btn sm teal" data-goal>Set goal</button>`, animalStats(a).curW!=null?animalStats(a).curW+' lb · no target':'no weights yet');
      $('[data-goal]',li).onclick=(e)=>{e.stopPropagation();openGamePlanSheet(a.id);}; L.append(li); });
    wrap.append(L);
  }
  wrap.append(htmlToFrag('<div style="height:8px"></div>'));
  v.append(wrap);
});
function openGamePlanSheet(animalId){
  const a=getAnimal(animalId); if(!a) return;
  a.plan=a.plan||{};
  const body=el('div');
  const draw=()=>{
    const cs=coachStatus(a); const eligible=coachEligible(a); const advice=eligible?coachAdvice(a,cs):[];
    const marks=eligible?coachMilestones(a,cs):[];
    const upcoming=marks.filter(m=>m.future).slice(0,1)[0];
    body.innerHTML=`
      ${eligible?`<div class="card pad" style="margin-bottom:12px;border-color:${cs.color}55">
        <div style="display:flex;gap:14px;align-items:center">
          <div style="flex:none">${ringSVG(cs.pct,cs.color,cs.pct!=null?Math.round(cs.pct)+'%':'—','to goal')}</div>
          <div style="flex:1">
            <span class="pill" style="background:${cs.color}22;color:${cs.color};font-size:11px">${cs.label}</span>
            <div style="font-size:13px;color:var(--muted);margin-top:6px">${cs.cur!=null?cs.cur+' lb now':'no weight'} → <b style="color:var(--ink)">${cs.target} lb</b> by ${fmtShort(cs.tdate)}${cs.daysLeft>=0?` · ${cs.daysLeft} days`:''}</div>
          </div>
        </div>
        <div class="grid g3" style="margin-top:12px">
          <div class="stat"><div class="k">Need</div><div class="v tnum" style="font-size:20px">${cs.reqAdg!=null?cs.reqAdg:'—'}<small> lb/d</small></div></div>
          <div class="stat"><div class="k">Averaging</div><div class="v tnum" style="font-size:20px">${cs.actAdg!=null?cs.actAdg:'—'}<small> lb/d</small></div></div>
          <div class="stat"><div class="k">Projected</div><div class="v tnum" style="font-size:20px">${cs.proj!=null?cs.proj:'—'}<small> lb</small></div></div>
        </div>
      </div>
      ${advice.length?`<div class="section-title">Coach's read</div><div class="card pad" style="font-size:13.5px;line-height:1.6">${advice.map(t=>`<div style="display:flex;gap:8px;margin-bottom:6px"><span style="color:${cs.color};flex:none;width:16px;height:16px;margin-top:1px">${ICON.trend}</span><span>${esc(t)}</span></div>`).join('')}</div>`:''}
      ${upcoming?`<div class="section-title">Next checkpoint</div><div class="card pad"><div style="display:flex;justify-content:space-between;font-size:13.5px"><span style="color:var(--muted);font-weight:700">${fmtDate(upcoming.date)}</span><span style="font-weight:800" class="tnum">aim ${upcoming.ideal} lb</span></div></div>`:''}
      ${marks.length?`<div class="section-title">Pace checkpoints</div><div class="card pad">${marks.map(m=>{ const hit=m.actual!=null; const good=hit&&m.actual>=m.ideal-cs.tol; return `<div class="kv"><span class="k">${fmtShort(m.date)}${m.future?' <span style="color:var(--muted)">·upcoming</span>':''}</span><span class="v">aim ${m.ideal}${hit?` · <span style="color:${good?'var(--good)':'var(--bad)'}">${m.actual} lb</span>`:m.future?'':' · —'}</span></div>`; }).join('')}</div>`:''}
      `:`<div class="help" style="margin-bottom:12px">${ICON.info}<span>Set a target weight and show date below to turn on coaching for ${esc(a.name)}.</span></div>`}
      <div class="section-title">Goal</div>
      <div class="field-row"><div class="field" style="flex:1"><label>Target weight (lb)</label><input class="control" type="number" inputmode="decimal" id="gpW" value="${a.targetWeight||''}"></div><div class="field" style="flex:1"><label>Show date</label><input class="control" type="date" id="gpD" value="${a.targetDate||''}"></div></div>
      <div class="field"><label>Feed strategy</label><textarea class="control" id="gpFeed" placeholder="e.g. full feed 2× + top dress last 3 weeks">${esc(a.plan.feed||'')}</textarea></div>
      <div class="field"><label>Exercise &amp; conditioning</label><textarea class="control" id="gpEx" placeholder="e.g. walk 15 min daily, brace work M/W/F">${esc(a.plan.exercise||'')}</textarea></div>
      <div class="field"><label>Notes / focus</label><textarea class="control" id="gpNotes" placeholder="Hair, hide, feet, showmanship…">${esc(a.plan.notes||'')}</textarea></div>`;
    // rebind save each redraw
    if(sh){ const btn=$('[data-save]',sh); if(btn) btn.onclick=onSave; }
  };
  const onSave=()=>{
    const w=$('#gpW',body).value, d=$('#gpD',body).value;
    a.targetWeight=w===''?null:+w; a.targetDate=d||null;
    a.plan={ feed:$('#gpFeed',body).value.trim(), exercise:$('#gpEx',body).value.trim(), notes:$('#gpNotes',body).value.trim(), updatedAt:nowISO() };
    touch(a); logAct('plan','Updated game plan',a.id); save();
    toast('Game plan saved','good'); draw();
  };
  const foot=el('div'); foot.innerHTML=`<button class="btn primary" data-save style="flex:1">Save game plan</button>`;
  const sh=openSheet({title:a.name+' — Game plan',body,foot});
  $('[data-save]',sh).onclick=onSave;
  draw();
}

/* ===================================================================
   SHOW-DAY MODE — a focused day-of screen: countdown, per-animal
   weigh-in targets, a pack/prep checklist, your class schedule and notes.
   Checklist lives on the show record (show.checklist), seeded once.
   =================================================================== */
const SHOW_CHECKLIST_DEFAULT = [
  ['Papers','Entry confirmation / exhibitor number'],
  ['Papers','Health papers / registration'],
  ['Animal','Halter, show stick / whip, comb'],
  ['Animal','Wash supplies, towels, brushes'],
  ['Animal','Adhesive / touch-up / show sheen'],
  ['Animal','Feed, hay & water buckets'],
  ['Pen','Bedding, fan, extension cord'],
  ['Pen','Muck fork & pan'],
  ['Exhibitor','Show clothes & number pins'],
  ['Exhibitor','Water, snacks, sunscreen'],
];
function ensureChecklist(s){ if(!s.checklist){ s.checklist=SHOW_CHECKLIST_DEFAULT.map(([cat,text])=>({id:uid('ck'),cat,text,done:false})); } return s.checklist; }
route('showday',(parts)=>{
  const s=DB.shows.find(x=>x.id===parts[1]); if(!s){ go('/shows'); return; }
  if(!s.checklist){ ensureChecklist(s); save(); }   // persist the seeded checklist once
  const v=setView('','shows'); const wrap=el('div'); v.append(wrap);
  const entries=DB.entries.filter(e=>e.showId===s.id);
  const draw=()=>{
    const list=ensureChecklist(s); const done=list.filter(c=>c.done).length;
    const dleft=daysBetween(todayISO(),s.start);
    const when=dleft===0?'Today':dleft===1?'Tomorrow':dleft>0?dleft+' days out':Math.abs(dleft)+'d ago';
    wrap.innerHTML=`${pageHeader('Show day','/show/'+s.id)}
      <div class="card pad" style="background:linear-gradient(135deg,var(--purple),var(--purple-3));color:#fff;border:none;box-shadow:var(--shadow-lg)">
        <div style="font-size:11px;font-weight:700;opacity:.85;text-transform:uppercase;letter-spacing:.5px">${esc(when)}</div>
        <div style="font-size:20px;font-weight:800;margin-top:2px">${esc(s.name)}</div>
        <div style="font-size:12.5px;opacity:.9">${fmtDate(s.start)}${s.location?' · '+esc(s.location):''}${s.weighIn?' · weigh-in '+fmtShort(s.weighIn):''}</div>
        <div style="margin-top:10px;height:7px;background:rgba(255,255,255,.25);border-radius:5px;overflow:hidden"><div style="height:100%;width:${list.length?Math.round(done/list.length*100):0}%;background:#fff;border-radius:5px"></div></div>
        <div style="font-size:11.5px;opacity:.9;margin-top:5px">${done}/${list.length} checklist items ready</div>
      </div>
      <div class="section-title">Weigh-in targets</div><div id="sdWeigh"></div>
      <div class="section-title">Checklist <button class="more" id="sdAdd">+ Item</button></div><div id="sdCheck"></div>
      <div class="section-title">Your classes <button class="more" id="sdEnt">Add entry</button></div><div id="sdEnt2"></div>
      <div class="section-title">Show-day notes</div>
      <div class="field"><textarea class="control" id="sdNotes" placeholder="Ring order, judge, reminders…">${esc(s.dayNotes||'')}</textarea></div>`;
    // weigh-in targets
    const wc=$('#sdWeigh',wrap);
    if(!entries.length){ wc.innerHTML='<div class="empty" style="padding:14px">No entries yet. Add your animals to this show.</div>'; }
    else { const L=el('div','list'); entries.forEach(e=>{ const a=getAnimal(e.animalId); if(!a)return; const st=animalStats(a);
      const proj=(a.targetDate===s.start||!a.targetDate)&&st.adgLife!=null&&st.curW!=null?Math.round(st.curW+st.adgLife*Math.max(0,daysBetween(st.curD,s.start))):st.projWeight;
      const tgt=e.showWeight||a.targetWeight; const cur=st.curW;
      let flag=''; if(tgt&&proj!=null){ const g=proj-tgt; const tol=Math.max(5,Math.round(tgt*0.03)); flag=Math.abs(g)<=tol?'<span class="pill good" style="font-size:10px">on weight</span>':g>0?`<span class="pill warn" style="font-size:10px">+${g} over</span>`:`<span class="pill bad" style="font-size:10px">${g} under</span>`; }
      const li=el('div','li');
      li.innerHTML=`<div class="thumb">${esc(initials(a.name))}</div><div class="main"><div class="t1">${esc(a.name)}</div><div class="t2">${cur!=null?cur+' lb now':'no weight'}${proj!=null?' · proj '+proj+' lb':''}${tgt?' · target '+tgt+' lb':''}</div></div><div class="r" style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">${flag}<button class="btn sm teal" data-weigh>Weigh</button></div>`;
      $('[data-weigh]',li).onclick=(ev)=>{ev.stopPropagation();openWeightSheet(a.id);}; li.onclick=()=>go('/animal/'+a.id); L.append(li); }); wc.innerHTML=''; wc.append(L); }
    // checklist grouped by category
    const cc=$('#sdCheck',wrap); const cats=[...new Set(list.map(c=>c.cat))];
    cc.innerHTML=cats.map(cat=>`<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin:10px 0 4px">${esc(cat)}</div>`+
      `<div class="list">${list.filter(c=>c.cat===cat).map(c=>`<label class="li" style="cursor:pointer"><button class="thumb" style="background:${c.done?'var(--good)':'var(--line-2)'};color:${c.done?'#fff':'var(--purple)'}" data-ck="${c.id}">${c.done?ICON.check:ICON.clipboard}</button><div class="main"><div class="t1" style="font-size:14px;${c.done?'text-decoration:line-through;color:var(--muted)':''}">${esc(c.text)}</div></div><button class="iconbtn" style="background:var(--line-2);color:var(--bad)" data-ckdel="${c.id}">${ICON.x}</button></label>`).join('')}</div>`).join('');
    $$('[data-ck]',cc).forEach(b=>b.onclick=(e)=>{e.preventDefault();const c=list.find(x=>x.id===b.dataset.ck);c.done=!c.done;save();draw();});
    $$('[data-ckdel]',cc).forEach(b=>b.onclick=(e)=>{e.preventDefault();s.checklist=list.filter(x=>x.id!==b.dataset.ckdel);save();draw();});
    // classes
    const ec=$('#sdEnt2',wrap);
    if(!entries.length){ ec.innerHTML='<div class="empty" style="padding:14px">No classes entered.</div>'; }
    else { const L=el('div','list'); entries.slice().sort((x,y)=>(x.cls||'')<(y.cls||'')?-1:1).forEach(e=>{ const a=getAnimal(e.animalId); if(!a)return; const r=e.result||{}; const li=el('div','li'); li.style.cursor='pointer';
      li.innerHTML=`<div class="thumb" style="color:var(--purple)">${ICON.shows}</div><div class="main"><div class="t1">${esc(a.name)}</div><div class="t2">${[e.division,e.cls,e.showWeight?e.showWeight+' lb':''].filter(Boolean).map(esc).join(' · ')||'<span style="color:var(--warn)">Tap to add details</span>'}</div></div><div class="r" style="display:flex;align-items:center;gap:6px">${r.placing?`<button class="pill p" style="font-size:10px;border:none" data-res>${esc(r.placing)}${r.inClass?'/'+r.inClass:''}</button>`:'<button class="btn sm teal" data-res>Result</button>'}<span style="color:var(--muted)">${ICON.chev}</span></div>`;
      li.onclick=()=>openEntrySheet(e.animalId,e.id); $('[data-res]',li).onclick=(ev)=>{ev.stopPropagation();openResultSheet(e.id);}; L.append(li); }); ec.innerHTML=''; ec.append(L); }
    $('#sdAdd',wrap).onclick=()=>{ const t=prompt('Checklist item'); if(t){ list.push({id:uid('ck'),cat:'Custom',text:t,done:false}); save(); draw(); } };
    $('#sdEnt',wrap).onclick=()=>openShowRoster(s.id);
    const nt=$('#sdNotes',wrap); nt.onchange=()=>{ s.dayNotes=nt.value; save(); };
  };
  draw();
});

/* ===================================================================
   RECORD BOOK — a compiled career achievement record. Team-wide, or per
   animal (?animal=id). Printable for a physical record book / sale packet.
   =================================================================== */
function isBanner(r){ const t=((r.divisionPlacing||'')+' '+(r.bannerNote||'')).toLowerCase(); return /champ|grand|reserve|banner|division|supreme|premier/.test(t); }
function isClassWin(r){ return String(r.placing||'').trim()==='1'; }
function recordEntries(animalId){ return DB.entries.filter(e=>e.result&&e.result.placing&&(!animalId||e.animalId===animalId)); }
function recordStats(animalId){
  const res=recordEntries(animalId);
  const shows=new Set(res.map(e=>e.showId));
  const banners=res.filter(e=>isBanner(e.result));
  const wins=res.filter(e=>isClassWin(e.result));
  const premium=res.reduce((s,e)=>s+(+e.result.premium||0),0);
  const sale=res.reduce((s,e)=>s+(+e.result.salePrice||0),0);
  const points=res.reduce((s,e)=>s+(+e.result.points||0),0);
  return {count:res.length, shows:shows.size, banners:banners.length, wins:wins.length, premium, sale, points, res, bannerList:banners};
}
route('records',(parts,q)=>{
  const animalId=q&&q.get('animal'); const a=animalId?getAnimal(animalId):null;
  const v=setView('','more'); const wrap=el('div'); v.append(wrap);
  const st=recordStats(animalId);
  const animals=activeAnimalsWithResults();
  wrap.innerHTML=`${pageHeader(a?a.name+' — Record book':'Record Book', a?'/records':null, `<button class="btn sm" id="rbPrint">${ICON.download} Print</button>`)}
    ${!a&&animals.length?`<div class="chips" style="flex-wrap:wrap;white-space:normal;margin-bottom:12px"><button class="chip active" data-af="">All animals</button>${animals.map(x=>`<button class="chip" data-af="${x.id}">${esc(x.name)}</button>`).join('')}</div>`:''}
    ${st.count?`<div class="grid g4">
      <div class="stat"><div class="k">Wins</div><div class="v tnum">${st.wins}</div><div class="sub">class firsts</div></div>
      <div class="stat"><div class="k">Banners</div><div class="v tnum" style="color:var(--purple-3)">${st.banners}</div><div class="sub">champ/division</div></div>
      <div class="stat"><div class="k">Shows</div><div class="v tnum">${st.shows}</div></div>
      <div class="stat"><div class="k">Placings</div><div class="v tnum">${st.count}</div></div>
    </div>
    ${(st.premium||st.sale||st.points)?`<div class="grid g3" style="margin-top:4px">${st.premium?`<div class="stat"><div class="k">Premiums</div><div class="v tnum" style="font-size:18px">${money(st.premium)}</div></div>`:''}${st.sale?`<div class="stat"><div class="k">Sale total</div><div class="v tnum" style="font-size:18px">${money(st.sale)}</div></div>`:''}${st.points?`<div class="stat"><div class="k">Points</div><div class="v tnum">${round(st.points,1)}</div></div>`:''}</div>`:''}`:''}
    ${st.bannerList.length?`<div class="section-title">Banners &amp; champions</div><div id="rbBanners"></div>`:''}
    <div class="section-title">${a?'Results':'All results'}</div><div id="rbResults"></div>`;
  if(!st.count){ $('#rbResults',wrap).innerHTML=emptyState(ICON.medal,'No results yet','Record show placings from an animal’s Shows tab and they’ll build a career record here.'); }
  else {
    if(st.bannerList.length){ const L=el('div','list'); st.bannerList.sort((x,y)=>showDateOf(y)<showDateOf(x)?-1:1).forEach(e=>{ const an=getAnimal(e.animalId); const sh=DB.shows.find(s=>s.id===e.showId); const li=el('div','li');
      li.innerHTML=`<div class="thumb" style="color:var(--purple-3)">${ICON.rosette}</div><div class="main"><div class="t1">${esc(e.result.divisionPlacing||e.result.bannerNote)}</div><div class="t2">${esc(an?an.name:'')} · ${esc(sh?sh.name:'')} · ${sh?fmtShort(sh.start):''}</div></div>`;
      li.onclick=()=>go('/animal/'+e.animalId+'/shows'); L.append(li); }); $('#rbBanners',wrap).append(L); }
    // results grouped by show, newest first
    const byShow={}; st.res.forEach(e=>{ (byShow[e.showId]=byShow[e.showId]||[]).push(e); });
    const showIds=Object.keys(byShow).sort((x,y)=>{ const sx=DB.shows.find(s=>s.id===x),sy=DB.shows.find(s=>s.id===y); return (sy?sy.start:'')<(sx?sx.start:'')?-1:1; });
    const rc=$('#rbResults',wrap);
    showIds.forEach(sid=>{ const sh=DB.shows.find(s=>s.id===sid); rc.append(htmlToFrag(`<div style="font-size:12px;font-weight:800;color:var(--muted);margin:12px 0 4px">${esc(sh?sh.name:'Show')} · ${sh?fmtShort(sh.start):''}</div>`));
      const card=el('div','card pad'); card.innerHTML=byShow[sid].map(e=>{ const an=getAnimal(e.animalId); const r=e.result;
        return `<div class="kv"><span class="k">${esc(an?an.name:'')}${e.cls?' · '+esc(e.cls):e.division?' · '+esc(e.division):''}</span><span class="v">${isBanner(r)?ICON.rosette.replace('width="24" height="24"','width="14" height="14"'):''} ${esc(r.placing)}${r.inClass?'/'+r.inClass:''}${r.divisionPlacing?' · '+esc(r.divisionPlacing):''}</span></div>`;
      }).join(''); rc.append(card); });
  }
  $('#rbPrint',wrap).onclick=()=>printRecordBook(animalId);
  $$('[data-af]',wrap).forEach(b=>b.onclick=()=>{ const id=b.dataset.af; go(id?'/records?animal='+id:'/records'); });
});
function activeAnimalsWithResults(){ const ids=new Set(DB.entries.filter(e=>e.result&&e.result.placing).map(e=>e.animalId)); return DB.animals.filter(a=>ids.has(a.id)); }
function showDateOf(e){ const sh=DB.shows.find(s=>s.id===e.showId); return sh?sh.start:''; }
function printRecordBook(animalId){
  const a=animalId?getAnimal(animalId):null; const st=recordStats(animalId);
  const byShow={}; st.res.forEach(e=>{ (byShow[e.showId]=byShow[e.showId]||[]).push(e); });
  const showIds=Object.keys(byShow).sort((x,y)=>{ const sx=DB.shows.find(s=>s.id===x),sy=DB.shows.find(s=>s.id===y); return (sy?sy.start:'')<(sx?sx.start:'')?-1:1; });
  const w=window.open('','_blank');
  const rows=showIds.map(sid=>{ const sh=DB.shows.find(s=>s.id===sid); return `<h3>${esc(sh?sh.name:'Show')} <span class="muted">${sh?fmtDate(sh.start):''}${sh&&sh.location?' · '+esc(sh.location):''}</span></h3><table>${byShow[sid].map(e=>{const an=getAnimal(e.animalId);const r=e.result;return `<tr><td>${esc(an?an.name:'')}</td><td>${esc(e.division||'')}${e.cls?' · '+esc(e.cls):''}</td><td>${esc(r.placing||'')}${r.inClass?'/'+r.inClass:''}</td><td>${esc(r.divisionPlacing||'')}${r.bannerNote?' · '+esc(r.bannerNote):''}</td><td>${r.salePrice?money(r.salePrice):''}</td></tr>`;}).join('')}</table>`; }).join('');
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(a?a.name:'Team')} — Record Book</title>
    <style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:820px;margin:20px auto;padding:0 20px;line-height:1.5}
    h1{color:#4C1D95;margin-bottom:2px}h3{color:#0D9488;margin:22px 0 6px;font-size:15px}
    .head{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #4C1D95;padding-bottom:10px}
    table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:6px}td,th{padding:6px 8px;border-bottom:1px solid #eee;text-align:left}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.box{background:#f5f5f7;border-radius:10px;padding:10px}.box b{display:block;font-size:22px;color:#4C1D95}
    .muted{color:#777;font-size:12px;font-weight:400}@media print{.noprint{display:none}}</style></head>
    <body><div class="head"><h1>${esc(a?a.name:DB.team.name)}<br><span class="muted">Record Book</span></h1><div style="text-align:right"><b>${esc(DB.team.name)}</b><div class="muted">${fmtDate(todayISO())}</div></div></div>
    <div class="grid"><div class="box"><span class="muted">Class wins</span><b>${st.wins}</b></div><div class="box"><span class="muted">Banners</span><b>${st.banners}</b></div><div class="box"><span class="muted">Shows</span><b>${st.shows}</b></div><div class="box"><span class="muted">Placings</span><b>${st.count}</b></div></div>
    ${(st.premium||st.sale)?`<p class="muted">Premiums ${money(st.premium)} · Sale total ${money(st.sale)}${st.points?' · '+round(st.points,1)+' points':''}</p>`:''}
    ${st.bannerList.length?`<h3>Banners &amp; Champions</h3><table>${st.bannerList.map(e=>{const an=getAnimal(e.animalId);const sh=DB.shows.find(s=>s.id===e.showId);return `<tr><td>${esc(e.result.divisionPlacing||e.result.bannerNote)}</td><td>${esc(an?an.name:'')}</td><td>${esc(sh?sh.name:'')}</td><td>${sh?fmtDate(sh.start):''}</td></tr>`;}).join('')}</table>`:''}
    ${rows||'<p class="muted">No results recorded yet.</p>'}
    <p class="noprint" style="margin-top:24px"><button onclick="window.print()" style="background:#4C1D95;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:700">Print / Save as PDF</button></p>
    </body></html>`;
  w.document.write(html); w.document.close();
}

/* ===================================================================
   FEED & BEDDING COSTS — the management screens for the costing model.
   =================================================================== */
route('costs',()=>{
  const v=setView('','more'); const wrap=el('div'); v.append(wrap);
  const draw=()=>{
    const feeds=feedProducts(), beds=beddingProducts();
    // team totals
    let feedSpend=0; (DB.purchases||[]).forEach(l=>{ const p=(DB.inventory||[]).find(x=>x.id===l.productId); if(p&&(p.category||'feed')==='feed')feedSpend+=+l.cost||0; });
    const bedSpend=(DB.purchases||[]).filter(l=>{const p=(DB.inventory||[]).find(x=>x.id===l.productId);return p&&p.category==='bedding';}).reduce((s,l)=>s+(+l.cost||0),0);
    const active=activeAnimals();
    const totFeedCost=active.reduce((s,a)=>s+feedCostForAnimal(a.id),0);
    const totGain=active.reduce((s,a)=>{const st=animalStats(a);return s+(st.gainTotal>0?st.gainTotal:0);},0);
    const cogFeed=totGain>0?totFeedCost/totGain:null;
    wrap.innerHTML=`${pageHeader('Feed & bedding costs')}
      <div class="help" style="margin-bottom:12px">${ICON.info}<span>Log what you <b>buy in bulk</b> and the app works out a cost per pound, then flows it into each animal automatically from the rations they're on — no need to hand-enter feed expenses.</span></div>
      <div class="grid g3">
        <div class="stat"><div class="k">Feed bought</div><div class="v tnum" style="font-size:18px">${money(feedSpend)}</div></div>
        <div class="stat"><div class="k">Bedding bought</div><div class="v tnum" style="font-size:18px">${money(bedSpend)}</div></div>
        <div class="stat"><div class="k">Feed cost / lb gain</div><div class="v tnum" style="font-size:18px">${cogFeed!=null?money(cogFeed):'—'}</div></div>
      </div>
      <div class="section-title">Feed products <button class="more" id="addFeedP">+ Product</button></div><div id="feedList"></div>
      <div class="section-title">Bedding <button class="more" id="addBedP">+ Product</button></div><div id="bedList"></div>
      <div class="section-title">Bedding used <button class="more" id="logBed">+ Log use</button></div><div id="bedUse"></div>
      <div style="height:8px"></div>`;
    // feed products
    const fl=$('#feedList',wrap);
    if(!feeds.length) fl.innerHTML='<div class="empty" style="padding:14px">No feed products yet. Add one, then log a bulk purchase to set its cost per pound.</div>';
    else { const L=el('div','list'); feeds.forEach(p=>{ const pc=productCost(p.id); const low=(+p.onHand||0)<=(+p.reorder||0)&&(p.reorder!=null&&p.reorder!==''); const li=el('div','li');
      li.innerHTML=`<div class="thumb" style="color:var(--teal-3)">${ICON.sack}</div><div class="main"><div class="t1">${esc(p.product)}${low?' <span class="pill warn" style="font-size:9px">low</span>':''}</div><div class="t2">${esc(p.brand||'')}${pc.perUnit!=null?' · '+money(pc.perUnit)+'/lb':' · no price yet'}${p.onHand?' · '+p.onHand+' lb on hand':''}</div></div><div class="r"><b class="tnum">${pc.totalCost?money(pc.totalCost):''}</b></div>`;
      li.onclick=()=>openProductSheet(p.id); L.append(li); }); fl.append(L); }
    // bedding products
    const bl=$('#bedList',wrap);
    if(!beds.length) bl.innerHTML='<div class="empty" style="padding:14px">No bedding products yet. Add shavings/straw and a bulk purchase to price it.</div>';
    else { const L=el('div','list'); beds.forEach(p=>{ const pc=productCost(p.id); const li=el('div','li');
      li.innerHTML=`<div class="thumb" style="color:var(--purple-3)">${ICON.shavings}</div><div class="main"><div class="t1">${esc(p.product)}</div><div class="t2">${esc(p.brand||'')}${pc.perUnit!=null?' · '+money(pc.perUnit)+'/'+(p.unit||'bag'):' · no price yet'}${p.onHand?' · '+p.onHand+' '+(p.unit||'bag')+' on hand':''}</div></div><div class="r"><b class="tnum">${pc.totalCost?money(pc.totalCost):''}</b></div>`;
      li.onclick=()=>openProductSheet(p.id); L.append(li); }); bl.append(L); }
    // bedding usage
    const bu=$('#bedUse',wrap); const uses=(DB.bedding||[]).slice().sort((a,b)=>a.date<b.date?1:-1);
    if(!uses.length) bu.innerHTML='<div class="empty" style="padding:14px">No bedding logged. Tap “Log use” each time you bed a pen down.</div>';
    else { const L=el('div','list'); uses.slice(0,20).forEach(b=>{ const p=(DB.inventory||[]).find(x=>x.id===b.productId); const c=beddingUseCost(b);
      const who=b.scope==='animal'?(getAnimal(b.animalId)||{}).name||'animal':b.scope==='pen'?(b.pen||'Pen'):'Barn (overhead)';
      const li=el('div','li'); li.innerHTML=`<div class="thumb" style="color:var(--purple-3)">${ICON.shavings}</div><div class="main"><div class="t1">${b.qty} ${esc(p?p.unit||'bag':'bag')} · ${esc(who)}</div><div class="t2">${esc(p?p.product:'')} · ${fmtDate(b.date)}</div></div><div class="r"><b class="tnum">${c?money(c):''}</b></div>`;
      li.onclick=()=>openBeddingUseSheet(b.id); L.append(li); }); bu.append(L); }
    $('#addFeedP',wrap).onclick=()=>openProductSheet(null,'feed');
    $('#addBedP',wrap).onclick=()=>openProductSheet(null,'bedding');
    $('#logBed',wrap).onclick=()=>{ if(!beds.length){ toast('Add a bedding product first','bad'); openProductSheet(null,'bedding'); return; } openBeddingUseSheet(); };
  };
  window.__costsRedraw=draw; draw();
});
function openProductSheet(id, category){
  const p=id?{...(DB.inventory||[]).find(x=>x.id===id)}:{product:'',brand:'',category:category||'feed',unit:category==='bedding'?'bag':'lb',onHand:'',reorder:''};
  const isBed=p.category==='bedding';
  const body=el('div');
  const draw=()=>{
    const lots=id?(DB.purchases||[]).filter(l=>l.productId===id).sort((a,b)=>a.date<b.date?1:-1):[];
    const pc=id?productCost(id):{perUnit:null,totalCost:0,totalQty:0};
    body.innerHTML=`
      <div class="field"><label>Product name *</label><input class="control" id="pName" value="${esc(p.product||'')}" placeholder="${isBed?'Pine shavings':'Show Grower'}"></div>
      <div class="field-row"><div class="field" style="flex:1"><label>Brand / mill</label><input class="control" id="pBrand" value="${esc(p.brand||'')}"></div>
        <div class="field" style="flex:1"><label>${isBed?'Unit':'Base unit'}</label><select class="control" id="pUnit">${(isBed?BEDDING_UNITS:['lb']).map(u=>`<option ${p.unit===u?'selected':''}>${u}</option>`).join('')}</select></div></div>
      <div class="field-row"><div class="field" style="flex:1"><label>On hand (${isBed?(p.unit||'bag'):'lb'})</label><input class="control" type="number" inputmode="decimal" id="pOnHand" value="${p.onHand??''}"></div>
        <div class="field" style="flex:1"><label>Reorder at</label><input class="control" type="number" inputmode="decimal" id="pReorder" value="${p.reorder??''}"></div></div>
      ${id?`<div class="card pad" style="background:var(--line-2);border:none;margin-bottom:10px"><div style="display:flex;justify-content:space-around;text-align:center"><div><div style="font-size:11px;color:var(--muted);font-weight:700">COST / ${isBed?(p.unit||'BAG').toUpperCase():'LB'}</div><div style="font-weight:800;font-size:17px" class="tnum">${pc.perUnit!=null?money(pc.perUnit):'—'}</div></div><div><div style="font-size:11px;color:var(--muted);font-weight:700">TOTAL SPENT</div><div style="font-weight:800;font-size:17px" class="tnum">${money(pc.totalCost)}</div></div><div><div style="font-size:11px;color:var(--muted);font-weight:700">PURCHASED</div><div style="font-weight:800;font-size:17px" class="tnum">${round(pc.totalQty,0)} ${isBed?(p.unit||'bag'):'lb'}</div></div></div></div>
      <div class="section-title" style="margin-top:4px">Purchase lots <button class="more" id="addLot">+ Bulk buy</button></div>
      <div id="lotList"></div>`:'<div class="help">'+ICON.info+'<span>Save the product, then add your bulk purchases to set a cost per '+(isBed?(p.unit||'bag'):'pound')+'.</span></div>'}`;
    if(id){ const ll=$('#lotList',body);
      if(!lots.length) ll.innerHTML='<div class="empty" style="padding:12px">No purchases yet. Add a bulk buy — e.g. “'+(isBed?'40 bags for $260':'1 ton for $640')+'.”</div>';
      else { const L=el('div','list'); lots.forEach(l=>{ const q=isBed?(+l.qty||0):toLb(l.qty,l.unit||'lb',l.perBag); const per=q>0?(+l.cost||0)/q:null; const li=el('div','li');
        li.innerHTML=`<div class="thumb" style="color:var(--teal-3)">${ICON.receipt}</div><div class="main"><div class="t1">${money(l.cost)} · ${l.qty} ${esc(l.unit||(isBed?'bag':'lb'))}${l.unit==='bag'&&l.perBag?' × '+l.perBag+' lb':''}</div><div class="t2">${fmtDate(l.date)}${per!=null?' · '+money(per)+'/'+(isBed?(p.unit||'bag'):'lb'):''}${l.note?' · '+esc(l.note):''}</div></div><button class="iconbtn" style="background:var(--line-2);color:var(--bad)" data-dellot="${l.id}">${ICON.x}</button>`;
        $('[data-dellot]',li).onclick=(e)=>{e.stopPropagation();DB.purchases=DB.purchases.filter(x=>x.id!==l.id);save();draw();if(window.__costsRedraw)window.__costsRedraw();}; L.append(li); }); ll.append(L); }
      $('#addLot',body).onclick=()=>openPurchaseSheet(id,()=>{draw();if(window.__costsRedraw)window.__costsRedraw();});
    }
  };
  draw();
  const foot=el('div'); foot.innerHTML=`${id?`<button class="btn danger" data-del>${ICON.trash}</button>`:''}<button class="btn primary" data-save style="flex:1">${id?'Save product':'Add product'}</button>`;
  const sh=openSheet({title:id?'Edit product':(isBed?'New bedding product':'New feed product'),body,foot});
  $('[data-save]',sh).onclick=()=>{ const data={product:$('#pName',body).value.trim(),brand:$('#pBrand',body).value.trim(),category:p.category,unit:$('#pUnit',body).value,onHand:$('#pOnHand',body).value===''?null:+$('#pOnHand',body).value,reorder:$('#pReorder',body).value===''?null:+$('#pReorder',body).value};
    if(!data.product){toast('Name the product','bad');return;}
    if(id){Object.assign((DB.inventory).find(x=>x.id===id),data);}else{const nid=uid('inv');DB.inventory.push(stamp({id:nid,...data}));} save(); toast('Saved','good');
    if(!id){ closeSheet(); openProductSheet((DB.inventory[DB.inventory.length-1]).id); } // reopen to add lots
    if(window.__costsRedraw)window.__costsRedraw();
  };
  if($('[data-del]',sh))$('[data-del]',sh).onclick=async()=>{ if(await confirmSheet('Delete product','Remove this product and its purchase lots? Rations that name it lose their price.','Delete',true)){ DB.inventory=DB.inventory.filter(x=>x.id!==id); DB.purchases=(DB.purchases||[]).filter(l=>l.productId!==id); DB.bedding=(DB.bedding||[]).filter(b=>b.productId!==id); save(); closeSheet(); if(window.__costsRedraw)window.__costsRedraw(); } };
}
function openPurchaseSheet(productId, after){
  const p=(DB.inventory||[]).find(x=>x.id===productId); const isBed=p&&p.category==='bedding';
  const rec={date:todayISO(), qty:'', unit:isBed?(p.unit||'bag'):'lb', perBag:'', cost:'', note:''};
  const body=el('div');
  const draw=()=>{ const unit=body.querySelector('#lUnit')?body.querySelector('#lUnit').value:rec.unit;
    body.innerHTML=`<div class="field-row"><div class="field" style="flex:1"><label>Date</label><input class="control" type="date" id="lDate" value="${rec.date}"></div>
      <div class="field" style="flex:1"><label>Total cost ($)</label><input class="control" type="number" inputmode="decimal" id="lCost" value="${rec.cost}" placeholder="640"></div></div>
      <div class="field-row"><div class="field" style="flex:1"><label>Quantity</label><input class="control" type="number" inputmode="decimal" id="lQty" value="${rec.qty}" placeholder="1"></div>
        <div class="field" style="flex:1"><label>Unit</label><select class="control" id="lUnit">${(isBed?BEDDING_UNITS:PURCHASE_UNITS).map(u=>`<option ${unit===u?'selected':''}>${u}</option>`).join('')}</select></div></div>
      ${!isBed?`<div class="field" id="perBagWrap" style="${unit==='bag'?'':'display:none'}"><label>Pounds per bag</label><input class="control" type="number" inputmode="decimal" id="lPerBag" value="${rec.perBag}" placeholder="50"></div>`:''}
      <div id="lPreview"></div>
      <div class="field"><label>Note</label><input class="control" id="lNote" value="${esc(rec.note)}" placeholder="Mill run, delivered…"></div>`;
    const preview=()=>{ const qty=+$('#lQty',body).value||0, cost=+$('#lCost',body).value||0, u=$('#lUnit',body).value, pb=body.querySelector('#lPerBag')?+body.querySelector('#lPerBag').value:0;
      const base=isBed?qty:toLb(qty,u,pb); const per=base>0?cost/base:null;
      $('#lPreview',body).innerHTML=per!=null?`<div class="help" style="margin-bottom:10px">${ICON.money}<span>That's <b>${money(per)}/${isBed?(p.unit||'bag'):'lb'}</b>${!isBed&&base?` over ${round(base,0)} lb`:''}.</span></div>`:''; };
    if(body.querySelector('#lUnit'))body.querySelector('#lUnit').onchange=()=>{ rec.qty=$('#lQty',body).value;rec.cost=$('#lCost',body).value;rec.note=$('#lNote',body).value; draw(); };
    ['#lQty','#lCost'].forEach(s=>{if($(s,body))$(s,body).oninput=preview;}); if(body.querySelector('#lPerBag'))body.querySelector('#lPerBag').oninput=preview; preview(); };
  draw();
  const foot=el('div'); foot.innerHTML=`<button class="btn primary" data-save style="flex:1">Save purchase</button>`;
  const sh=openSheet({title:'Bulk purchase',body,foot});
  $('[data-save]',sh).onclick=()=>{ const qty=+$('#lQty',body).value||0, cost=+$('#lCost',body).value||0, u=$('#lUnit',body).value, pb=body.querySelector('#lPerBag')?+body.querySelector('#lPerBag').value:null;
    if(!qty||!cost){toast('Enter quantity and cost','bad');return;}
    DB.purchases.push(stamp({id:uid('lot'),productId,date:$('#lDate',body).value,qty,unit:u,perBag:pb,cost,note:$('#lNote',body).value.trim()}));
    // add to on-hand in the product's base unit
    const base=isBed?qty:toLb(qty,u,pb); if(base!=null){ p.onHand=(+p.onHand||0)+base; }
    logAct('expense','Bought '+money(cost)+' '+(p?p.product:'feed')); save(); closeSheet(); toast('Purchase logged','good'); if(after)after(); };
}
function openBeddingUseSheet(id){
  const beds=beddingProducts(); const b=id?{...(DB.bedding||[]).find(x=>x.id===id)}:{date:todayISO(),productId:beds[0]?beds[0].id:'',qty:'',scope:'pen',pen:'',animalId:''};
  const pens=[...new Set(activeAnimals().map(a=>a.penLocation).filter(Boolean))];
  const body=el('div');
  const draw=()=>{
    body.innerHTML=`<div class="field-row"><div class="field" style="flex:1"><label>Date</label><input class="control" type="date" id="bDate" value="${b.date}"></div>
      <div class="field" style="flex:1"><label>Quantity</label><input class="control" type="number" inputmode="decimal" id="bQty" value="${b.qty}" placeholder="2"></div></div>
      <div class="field"><label>Bedding product</label><select class="control" id="bProd">${beds.map(p=>`<option value="${p.id}" ${b.productId===p.id?'selected':''}>${esc(p.product)} (${money(productCost(p.id).perUnit||0)}/${p.unit||'bag'})</option>`).join('')}</select></div>
      <div class="field"><label>Applies to</label><div class="chips" id="bScope">${[['pen','Pen (split)'],['animal','One animal'],['barn','Barn overhead']].map(([k,l])=>`<button type="button" class="chip ${b.scope===k?'active':''}" data-scope="${k}">${l}</button>`).join('')}</div></div>
      ${b.scope==='pen'?`<div class="field"><label>Pen</label>${pens.length?`<select class="control" id="bPen">${pens.map(pn=>`<option ${b.pen===pn?'selected':''}>${esc(pn)}</option>`).join('')}</select>`:`<input class="control" id="bPen" value="${esc(b.pen||'')}" placeholder="Pen location">`}<div class="help" style="margin-top:8px">${ICON.info}<span>Cost splits evenly across active animals in this pen.</span></div></div>`:''}
      ${b.scope==='animal'?`<div class="field"><label>Animal</label><select class="control" id="bAnimal">${activeAnimals().map(a=>`<option value="${a.id}" ${b.animalId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div>`:''}
      ${b.scope==='barn'?`<div class="help">${ICON.info}<span>Counted in totals as barn overhead — not pushed into any single animal's cost of gain.</span></div>`:''}
      <div class="field"><label>Note</label><input class="control" id="bNote" value="${esc(b.note||'')}"></div>`;
    $$('[data-scope]',body).forEach(btn=>btn.onclick=()=>{ b.qty=$('#bQty',body).value; b.date=$('#bDate',body).value; b.productId=$('#bProd',body).value; if($('#bPen',body))b.pen=$('#bPen',body).value; if($('#bAnimal',body))b.animalId=$('#bAnimal',body).value; b.scope=btn.dataset.scope; draw(); });
  };
  draw();
  const foot=el('div'); foot.innerHTML=`${id?`<button class="btn danger" data-del>${ICON.trash}</button>`:''}<button class="btn primary" data-save style="flex:1">Save</button>`;
  const sh=openSheet({title:id?'Edit bedding use':'Log bedding used',body,foot});
  $('[data-save]',sh).onclick=()=>{ const qty=+$('#bQty',body).value||0; if(!qty){toast('Enter a quantity','bad');return;}
    const data={date:$('#bDate',body).value,productId:$('#bProd',body).value,qty,scope:b.scope,pen:$('#bPen',body)?$('#bPen',body).value.trim():'',animalId:$('#bAnimal',body)?$('#bAnimal',body).value:''};
    if(id){Object.assign((DB.bedding).find(x=>x.id===id),data);}else{DB.bedding.push(stamp({id:uid('bed'),...data}));}
    // draw down on-hand
    const p=(DB.inventory||[]).find(x=>x.id===data.productId); if(p&&!id){ p.onHand=Math.max(0,(+p.onHand||0)-qty); }
    save(); closeSheet(); toast('Bedding logged','good'); if(window.__costsRedraw)window.__costsRedraw(); };
  if($('[data-del]',sh))$('[data-del]',sh).onclick=async()=>{ if(await confirmSheet('Delete','Remove this bedding entry?','Delete',true)){ DB.bedding=DB.bedding.filter(x=>x.id!==id); save(); closeSheet(); if(window.__costsRedraw)window.__costsRedraw(); } };
}

/* ===================================================================
   START
   =================================================================== */
boot();
















