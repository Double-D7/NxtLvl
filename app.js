/* ===================================================================
   Devitt Family Show Team — Show Livestock Management
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
  plus:I('<path d="M12 5v14M5 12h14"/'),
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
  info:I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/'),
  download:I('<path d="M12 3v11M8 10l4 4 4-4M4 20h16"/>'),
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
const todayISO = () => new Date().toISOString().slice(0,10);
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
  return {put,get,del,url,upload};
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
const UNITS = ['lb','oz','cups','scoops','g','mL','cc','tablets','unit'];
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
    team:{ name:'Devitt Family Show Team', subtitle:'Show Livestock Management', logo:null,
           colors:{purple:'#4C1D95', teal:'#0D9488'}, weighDay:0 /*Sun*/ },
    users:[], currentUserId:null,
    species: SPECIES_DEFS.map(s=>({...s})),
    breeds: [],
    animals:[], weights:[], feed:[], media:[], measurements:[], exercise:[],
    health:[], shows:[], entries:[], tasks:[], notes:[], expenses:[], income:[],
    relatives:[], recs:[], activity:[], savedViews:[], shares:[], inventory:[],
    layovers:[], care:[], helpers:[],
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
function layoverDays(l){ const out=[]; if(!l||!l.start) return out; const end=l.end||l.start; let d=l.start; let guard=0; while(d<=end && guard++<60){ out.push(d); const dt=parseD(d); dt.setDate(dt.getDate()+1); d=dt.toISOString().slice(0,10); } return out; }
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
    if(since>=7) out.push({k:'warn', t:`No weight in ${since} days`}); }
  else out.push({k:'info', t:'No weights recorded yet'});
  if(a.targetWeight && s.projWeight!=null){
    if(s.projWeight < a.targetWeight-8) out.push({k:'bad', t:`Projected ${s.projWeight} — under ${a.targetWeight} target`});
    else if(s.projWeight > a.targetWeight+12) out.push({k:'warn', t:`Projected ${s.projWeight} — over ${a.targetWeight} target`});
  }
  if(s.adgPeriod!=null && s.adgLife!=null && s.adgPeriod < s.adgLife*0.5 && s.count>2) out.push({k:'warn',t:'ADG dropped sharply'});
  const missingMedia = mediaFor(a.id).length===0;
  if(missingMedia) out.push({k:'info', t:'No progress media'});
  return out;
}
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
  db.seeded=true;
  logAct('seed','Loaded demo show team data');
}
const DEMO_ARRAYS=['animals','weights','feed','media','measurements','exercise','health','shows','entries','tasks','notes','expenses','income','recs','relatives','inventory','layovers','care','helpers'];
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
const brandImg = () => `<img src="icon-192.png" alt="Devitt Family Show Team" style="width:100%;height:100%;object-fit:cover;display:block">`;

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
    const {data:team,error}=await this.sb.from('teams').insert({ owner:uid_, name:local.team?.name||'Devitt Family Show Team', data:local, write_token:this.token() }).select('id').single();
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
  else { DB=mergeDefaults(DB); if(!DB.breeds || !DB.breeds.length) seedBreeds(DB); save(true); }
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
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
}

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
    <h1>Devitt Family Show Team</h1><div class="tag">Show Livestock Management</div>
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
route('dashboard', ()=>{
  const active=activeAnimals();
  const bySpecies={}; DB.species.filter(s=>s.active).forEach(s=>bySpecies[s.id]=0);
  active.forEach(a=>bySpecies[a.species]=(bySpecies[a.species]||0)+1);
  const weighDay=DB.team.weighDay;
  const startWeek=(()=>{ const d=new Date(); const diff=(d.getDay()-weighDay+7)%7; d.setDate(d.getDate()-diff); return d.toISOString().slice(0,10); })();
  const weighedThisWeek=active.filter(a=>weightsFor(a.id).some(w=>w.date>=startWeek)).length;
  const needWeigh=active.filter(a=>{ const ws=weightsFor(a.id); return !ws.length || daysBetween(ws[ws.length-1].date,todayISO())>=7; });
  const upcoming=DB.shows.filter(s=>s.start>=todayISO()).sort((a,b)=>a.start<b.start?-1:1);
  const nextShow=upcoming[0];
  const alertAnimals=active.filter(a=>weightAlerts(a).some(x=>x.k==='bad'||x.k==='warn'));
  const recentMedia=DB.media.slice().sort((a,b)=>a.createdAt<b.createdAt?1:-1).slice(0,6);
  const todayTasks=DB.tasks.filter(t=>!t.done && t.date<=todayISO()).sort((a,b)=>a.date<b.date?-1:1).slice(0,6);
  const recentFeed=DB.feed.slice().sort((a,b)=>a.createdAt<b.createdAt?1:-1).slice(0,3);

  const v=setView('','dashboard');
  const wrap=el('div');
  // Hero: totals + species
  wrap.append(htmlToFrag(`
    <div class="grid g2">
      <div class="stat"><div class="k">Active animals</div><div class="v tnum">${active.length}</div><div class="sub">${DB.animals.length-active.length} archived</div></div>
      <div class="stat"><div class="k">Weighed this week</div><div class="v tnum">${weighedThisWeek}<small>/${active.length}</small></div><div class="sub">${needWeigh.length} need a weight</div></div>
    </div>
    <div class="section-title">Species</div>
    <div class="grid g4">${DB.species.filter(s=>s.active).map(s=>`
      <button class="stat" style="text-align:left" onclick="go('/animals?species=${s.id}')">
        <div style="display:flex;align-items:center;gap:7px;color:var(--purple-3)"><span style="width:20px;height:20px">${spIcon(s.id)}</span><span class="k" style="color:var(--muted)">${esc(s.name)}</span></div>
        <div class="v tnum" style="font-size:22px">${bySpecies[s.id]||0}</div></button>`).join('')}</div>
  `));

  // Next show countdown
  if(nextShow){ const dleft=daysBetween(todayISO(),nextShow.start);
    wrap.append(htmlToFrag(`<div class="card pad" style="margin-top:14px;background:linear-gradient(135deg,var(--purple),var(--purple-3));color:#fff;border:none;box-shadow:var(--shadow-lg)" onclick="go('/show/${nextShow.id}')">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="text-align:center;flex:none;background:rgba(255,255,255,.16);border-radius:14px;padding:10px 14px"><div style="font-size:30px;font-weight:800;line-height:1" class="tnum">${dleft}</div><div style="font-size:10px;font-weight:700;opacity:.85">DAYS</div></div>
        <div style="flex:1"><div style="font-size:11px;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:.5px">Next show</div><div style="font-size:17px;font-weight:800;margin-top:2px">${esc(nextShow.name)}</div><div style="font-size:12.5px;opacity:.85">${fmtDate(nextShow.start)} · ${esc(nextShow.location||nextShow.city||'')}</div></div>
        <span style="color:#fff">${ICON.chev}</span></div></div>`));
  }

  // Active layover banner
  const lay=activeLayover();
  if(lay){ const todayCare=careForLayover(lay.id).filter(c=>c.date===todayISO()); const done=todayCare.filter(c=>c.done).length; const dayN=layoverDays(lay).indexOf(todayISO())+1;
    wrap.append(htmlToFrag(`<div class="card pad" style="margin-top:14px;background:linear-gradient(135deg,#0EA5B7,var(--teal-3));color:#fff;border:none;box-shadow:var(--shadow-lg)" onclick="go('/layover/${lay.id}')">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="flex:none;color:#fff;width:34px;height:34px">${ICON.layover}</div>
        <div style="flex:1"><div style="font-size:11px;font-weight:700;opacity:.85;text-transform:uppercase;letter-spacing:.5px">Layover in progress${dayN>0?' · Day '+dayN:''}</div><div style="font-size:16px;font-weight:800;margin-top:2px">${esc(lay.name)}</div><div style="font-size:12.5px;opacity:.9">${done}/${todayCare.length} care items done today${lay.breeder?' · '+esc(lay.breeder):''}</div></div>
        <span style="color:#fff">${ICON.chev}</span></div></div>`));
  }

  // Today in the barn
  wrap.append(htmlToFrag(`<div class="section-title">Today in the barn <button class="more" onclick="go('/calendar')">Calendar</button></div>`));
  if(todayTasks.length){
    const list=el('div','list');
    todayTasks.forEach(t=>{
      const a=t.animalId?getAnimal(t.animalId):null;
      const li=el('div','li');
      li.innerHTML=`<button class="thumb" style="background:${t.done?'var(--good)':'var(--line-2)'};color:${t.done?'#fff':'var(--purple)'}" data-done>${t.done?ICON.check:(t.priority==='High'?ICON.flag:ICON.clock)}</button>
        <div class="main"><div class="t1" style="${t.done?'text-decoration:line-through;color:var(--muted)':''}">${esc(t.title)}</div><div class="t2">${a?esc(a.name)+' · ':''}${t.date<todayISO()?'<span style="color:var(--bad)">Overdue</span>':'Due today'}${t.recur?' · repeats':''}</div></div>`;
      $('[data-done]',li).onclick=(e)=>{e.stopPropagation(); t.done=!t.done; if(t.done)logAct('task','Completed: '+t.title,t.animalId); save(); render(); };
      li.onclick=()=>{ if(a)go('/animal/'+a.id); };
      list.append(li);
    });
    wrap.append(list);
  } else wrap.append(htmlToFrag(emptyState(ICON.check,'All caught up','No tasks due today. Add one from the Calendar.')));

  // Alerts
  if(alertAnimals.length){
    wrap.append(htmlToFrag(`<div class="section-title">Attention needed</div>`));
    const list=el('div','list');
    alertAnimals.slice(0,5).forEach(a=>{ const al=weightAlerts(a).find(x=>x.k==='bad')||weightAlerts(a).find(x=>x.k==='warn');
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
});

function emptyState(icon,h,p){ return `<div class="card"><div class="empty">${icon}<div class="h">${esc(h)}</div><div class="p">${esc(p)}</div></div></div>`; }
function animalRow(a, right, sub){
  const st=animalStats(a);
  const li=el('div','li');
  li.innerHTML=`<div class="thumb" data-thumb>${esc(initials(a.name))}</div>
    <div class="main"><div class="t1">${esc(a.name)}</div><div class="t2">${sub!=null?esc(sub):esc(speciesName(a.species)+' · '+a.breed+(st.curW!=null?' · '+st.curW+' lb':''))}</div></div>
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
      <div class="field"><label>Species</label><select class="control" id="afSp">${DB.species.filter(s=>s.active).map(s=>`<option value="${s.id}" ${a.species===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
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
const ANIMAL_TABS=[['overview','Overview'],['weight','Weight'],['feed','Feed'],['care','Care'],['media','Media'],['measurements','Measure'],['health','Health'],['exercise','Exercise'],['shows','Shows'],['pedigree','Pedigree'],['expenses','Expenses'],['notes','Notes'],['activity','History']];
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
  if($('[data-setphoto]',hero)) $('[data-setphoto]',hero).onclick=()=>uploadProfilePhoto(a.id);
  $$('[data-tab]',hero).forEach(b=>b.onclick=()=>{ go('/animal/'+id+'/'+b.dataset.tab); });
  // keep active tab visible
  const at=$('.tab.active',hero); if(at) at.scrollIntoView({inline:'center',block:'nearest'});
  const body=$('#tabBody',hero);
  ({overview:tabOverview,weight:tabWeight,feed:tabFeed,care:tabCare,media:tabMedia,measurements:tabMeasure,health:tabHealth,exercise:tabExercise,shows:tabShows,pedigree:tabPedigree,expenses:tabExpenses,notes:tabNotes,activity:tabActivity}[tab]||tabOverview)(body,a);
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
    <div class="section-title">Growth chart</div>
    <div class="card pad">${overviewChart(a)}
      <div class="chart-legend"><span><span class="leg-line" style="background:var(--purple-3)"></span>Actual</span>${a.targetWeight?'<span><span class="leg-line" style="background:var(--teal-3)"></span>Target</span>':''}${st.projWeight!=null?'<span><span class="leg-line" style="background:#C4B5FD;border-top:2px dashed #C4B5FD"></span>Projected</span>':''}</div></div>
    ${alerts.length?`<div class="section-title">Alerts</div><div class="list">${alerts.map(al=>`<div class="li"><div class="dot" style="background:var(--${al.k==='bad'?'bad':al.k==='warn'?'warn':'info'})"></div><div class="main"><div class="t1" style="font-size:13.5px;font-weight:600">${esc(al.t)}</div></div></div>`).join('')}</div>`:''}
    <div class="section-title">Current feed</div>
    ${cf?feedCard(cf,false):emptyState(ICON.feed,'No feed program','Add the current ration to start tracking response.')}
    <div class="section-title">Details</div>
    <div class="card pad">${detailKV(a)}</div>
    <div class="section-title">Timeline</div>
    <div class="card pad" id="ovTimeline"></div>
    <div style="height:8px"></div>`;
  const cover=$('[data-cover]');
  renderTimeline($('#ovTimeline',box),a);
  $$('[data-fquick]',box).forEach(b=>{});
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
function weightFlags(ws, sp){
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
  return flags;
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
      <div class="main"><div class="t1 tnum">${w.weight} lb${fl?` <span class="pill ${fl.level==='bad'?'bad':'warn'}" style="font-size:9px">Check</span>`:''}</div><div class="t2">${fmtDate(w.date)}${w.scale?' · '+esc(w.scale):''}${w.by?' · '+esc(userName(w.by)):''}</div>${fl?`<div class="t2" style="color:var(--${fl.level==='bad'?'bad':'warn'});white-space:normal;font-weight:600;margin-top:2px">${esc(fl.reason)}</div>`:''}</div>
      <div class="r">${gain!=null?`<div style="font-weight:800;color:${gain>=0?'var(--good)':'var(--bad)'}" class="tnum">${gain>=0?'+':''}${gain}</div><div style="font-size:11px;color:var(--muted)" class="tnum">${adg!=null?adg+' lb/d':''}</div>`:'<span class="pill gray" style="font-size:10px">start</span>'}</div>`;
    li.onclick=()=>openWeightSheet(a.id,w.id); L.append(li); }); hist.append(L); }
  if($('#wFlagBanner',box))$('#wFlagBanner',box).onclick=()=>{ const first=$('#wHist .li[style*="border-left"]',box); if(first)first.scrollIntoView({behavior:'smooth',block:'center'}); };
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
    ${fs.adg!=null?`<div style="display:flex;gap:14px;margin-top:10px;font-size:12px;font-weight:700;color:var(--muted)"><span>Gain <b class="tnum" style="color:var(--ink)">${fs.gain>0?'+':''}${fs.gain} lb</b></span><span>ADG <b class="tnum" style="color:var(--ink)">${fs.adg} lb/d</b></span></div>`:''}
  </div>`;
}
function tabFeed(box,a){
  const progs=feedFor(a.id); const cur=currentFeed(a.id);
  box.innerHTML=`<div class="btn-row"><button class="btn primary" id="addFeed" style="flex:1">${ICON.plus} New feed program</button>
    ${progs.length>1?`<button class="btn" id="cmpFeed">${ICON.trend} Compare</button>`:''}</div>
    <div class="help" style="margin-top:12px">${ICON.info}<span>Changing feed never erases the old program — each change is saved as a dated version so you can see what worked.</span></div>
    ${cur?`<div class="section-title">Current program</div>${feedCard(cur)}`:''}
    ${progs.filter(f=>f.id!==(cur&&cur.id)).length?`<div class="section-title">History</div><div id="feedHist"></div>`:progs.length?'':emptyState(ICON.feed,'No feed program yet','Add the current ration to start tracking feed response against weight.')}`;
  const hist=$('#feedHist',box);
  if(hist){ progs.filter(f=>f.id!==(cur&&cur.id)).forEach(f=>{ const c=htmlToFrag(feedCard(f)); const wrap=el('div'); wrap.style.marginBottom='10px'; wrap.append(c);
    const bar=el('div','btn-row'); bar.style.marginTop='6px';
    bar.innerHTML=`<button class="btn sm ghost" data-dup>${ICON.copy} Duplicate</button><button class="btn sm ghost" data-edit>${ICON.edit} Edit</button>`;
    $('[data-dup]',bar).onclick=()=>openFeedSheet(a.id,null,f); $('[data-edit]',bar).onclick=()=>openFeedSheet(a.id,f.id);
    wrap.append(bar); hist.append(wrap); }); }
  $('#addFeed',box).onclick=()=>openFeedSheet(a.id);
  if($('#cmpFeed',box))$('#cmpFeed',box).onclick=()=>openFeedCompare(a.id);
  // clicking current card edits
  const cc=$('.section-title',box);
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
  $('[data-save]',sh).onclick=()=>{ const val=+$('#wInput',body).value; if(!val){toast('Enter a weight','bad');return;}
    const rec={ weight:val, date:$('#wDate',body).value, time:$('#wTime',body).value, scale:$('#wScale',body).value.trim(), bcs:$('#wBcs',body).value||null, fill:$('#wFill',body).value||null, notes:$('#wNotes',body).value.trim(), by:DB.currentUserId };
    DB.lastScale=rec.scale;
    if(weightId){ Object.assign(DB.weights.find(x=>x.id===weightId),rec); touch(DB.weights.find(x=>x.id===weightId)); logAct('weight','Edited weight '+val+' lb',animalId); }
    else { DB.weights.push(stamp({id:uid('w'),animalId,...rec})); logAct('weight','Logged '+val+' lb',animalId); }
    save(); closeSheet(); toast('Weight saved','good'); render();
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
      <button class="btn sm block" id="addMeal" style="margin:4px 0 12px">${ICON.plus} Add feeding</button>
      <div class="field"><label>Reason for change</label><input class="control" id="fReason" value="${esc(f.reason||'')}" placeholder="e.g. adding cover before show"></div>
      <div class="field"><label>Advisor recommendation</label><input class="control" id="fAdv" value="${esc(f.advisorRec||'')}"></div>`;
    const mc=$('#fMeals',body);
    (f.meals||[]).forEach((m,mi)=>{ const card=el('div','card pad'); card.style.marginBottom='10px';
      card.innerHTML=`<div style="display:flex;gap:8px;margin-bottom:8px"><input class="control" value="${esc(m.time)}" data-mtime="${mi}" style="font-weight:700;flex:1" placeholder="Morning"><button class="iconbtn" style="background:var(--line-2);color:var(--bad)" data-mdel="${mi}">${ICON.trash}</button></div><div data-items="${mi}"></div><button class="btn sm ghost" data-add="${mi}">${ICON.plus} Add product</button>`;
      const ic=$('[data-items="'+mi+'"]',card);
      (m.items||[]).forEach((it,ii)=>{ const row=el('div'); row.style.cssText='display:flex;gap:6px;margin-bottom:6px';
        row.innerHTML=`<input class="control" value="${esc(it.product)}" data-p="${mi}-${ii}" placeholder="Product" style="flex:2"><input class="control" type="number" inputmode="decimal" value="${it.amount}" data-a="${mi}-${ii}" placeholder="Qty" style="flex:1;min-width:56px"><select class="control" data-u="${mi}-${ii}" style="flex:1;min-width:70px">${UNITS.map(u=>`<option ${it.unit===u?'selected':''}>${u}</option>`).join('')}</select><button class="iconbtn" style="background:var(--line-2);color:var(--muted);flex:none" data-idel="${mi}-${ii}">${ICON.x}</button>`;
        ic.append(row); });
      mc.append(card); });
    // wire
    $$('[data-mtime]',body).forEach(inp=>inp.oninput=()=>f.meals[+inp.dataset.mtime].time=inp.value);
    $$('[data-mdel]',body).forEach(b=>b.onclick=()=>{collectMeals();f.meals.splice(+b.dataset.mdel,1);draw();});
    $$('[data-add]',body).forEach(b=>b.onclick=()=>{collectMeals();f.meals[+b.dataset.add].items.push({product:'',amount:'',unit:'lb'});draw();});
    $$('[data-idel]',body).forEach(b=>b.onclick=()=>{collectMeals();const[mi,ii]=b.dataset.idel.split('-').map(Number);f.meals[mi].items.splice(ii,1);draw();});
    $('#addMeal',body).onclick=()=>{collectMeals();f.meals.push({time:'Midday',items:[{product:'',amount:'',unit:'lb'}]});draw();};
  };
  const collectMeals=()=>{ $$('[data-p]',body).forEach(inp=>{const[mi,ii]=inp.dataset.p.split('-').map(Number);f.meals[mi].items[ii].product=inp.value;});
    $$('[data-a]',body).forEach(inp=>{const[mi,ii]=inp.dataset.a.split('-').map(Number);f.meals[mi].items[ii].amount=inp.value;});
    $$('[data-u]',body).forEach(inp=>{const[mi,ii]=inp.dataset.u.split('-').map(Number);f.meals[mi].items[ii].unit=inp.value;});
    $$('[data-mtime]',body).forEach(inp=>f.meals[+inp.dataset.mtime].time=inp.value); };
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
function tabMedia(box,a){
  const items=mediaFor(a.id);
  box.innerHTML=`<div class="btn-row"><button class="btn primary" id="upPhoto" style="flex:1">${ICON.camera} Photo</button><button class="btn teal" id="upVideo" style="flex:1">${ICON.video} Video</button></div>
    <div class="seg" id="mView" style="margin-top:12px"><button class="on" data-v="gallery">Gallery</button><button data-v="timeline">Timeline</button><button data-v="compare">Before / After</button></div>
    <div id="mBody" style="margin-top:12px"></div>`;
  const photoIn=hiddenFile('image/*',(files)=>addMedia(a.id,files,'photo'));
  const videoIn=hiddenFile('video/*',(files)=>addMedia(a.id,files,'video'));
  $('#upPhoto',box).onclick=()=>photoIn.click(); $('#upVideo',box).onclick=()=>videoIn.click();
  let view='gallery';
  const draw=()=>{ const mb=$('#mBody',box);
    if(!items.length){ mb.innerHTML=emptyState(ICON.media,'No media yet','Upload weekly side, front, rear and walking media to document progress.'); return; }
    if(view==='gallery'){ const g=el('div','gallery'); items.forEach(m=>g.append(mediaCell(m,a))); mb.innerHTML=''; mb.append(g); }
    else if(view==='timeline'){ mb.innerHTML=''; const grp={}; items.forEach(m=>{ const wk=m.captured||m.date; (grp[wk]=grp[wk]||[]).push(m); });
      Object.keys(grp).sort().reverse().forEach(d=>{ mb.append(htmlToFrag(`<div class="section-title" style="margin-top:8px">${fmtDate(d)} · ${relDays(d)}</div>`)); const g=el('div','gallery'); grp[d].forEach(m=>g.append(mediaCell(m,a))); mb.append(g); }); }
    else { drawCompare(mb,a,items); }
  };
  draw();
  $$('#mView button',box).forEach(b=>b.onclick=()=>{ view=b.dataset.v; $$('#mView button',box).forEach(x=>x.classList.toggle('on',x===b)); draw(); });
}
function mediaCell(m,a){ const cell=el('div','g'); cell.innerHTML=`<div class="tag">${esc(m.view||m.kind)}</div>`+(m.kind==='video'?`<div class="play">${ICON.video}</div>`:'');
  Media.url(m.blobId).then(u=>{ if(!u)return; const e=m.kind==='video'?el('video'):el('img'); e.src=u; if(m.kind==='video')e.muted=true; cell.prepend(e); });
  cell.onclick=()=>openMediaViewer(m,a); return cell; }
function hiddenFile(accept,cb,opts){ let inp=el('input'); inp.type='file'; inp.accept=accept; inp.style.display='none';
  if(opts&&opts.multiple!==false) inp.multiple=true;
  // No `capture` attribute → the phone shows its full picker (Photo Library,
  // Take Photo/Video, Choose File) instead of forcing a live camera shot.
  if(opts&&opts.capture) inp.capture=opts.capture;
  inp.onchange=()=>{ if(inp.files.length)cb([...inp.files]); inp.value=''; }; document.body.appendChild(inp); return inp; }
async function addMedia(animalId,files,kind){
  if(!can('addRecord')){ toast('Your role can’t upload media','bad'); return; }
  toast('Uploading…','');
  for(const file of files){ const blobId=uid('blob'); await Media.put(blobId,file); await Media.upload(blobId,file);
    const rec=stamp({id:uid('m'),animalId,kind:kind||(file.type.startsWith('video')?'video':'photo'),blobId,size:file.size,mime:file.type,view: kind==='video'?'Walking video':'Side view',date:todayISO(),captured:todayISO(),by:DB.currentUserId,caption:'',shared:false});
    // capture weight+feed context
    const ws=weightsFor(animalId); rec.contextWeight=ws.length?+ws[ws.length-1].weight:null; const cf=currentFeed(animalId); rec.contextFeed=cf?cf.name:null;
    if(!getAnimal(animalId).profileMediaId && kind!=='video'){ getAnimal(animalId).profileMediaId=blobId; }
    DB.media.push(rec);
  }
  logAct('media',`Uploaded ${files.length} ${kind}${files.length>1?'s':''}`,animalId); save(); toast('Media added','good'); render();
}
/* pick a photo from the library (or camera) and set it as the animal's profile picture */
function uploadProfilePhoto(animalId){
  if(!can('addRecord')){ toast('Your role can’t change photos','bad'); return; }
  hiddenFile('image/*', async(files)=>{
    const file=files[0]; if(!file) return;
    toast('Uploading…','');
    const blobId=uid('blob'); await Media.put(blobId,file); await Media.upload(blobId,file);
    const a=getAnimal(animalId); if(!a) return;
    const ws=weightsFor(animalId); const cf=currentFeed(animalId);
    DB.media.push(stamp({id:uid('m'),animalId,kind:'photo',blobId,size:file.size,mime:file.type,view:'Profile',date:todayISO(),captured:todayISO(),by:DB.currentUserId,caption:'',shared:false,contextWeight:ws.length?+ws[ws.length-1].weight:null,contextFeed:cf?cf.name:null}));
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
    const days=daysBetween(A.captured||A.date,B.captured||B.date); const dw=(A.contextWeight!=null&&B.contextWeight!=null)?round(B.contextWeight-A.contextWeight,1):null; const adg=(dw!=null&&days>0)?round(dw/days,2):null;
    $('#cmpStats',box).innerHTML=`<div style="display:flex;justify-content:space-around;text-align:center"><div><div style="font-size:11px;color:var(--muted);font-weight:700">DAYS</div><div style="font-weight:800;font-size:18px" class="tnum">${Math.abs(days)}</div></div><div><div style="font-size:11px;color:var(--muted);font-weight:700">WEIGHT Δ</div><div style="font-weight:800;font-size:18px" class="tnum">${dw!=null?(dw>0?'+':'')+dw+' lb':'—'}</div></div><div><div style="font-size:11px;color:var(--muted);font-weight:700">ADG</div><div style="font-weight:800;font-size:18px;color:var(--purple-3)" class="tnum">${adg??'—'}</div></div></div>`; };
  $('#cmpA',box).onchange=paint; $('#cmpB',box).onchange=paint; paint();
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
  const total=exp.reduce((s,e)=>s+(+e.amount||0),0); const incTotal=inc.reduce((s,e)=>s+(+e.amount||0),0);
  const st=animalStats(a); const cog=st.gainTotal>0?total/st.gainTotal:null;
  box.innerHTML=`<div class="grid g2"><div class="stat"><div class="k">Invested</div><div class="v tnum" style="font-size:22px">${money(total)}</div></div><div class="stat"><div class="k">Net</div><div class="v tnum" style="font-size:22px;color:${incTotal-total>=0?'var(--good)':'var(--ink)'}">${money(incTotal-total)}</div><div class="sub">${incTotal?money(incTotal)+' income':''}</div></div></div>
    ${cog?`<div class="help" style="margin-top:10px">${ICON.info}<span>Cost of gain: <b>${money(cog)}/lb</b> over ${st.gainTotal} lb gained</span></div>`:''}
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
  const acts=[['Add weight',ICON.weight,'var(--purple-3)','weight'],['Log care',ICON.layover,'#38BDF8','care'],['Upload photo',ICON.camera,'var(--info)','photo'],['Upload video',ICON.video,'var(--teal-3)','video'],['Change feed',ICON.feed,'var(--teal-3)','feed'],['Health record',ICON.health,'var(--bad)','health'],['Log exercise',ICON.run,'var(--warn)','exercise'],['Add note',ICON.note,'var(--muted)','note'],['New animal',ICON.animals,'var(--purple)','animal'],['New task',ICON.check,'var(--good)','task']];
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
  activeAnimals().forEach(a=>weightAlerts(a).forEach(al=>{ if(al.k!=='info')out.push({animal:a,...al}); }));
  DB.tasks.filter(t=>!t.done&&t.date<todayISO()).forEach(t=>out.push({k:'warn',t:'Task overdue: '+t.title,taskId:t.id}));
  DB.shows.filter(s=>s.entryDeadline&&s.entryDeadline>=todayISO()&&daysBetween(todayISO(),s.entryDeadline)<=7).forEach(s=>out.push({k:'info',t:'Entry deadline soon: '+s.name}));
  DB.health.filter(h=>h.withdrawal&&h.withdrawal>=todayISO()).forEach(h=>{ const a=getAnimal(h.animalId); out.push({k:'warn',t:`${a?a.name:''} withdrawal ends ${fmtShort(h.withdrawal)}`,animal:a}); });
  DB.recs.filter(r=>r.status==='pending').forEach(r=>{ const a=getAnimal(r.animalId); out.push({k:'p',t:`Advisor rec for ${a?a.name:''}`,animal:a}); });
  return out;
}
function openAlerts(){
  const alerts=collectAlerts(); const body=el('div');
  if(!alerts.length){ body.innerHTML='<div class="empty" style="padding:24px">'+ICON.check+'<div class="h">All clear</div><div class="p">No alerts right now.</div></div>'; }
  else { const L=el('div','list'); alerts.forEach(al=>{ const li=el('div','li');
    li.innerHTML=`<div class="dot" style="background:var(--${al.k==='bad'?'bad':al.k==='warn'?'warn':al.k==='p'?'purple-3':'info'})"></div><div class="main"><div class="t1" style="font-size:13.5px;font-weight:600">${esc(al.t)}</div>${al.animal?`<div class="t2">${esc(al.animal.name)}</div>`:''}</div>${al.animal?ICON.chev:''}`;
    if(al.animal)li.onclick=()=>{closeSheet();go('/animal/'+al.animal.id);}; L.append(li); }); body.append(L); }
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
  const sh=openSheet({title:id?'Edit entry':'Show entry',body,foot});
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
    onSave:s=>{ e.result=s; touch(e); if(s.salePrice)DB.income.push(stamp({id:uid('in'),animalId:e.animalId,source:'Sale proceeds',amount:+s.salePrice,date:todayISO()})); if(s.premium)DB.income.push(stamp({id:uid('in'),animalId:e.animalId,source:'Premium',amount:+s.premium,date:todayISO()})); logAct('show','Recorded result: placed '+(s.placing||'?'),e.animalId); save(); toast('Result saved','good'); render(); } });
}

/* ===================================================================
   CALENDAR + TASKS
   =================================================================== */
route('calendar',()=>{
  const v=setView('','calendar');
  const wrap=el('div'); v.append(wrap);
  const draw=()=>{
    // build events: tasks + shows + deadlines + withdrawals
    const events=[];
    DB.tasks.forEach(t=>events.push({date:t.date,kind:'task',title:t.title,ref:t,done:t.done,priority:t.priority,animalId:t.animalId}));
    DB.shows.forEach(s=>{ events.push({date:s.start,kind:'show',title:s.name,ref:s});
      if(s.entryDeadline)events.push({date:s.entryDeadline,kind:'deadline',title:'Entry deadline · '+s.name,ref:s}); });
    DB.health.forEach(h=>{ if(h.withdrawal){const a=getAnimal(h.animalId);events.push({date:h.withdrawal,kind:'withdrawal',title:(a?a.name+' ':'')+'withdrawal ends',animalId:h.animalId});} if(h.followup){const a=getAnimal(h.animalId);events.push({date:h.followup,kind:'health',title:(a?a.name+' ':'')+'health follow-up',animalId:h.animalId});} });
    const upcoming=events.filter(e=>e.date>=todayISO()).sort((a,b)=>a.date<b.date?-1:1);
    const overdue=events.filter(e=>e.kind==='task'&&!e.done&&e.date<todayISO()).sort((a,b)=>a.date<b.date?-1:1);
    wrap.innerHTML=`${pageHeader('Calendar',null,`<button class="btn primary sm" id="addT">${ICON.plus} Task</button>`)}
      ${miniMonth(events)}
      ${overdue.length?`<div class="section-title" style="color:var(--bad)">Overdue</div><div id="ovd"></div>`:''}
      <div class="section-title">Upcoming</div><div id="upc"></div>`;
    $('#addT',wrap).onclick=()=>openTaskSheet();
    if($('#ovd',wrap))$('#ovd',wrap).append(eventList(overdue));
    const uc=$('#upc',wrap); if(upcoming.length)uc.append(eventList(upcoming.slice(0,40))); else uc.innerHTML=emptyState(ICON.cal,'Nothing scheduled','Add tasks, weigh days and shows to your team calendar.');
  };
  draw();
});
function miniMonth(events){
  const now=new Date(); const y=now.getFullYear(),m=now.getMonth();
  const first=new Date(y,m,1).getDay(); const days=new Date(y,m+1,0).getDate();
  const evByDay={}; events.forEach(e=>{ const d=parseD(e.date); if(d&&d.getFullYear()===y&&d.getMonth()===m)(evByDay[d.getDate()]=evByDay[d.getDate()]||[]).push(e); });
  let cells=''; for(let i=0;i<first;i++)cells+='<div></div>';
  for(let d=1;d<=days;d++){ const isToday=d===now.getDate(); const ev=evByDay[d]||[];
    cells+=`<div style="aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:10px;position:relative;font-size:13px;font-weight:700;${isToday?'background:var(--purple);color:#fff':ev.length?'background:var(--line-2)':''}">${d}${ev.length?`<div style="display:flex;gap:2px;margin-top:2px">${ev.slice(0,3).map(e=>`<span style="width:4px;height:4px;border-radius:50%;background:${isToday?'#fff':e.kind==='show'?'var(--purple-3)':e.kind==='deadline'?'var(--bad)':'var(--teal-3)'}"></span>`).join('')}</div>`:''}</div>`; }
  return `<div class="card pad"><div style="text-align:center;font-weight:800;margin-bottom:10px">${now.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;font-size:10px;color:var(--muted);font-weight:700;text-align:center;margin-bottom:4px">${['S','M','T','W','T','F','S'].map(d=>`<div>${d}</div>`).join('')}</div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">${cells}</div></div>`;
}
function eventList(events){
  const L=el('div','list');
  events.forEach(e=>{ const a=e.animalId?getAnimal(e.animalId):null; const li=el('div','li');
    const ic={task:ICON.check,show:ICON.shows,deadline:ICON.flag,withdrawal:ICON.health,health:ICON.health}[e.kind]||ICON.cal;
    const col={task:'var(--good)',show:'var(--purple-3)',deadline:'var(--bad)',withdrawal:'var(--warn)',health:'var(--bad)'}[e.kind];
    li.innerHTML=`<button class="thumb" style="color:${col}" ${e.kind==='task'?'data-done':''}>${e.kind==='task'&&e.done?ICON.check:ic}</button>
      <div class="main"><div class="t1" style="${e.done?'text-decoration:line-through;color:var(--muted)':''}">${esc(e.title)}</div><div class="t2">${fmtDate(e.date)} · ${relDays(e.date)}${a?' · '+esc(a.name):''}</div></div>
      ${e.priority==='High'?'<span class="pill bad" style="font-size:10px">High</span>':''}`;
    if(e.kind==='task'){ $('[data-done]',li).onclick=(ev)=>{ev.stopPropagation();e.ref.done=!e.ref.done;if(e.ref.done)logAct('task','Completed: '+e.ref.title,e.animalId);save();render();};
      li.onclick=()=>openTaskSheet(e.ref.id); }
    else if(e.kind==='show'||e.kind==='deadline'){ li.onclick=()=>go('/show/'+e.ref.id); }
    else if(a){ li.onclick=()=>go('/animal/'+a.id); }
    L.append(li); });
  return L;
}
function openTaskSheet(id){
  const t=id?{...DB.tasks.find(x=>x.id===id)}:{title:'',date:todayISO(),priority:'Normal',done:false,recur:''};
  const body=el('div');
  body.innerHTML=`<div class="field"><label>Task *</label><input class="control" id="tkTitle" value="${esc(t.title)}" placeholder="Weigh Batman"></div>
    <div class="field-row"><div class="field" style="flex:1"><label>Date</label><input class="control" type="date" id="tkDate" value="${t.date}"></div>
      <div class="field" style="flex:1"><label>Priority</label><select class="control" id="tkPri">${['Low','Normal','High'].map(p=>`<option ${t.priority===p?'selected':''}>${p}</option>`).join('')}</select></div></div>
    <div class="field"><label>Animal</label><select class="control" id="tkAnimal"><option value="">— none —</option>${activeAnimals().map(a=>`<option value="${a.id}" ${t.animalId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div>
    <div class="field"><label>Repeats</label><select class="control" id="tkRecur">${[['','No'],['weekly','Weekly'],['biweekly','Every 2 weeks'],['daily','Daily']].map(([v,l])=>`<option value="${v}" ${t.recur===v?'selected':''}>${l}</option>`).join('')}</select></div>`;
  const foot=el('div'); foot.innerHTML=`${id?`<button class="btn danger" data-del>${ICON.trash}</button>`:''}<button class="btn primary" data-save style="flex:1">Save task</button>`;
  const sh=openSheet({title:id?'Edit task':'New task',body,foot});
  $('[data-save]',sh).onclick=()=>{ const data={title:$('#tkTitle',body).value.trim(),date:$('#tkDate',body).value,priority:$('#tkPri',body).value,animalId:$('#tkAnimal',body).value||null,recur:$('#tkRecur',body).value}; if(!data.title){toast('Name the task','bad');return;}
    if(id){Object.assign(DB.tasks.find(x=>x.id===id),data);}else{DB.tasks.push(stamp({id:uid('t'),done:false,...data}));} save(); closeSheet(); toast('Task saved','good'); render(); };
  if($('[data-del]',sh))$('[data-del]',sh).onclick=async()=>{ if(await confirmSheet('Delete task','Remove this task?','Delete',true)){DB.tasks=DB.tasks.filter(x=>x.id!==id);save();closeSheet();render();} };
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
    <div class="section-title">Entries <button class="more" id="addEnt2">Add entry</button></div>
    <div id="shEntries"></div>`;
  v.append(wrap);
  $('#edShow',wrap).onclick=()=>openShowSheet(s.id);
  $('#addEnt2',wrap).onclick=()=>{ // pick animal then entry
    const body=el('div'); const L=el('div','list'); activeAnimals().forEach(a=>{ const li=animalRow(a,''); li.onclick=()=>{closeSheet();openEntrySheet(a.id);}; L.append(li); }); body.append(L); openSheet({title:'Add entry — pick animal',body}); };
  const ec=$('#shEntries',wrap);
  if(!entries.length){ ec.innerHTML=emptyState(ICON.animals,'No entries','Assign animals to this show.'); return; }
  const L=el('div','list'); entries.forEach(e=>{ const a=getAnimal(e.animalId); if(!a)return; const r=e.result||{}; const li=el('div','li');
    li.innerHTML=`<div class="thumb">${esc(initials(a.name))}</div><div class="main"><div class="t1">${esc(a.name)}</div><div class="t2">${esc(e.division||'')}${e.cls?' · '+esc(e.cls):''}${e.showWeight?' · '+e.showWeight+' lb':''}</div></div>
      <div class="r">${r.placing?`<span class="pill p" style="font-size:10px">${esc(r.placing)}${r.inClass?'/'+r.inClass:''}</span>`:'<button class="btn sm teal" data-res>Result</button>'}</div>`;
    if(r.placing)li.onclick=()=>go('/animal/'+a.id+'/shows'); else $('[data-res]',li).onclick=()=>openResultSheet(e.id); L.append(li); });
  ec.append(L);
});
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
    $('#logCare',wrap).onclick=()=>openCareSheet({layoverId:l.id, date:day, animalId:animalId!=='all'?animalId:(ids[0]||null), markDone:true});
    $('#schedCare',wrap).onclick=()=>openCareSheet({layoverId:l.id, date:day, animalId:animalId!=='all'?animalId:(ids[0]||null), markDone:false});
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
  const body=el('div');
  body.innerHTML=`
    ${animals.length?`<div class="field"><label>Animal</label><select class="control" id="caAnimal">${animals.map(a=>`<option value="${a.id}" ${c.animalId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div>`:''}
    <div class="field"><label>What did the breeder direct?</label>
      <div class="chips" id="caCats" style="flex-wrap:wrap;white-space:normal">${CARE_CATS.map(cat=>`<button type="button" class="chip ${c.category===cat.key?'active':''}" data-cat="${cat.key}"><span style="width:15px;height:15px;color:${c.category===cat.key?'#fff':cat.color}">${ICON[cat.icon]}</span>${cat.key}</button>`).join('')}</div></div>
    <div class="field"><label>Detail / amount</label><input class="control" id="caDetail" value="${esc(c.detail||'')}" placeholder="e.g. 2 oz Game On · walk 15 min · rinse & blow out"></div>
    <div class="field-row"><div class="field" style="flex:1"><label>Date</label><input class="control" type="date" id="caDate" value="${c.date}"></div>
      <div class="field" style="flex:1"><label>Time</label><input class="control" type="time" id="caTime" value="${c.time||nowTime()}"></div></div>
    <label class="li" style="border:1px solid var(--line);border-radius:12px;margin-bottom:12px"><div class="main"><div class="t1" style="font-size:14px">Mark done now</div><div class="t2">Stamps the actual time it was completed</div></div><input type="checkbox" id="caDone" ${c.done?'checked':''} style="width:22px;height:22px"></label>
    <div class="field"><label>Notes / how they responded</label><textarea class="control" id="caNotes" placeholder="drank well · stayed fresh · a little hot">${esc(c.notes||'')}</textarea></div>`;
  let cat=c.category;
  $$('[data-cat]',body).forEach(b=>b.onclick=()=>{ cat=b.dataset.cat; $$('[data-cat]',body).forEach(x=>{ const cc=careCat(x.dataset.cat); x.classList.toggle('active',x===b); const sp=x.querySelector('span'); if(sp)sp.style.color=(x===b)?'#fff':cc.color; }); });
  const foot=el('div'); foot.innerHTML=`${editing?`<button class="btn danger" data-del>${ICON.trash}</button>`:''}<button class="btn primary" data-save style="flex:1">${editing?'Save':'Log it'}</button>`;
  const sh=openSheet({title:editing?'Edit care entry':'Log care',body,foot});
  $('[data-save]',sh).onclick=()=>{
    const data={ category:cat, title:careCat(cat).key===cat?'':'', detail:$('#caDetail',body).value.trim(), date:$('#caDate',body).value, time:$('#caTime',body).value, notes:$('#caNotes',body).value.trim(), done:$('#caDone',body).checked };
    if($('#caAnimal',body)) data.animalId=$('#caAnimal',body).value;
    data.title=''; // category is the primary label; detail carries specifics
    if(!data.animalId){ toast('Pick an animal','bad'); return; }
    if(editing){ const rec=DB.care.find(x=>x.id===opts.edit); const wasDone=rec.done; Object.assign(rec,data); if(data.done&&!rec.doneAt)rec.doneAt=nowISO(); if(!data.done)rec.doneAt=null; touch(rec); }
    else { const rec=stamp({id:uid('care'),layoverId:c.layoverId,by:DB.currentUserId,...data}); if(data.done)rec.doneAt=nowISO(); DB.care.push(rec); }
    logAct('care',(data.done?'Logged ':'Scheduled ')+data.category+(data.detail?' · '+data.detail:''),data.animalId);
    save(); closeSheet(); toast('Care logged','good'); render();
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
    <body><h1>${esc(h.name)} — animals I'm helping with</h1><div class="sub">Devitt Family Show Team · ${fmtDate(todayISO())} · ${animals.length} animal${animals.length===1?'':'s'}</div>
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
  const totalInvest=DB.expenses.reduce((s,e)=>s+(+e.amount||0),0);
  const totalIncome=DB.income.reduce((s,e)=>s+(+e.amount||0),0);
  const weighedThisWeek=active.filter(a=>{const ws=weightsFor(a.id);return ws.length&&daysBetween(ws[ws.length-1].date,todayISO())<7;}).length;
  const results=DB.entries.filter(e=>e.result&&e.result.placing);
  const wrap=el('div');
  wrap.innerHTML=`${pageHeader('Reports')}
    <div class="grid g2">
      <div class="stat"><div class="k">Weekly weigh-in</div><div class="v tnum">${weighedThisWeek}<small>/${active.length}</small></div><div class="sub">completed this week</div></div>
      <div class="stat"><div class="k">Avg herd ADG</div><div class="v tnum">${adgRows.length?round(adgRows.reduce((s,r)=>s+r.st.adgLife,0)/adgRows.length,2):'—'}</div><div class="sub">lb/day</div></div>
      <div class="stat"><div class="k">Total invested</div><div class="v tnum" style="font-size:20px">${money(totalInvest)}</div></div>
      <div class="stat"><div class="k">Net result</div><div class="v tnum" style="font-size:20px;color:${totalIncome-totalInvest>=0?'var(--good)':'var(--ink)'}">${money(totalIncome-totalInvest)}</div></div>
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
  const exp=DB.expenses.filter(e=>e.animalId===id).reduce((s,e)=>s+(+e.amount||0),0); const inc=DB.income.filter(e=>e.animalId===id).reduce((s,e)=>s+(+e.amount||0),0);
  const w=window.open('','_blank');
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(a.name)} — Season Summary</title>
    <style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:800px;margin:20px auto;padding:0 20px;line-height:1.5}
    h1{color:#4C1D95}h2{color:#0D9488;border-bottom:2px solid #eee;padding-bottom:4px;margin-top:26px;font-size:16px}
    .head{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #4C1D95;padding-bottom:10px}
    table{width:100%;border-collapse:collapse;font-size:13px}td,th{padding:6px 8px;border-bottom:1px solid #eee;text-align:left}
    .grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin:10px 0}.box{background:#f5f5f7;border-radius:10px;padding:10px}.box b{display:block;font-size:20px;color:#4C1D95}
    .muted{color:#777;font-size:12px}@media print{.noprint{display:none}}</style></head>
    <body><div class="head"><h1>${esc(a.name)}${a.barnName?' “'+esc(a.barnName)+'”':''}</h1><div style="text-align:right"><b>Devitt Family Show Team</b><div class="muted">Season ${esc(a.season||'')} · ${fmtDate(todayISO())}</div></div></div>
    <p class="muted">${esc(speciesName(a.species))} · ${esc(a.breed)} · ${esc(a.sex||'')}${a.earTag?' · Tag '+esc(a.earTag):''} · Breeder ${esc(a.breeder||'—')}</p>
    <div class="grid"><div class="box"><span class="muted">Start weight</span><b>${st.startW??'—'}</b></div><div class="box"><span class="muted">Final weight</span><b>${st.curW??'—'}</b></div><div class="box"><span class="muted">Total gain</span><b>${st.gainTotal??'—'}</b></div><div class="box"><span class="muted">Lifetime ADG</span><b>${st.adgLife??'—'}</b></div></div>
    <h2>Weight history</h2><table><tr><th>Date</th><th>Weight</th><th>Gain</th><th>ADG</th><th>Notes</th></tr>${ws.map((x,i)=>{const p=ws[i-1];const g=p?round(x.weight-p.weight,1):null;const d=p?daysBetween(p.date,x.date):null;return `<tr><td>${fmtDate(x.date)}</td><td>${x.weight} lb</td><td>${g!=null?(g>0?'+':'')+g:'—'}</td><td>${g!=null&&d>0?round(g/d,2):'—'}</td><td>${esc(x.notes||'')}</td></tr>`;}).join('')}</table>
    <h2>Feed programs</h2>${progs.slice().reverse().map(f=>{const fs=feedProgramStats(f);return `<div style="margin-bottom:12px"><b>${esc(f.name)}</b> <span class="muted">(${esc(f.objective||'')} · ${fmtShort(f.startDate)}–${f.endDate?fmtShort(f.endDate):'now'} · ${fs.days}d · ADG ${fs.adg??'—'})</span><table>${(f.meals||[]).map(m=>`<tr><td style="width:90px"><b>${esc(m.time)}</b></td><td>${(m.items||[]).map(it=>esc(it.product)+' '+it.amount+' '+esc(it.unit)).join(', ')}</td></tr>`).join('')}</table></div>`;}).join('')||'<p class="muted">None</p>'}
    <h2>Shows & results</h2>${ent.length?`<table><tr><th>Show</th><th>Division</th><th>Placing</th><th>Notes</th></tr>${ent.map(e=>{const sh=DB.shows.find(s=>s.id===e.showId);const r=e.result||{};return `<tr><td>${esc(sh?sh.name:'')}</td><td>${esc(e.division||'')}</td><td>${esc(r.placing||'—')}${r.divisionPlacing?' · '+esc(r.divisionPlacing):''}</td><td>${esc(r.bannerNote||r.judgeComments||'')}</td></tr>`;}).join('')}</table>`:'<p class="muted">No shows</p>'}
    <h2>Financials</h2><div class="grid"><div class="box"><span class="muted">Invested</span><b>${money(exp)}</b></div><div class="box"><span class="muted">Income</span><b>${money(inc)}</b></div><div class="box"><span class="muted">Net</span><b>${money(inc-exp)}</b></div><div class="box"><span class="muted">Cost/lb gain</span><b>${st.gainTotal>0?money(exp/st.gainTotal):'—'}</b></div></div>
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
      ${moreRow('reports',ICON.reports,'Reports & analytics')}
      ${moreRow('archive',ICON.archive,'Archive')}
      ${moreRow('shows',ICON.shows,'Shows')}
      ${moreRow('layovers',ICON.layover,'Layover care')}
      ${moreRow('helpers',ICON.team,'Helpers')}
      ${moreRow('__breeds',ICON.dna,'Species & breeds')}
      ${moreRow('__inventory',ICON.boxes,'Feed inventory')}
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
    <div style="margin-top:18px"><button class="btn block" id="logout">${ICON.logout} Sign out</button></div>
    <p style="text-align:center;font-size:11px;color:var(--muted);margin-top:16px">Devitt Family Show Team${Cloud.enabled?' · Cloud sync on':' · Local-first build'}<br>${Cloud.enabled&&Cloud.teamId?'Shared & synced across your team':'Data stored on this device'}</p>`;
  v.append(wrap);
  $$('[data-more]',wrap).forEach(b=>b.onclick=()=>{ const k=b.dataset.more;
    if(k==='__breeds')openBreeds(); else if(k==='__notif')openNotif(); else if(k==='__settings')openTeamSettings();
    else if(k==='__inventory')openInventory(); else if(k==='__backup')exportBackup();
    else if(k==='__import')importBackup(); else if(k==='__demo')toggleDemo(); else if(k==='__cloud')openCloudConnect(); else go('/'+k); });
  $('#logout',wrap).onclick=async()=>{ if(Cloud.enabled){ await Cloud.signOut(); } DB.currentUserId=null; save(true); render(); };
});
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
  const draw=()=>{ body.innerHTML=DB.species.map(sp=>`<div class="section-title" style="margin-top:8px">${esc(sp.name)} <button class="more" data-addbr="${sp.id}">+ Add</button></div>
    <div class="list">${breedsFor(sp.id).map(b=>`<div class="li"><div class="main"><div class="t1" style="font-size:14px">${esc(b.name)}${b.system?'':' <span class="pill t" style="font-size:9px">custom</span>'}</div></div>${b.system?'':`<button class="iconbtn" style="background:var(--line-2);color:var(--bad)" data-delbr="${b.id}">${ICON.x}</button>`}</div>`).join('')}</div>`).join('')+
    `<button class="btn block" id="addSp" style="margin-top:14px">${ICON.plus} Add species</button>`;
    $$('[data-addbr]',body).forEach(btn=>btn.onclick=()=>{ const nm=prompt('New breed name'); if(nm){DB.breeds.push({id:uid('br'),speciesId:btn.dataset.addbr,name:nm,system:false,active:true,order:999});save();draw();} });
    $$('[data-delbr]',body).forEach(btn=>btn.onclick=()=>{ DB.breeds=DB.breeds.filter(b=>b.id!==btn.dataset.delbr);save();draw(); });
    $('#addSp',body).onclick=()=>{ const nm=prompt('New species name (e.g. Rabbits)'); if(nm){const id=nm.toLowerCase().replace(/\s+/g,'');DB.species.push({id,name:nm,active:true,idFields:['earTag','tattoo']});DB.breeds.push({id:uid('br'),speciesId:id,name:'Crossbred',system:false,active:true,order:0},{id:uid('br'),speciesId:id,name:'Other',system:false,active:true,order:1});save();draw();} };
  };
  draw(); openSheet({title:'Species & breeds',body});
}
function openNotif(){ const body=el('div'); const p=DB.notifPrefs;
  const items=[['weightDue','Weekly weight due'],['missingPhoto','Missing progress photo'],['upcomingShow','Upcoming show & deadline'],['health','Health follow-up & withdrawal'],['advisor','Advisor comments'],['mentions','Mentions & tasks']];
  body.innerHTML=`<p style="font-size:13px;color:var(--muted);margin-bottom:12px">Choose what you're notified about. Delivery: in-app now; email & push in the cloud build.</p>`+
    items.map(([k,l])=>`<label class="li" style="border:1px solid var(--line);border-radius:12px;margin-bottom:8px"><div class="main"><div class="t1" style="font-size:14px">${l}</div></div><input type="checkbox" data-n="${k}" ${p[k]?'checked':''} style="width:22px;height:22px"></label>`).join('');
  $$('[data-n]',body).forEach(c=>c.onchange=()=>{p[c.dataset.n]=c.checked;save();}); openSheet({title:'Notifications',body});
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

route('media',()=>{ // global recent media → route to first animal gallery fallback
  const v=setView('','dashboard'); const all=DB.media.slice().sort((a,b)=>a.createdAt<b.createdAt?1:-1);
  const wrap=el('div'); wrap.innerHTML=pageHeader('Progress media','/dashboard');
  if(!all.length)wrap.append(htmlToFrag(emptyState(ICON.media,'No media yet','Upload photos and videos from any animal profile.')));
  else { const g=el('div','gallery'); all.forEach(m=>g.append(mediaCell(m,getAnimal(m.animalId)||{}))); wrap.append(g); }
  v.append(wrap);
});

/* ===================================================================
   START
   =================================================================== */
boot();
















