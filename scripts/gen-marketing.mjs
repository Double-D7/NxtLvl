/* Generates the static, crawlable marketing pages (features/* and for-show-*).
   Run:  node scripts/gen-marketing.mjs
   Output is committed to the repo and served statically by GitHub Pages. */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
:root{color-scheme:dark}
body{background:#08060e;color:#E9EBF1;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:inherit}
.wrap{max-width:920px;margin:0 auto;padding:0 22px}
nav{display:flex;align-items:center;gap:12px;padding:18px 0}
nav img{width:36px;height:36px;border-radius:10px}
nav .brand{font-weight:900;font-size:18px;letter-spacing:-.3px;text-decoration:none;color:#fff}
nav .sp{flex:1}
.btn{display:inline-block;background:linear-gradient(135deg,#8B5CF6,#5B21B6);color:#fff;font-weight:800;font-size:15px;padding:11px 20px;border-radius:12px;text-decoration:none;box-shadow:0 8px 22px -6px rgba(124,58,237,.6)}
.btn.ghost{background:rgba(255,255,255,.06);box-shadow:none;border:1px solid #2A3040}
.btn:hover{filter:brightness(1.07)}
header.hero{padding:40px 0 8px;background:radial-gradient(60vw 34vh at 30% 0%,rgba(124,58,237,.30),transparent 60%),radial-gradient(50vw 34vh at 90% 20%,rgba(13,148,136,.24),transparent 62%)}
.eyebrow{font-size:12px;font-weight:800;letter-spacing:.26em;text-transform:uppercase;color:#c9b8ff}
h1{font-size:clamp(30px,5vw,46px);font-weight:900;letter-spacing:-.02em;line-height:1.05;margin:14px 0 0;max-width:18ch;color:#fff}
p.lead{font-size:clamp(16px,2.2vw,19px);color:#AEB4C2;max-width:60ch;margin:16px 0 0}
section{padding:30px 0;border-top:1px solid #1B2029}
section:first-of-type{border-top:none}
h2{font-size:22px;font-weight:800;margin-bottom:14px;letter-spacing:-.01em}
.feat{display:flex;gap:13px;padding:12px 0;align-items:flex-start}
.feat .d{font-size:20px;flex:none;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:rgba(124,58,237,.16)}
.feat h3{font-size:16px;font-weight:800;margin-bottom:3px}
.feat p{font-size:14px;color:#AEB4C2}
.cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}
.plat{margin-top:12px;font-size:12.5px;font-weight:700;color:#7C8497;letter-spacing:.08em}
.other{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
.other a{background:rgba(255,255,255,.05);border:1px solid #2A3040;border-radius:999px;padding:8px 14px;font-weight:700;color:#E9EBF1;text-decoration:none;font-size:13.5px}
.other a:hover{border-color:#2DD4BF;color:#fff}
footer{border-top:1px solid #2A3040;padding:26px 0;margin-top:20px;color:#7C8497;font-size:13px;display:flex;flex-wrap:wrap;gap:14px;align-items:center}
footer a{color:#AEB4C2;text-decoration:none}footer a:hover{color:#fff}
footer .sp{flex:1}
`;

const FOOT_LINKS = [
  ['features/weights.html','Weights'],['features/feed.html','Feed'],['features/game-plan.html','Game Plan'],
  ['features/show-management.html','Shows'],['features/record-books.html','Record books'],
  ['features/teams.html','Teams'],['features/expenses.html','Expenses'],['privacy.html','Privacy'],
];

// depth: how many ../ to reach site root from the page
function page({slug, depth, title, desc, eyebrow, h1, lead, sections, related}){
  const base = '../'.repeat(depth);
  const canonical = 'https://showteam.app/' + slug;
  const footer = FOOT_LINKS.map(([h,l])=>`<a href="${base}${h}">${l}</a>`).join('\n    ');
  const secHTML = sections.map(s=>`  <section class="wrap">
    <h2>${esc(s.h2)}</h2>
    ${s.items.map(it=>`<div class="feat"><div class="d">${it.icon}</div><div><h3>${esc(it.h3)}</h3><p>${esc(it.p)}</p></div></div>`).join('\n    ')}
  </section>`).join('\n');
  const relHTML = related && related.length ? `  <section class="wrap"><h2>Explore more</h2><div class="other">
    ${related.map(([h,l])=>`<a href="${base}${h}">${l}</a>`).join('\n    ')}
  </div></section>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#3B1B6E">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Show Team">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="https://showteam.app/icon-512.png">
<meta name="twitter:card" content="summary">
<link rel="icon" type="image/png" sizes="32x32" href="${base}favicon-32.png">
<link rel="apple-touch-icon" href="${base}apple-touch-icon.png">
<style>${CSS}</style>
</head>
<body>
  <div class="wrap"><nav>
    <a href="${base}"><img src="${base}icon-192.png" alt="Show Team app icon" width="36" height="36"></a>
    <a class="brand" href="${base}">Show Team</a>
    <span class="sp"></span>
    <a class="btn ghost" href="${base}?app=1">Open app</a>
  </nav></div>
  <header class="hero"><div class="wrap">
    <div class="eyebrow">${esc(eyebrow)}</div>
    <h1>${esc(h1)}</h1>
    <p class="lead">${esc(lead)}</p>
    <div class="cta"><a class="btn" href="${base}?app=1">Get started free</a><a class="btn ghost" href="${base}">All features</a></div>
    <div class="plat">iPhone · Android · Web · Works offline in the barn</div>
  </div></header>
${secHTML}
${relHTML}
  <div class="wrap"><footer>
    <span>© Show Team · Show-livestock management</span>
    <span class="sp"></span>
    ${footer}
  </footer></div>
</body>
</html>
`;
}

const F = (icon,h3,p)=>({icon,h3,p});

const PAGES = [
  { slug:'features/weights.html', depth:1, title:'Weight & ADG tracking for show livestock · Show Team',
    desc:'Log weigh-ins in one tap and get automatic average daily gain, projected show weight, and the gain you still need to hit target — with anomaly checks that keep a bad weigh-in from skewing the numbers.',
    eyebrow:'Weights & ADG', h1:'Know exactly where every animal stands',
    lead:'One-tap weigh-ins turn into the numbers that actually matter — average daily gain, projected show-day weight, and the daily gain you still need to finish on target.',
    sections:[{h2:'What you get', items:[
      F('⚖️','One-tap weigh-ins','A big stepper and rapid-weigh mode let you run the whole barn through weigh day in a handful of taps.'),
      F('📈','Automatic ADG','Period and lifetime average daily gain are computed for you, with a single authoritative, tested calculation source.'),
      F('🎯','Projected show weight','See where an animal is trending for show day and the exact daily gain needed to hit your target.'),
      F('🛡️','Anomaly protection','If a weigh-in looks off, Show Team flags it — and you can confirm it with a written reason so the record stays honest.'),
    ]}],
    related:[['features/game-plan.html','Game Plan'],['features/feed.html','Feed'],['features/record-books.html','Record books']] },

  { slug:'features/feed.html', depth:1, title:'Feed programs & feed-room inventory for show barns · Show Team',
    desc:'Versioned feed programs that never erase history, a feed room that estimates daily use and days of supply, an automatic shopping list, and true cost-per-pound flowed into every animal.',
    eyebrow:'Feed & Feed Room', h1:'Every ration, every change, every cost',
    lead:'Build multi-product AM/PM rations, change feed as often as you like without losing history, and let Show Team turn your bulk buys into cost-per-pound for every animal.',
    sections:[{h2:'What you get', items:[
      F('🌾','Versioned programs','Changing feed never erases the old program — each change is a dated version you can compare and learn from.'),
      F('📦','Feed room inventory','Set what’s on hand and Show Team estimates daily use from active rations, how many bags you have, and how many days each feed will last.'),
      F('🛒','Shopping list','One tap collects every feed projected to run out within your window, with a suggested amount to buy — ready to text.'),
      F('💵','True cost of gain','Log bulk buys once; cost flows into each animal automatically from the rations they eat, driving real cost per pound of gain.'),
    ]}],
    related:[['features/weights.html','Weights'],['features/expenses.html','Expenses'],['features/game-plan.html','Game Plan']] },

  { slug:'features/game-plan.html', depth:1, title:'Game Plan — coach every show animal to target · Show Team',
    desc:'Set a target weight and show date and Show Team coaches every animal to it: required daily gain, projected finish, pace checkpoints, and an on-plan / behind / heavy read at a glance.',
    eyebrow:'Game Plan', h1:'Coach every animal to show day',
    lead:'Set a target weight and a show date, and Show Team becomes a coach — showing required daily gain, projected finish, and whether each animal is on plan, behind, or getting heavy.',
    sections:[{h2:'What you get', items:[
      F('🎯','Target + projection','A progress ring, required daily gain, and a projected show-day weight from real gain data.'),
      F('🧭','On-plan status','Ahead · On plan · Slightly behind · Needs attention — driven by projection vs. target, not by who’s gaining fastest.'),
      F('🗓️','Pace checkpoints','Weekly checkpoints show where each animal should be, so you catch drift early.'),
      F('🧠','Plain-English read','A coach’s read tells you to push gain, ease off, or hold — you make the livestock call, the app gives the data.'),
    ]}],
    related:[['features/weights.html','Weights'],['features/show-management.html','Shows'],['features/teams.html','Teams']] },

  { slug:'features/show-management.html', depth:1, title:'Show mode, packing lists & show-day tools · Show Team',
    desc:'Turn a show into an operations hub: readiness snapshot, reusable packing list with feed-to-pack math, show-day weigh-in targets, class schedule and one-tap results.',
    eyebrow:'Show Mode', h1:'Walk into every show ready',
    lead:'Each show becomes a hub, not a calendar date — with a readiness snapshot, a reusable packing list, and feed-to-pack math that figures exactly how much feed to load.',
    sections:[{h2:'What you get', items:[
      F('✅','Readiness snapshot','See how many entered animals are on weight, need weighed, or have a medication withdrawal conflict before you load up.'),
      F('🧳','Packing list + feed to pack','A reusable checklist that saves per show, with feed-to-pack figured from each animal’s ration × days away + a safety margin.'),
      F('🏁','Show-day mode','Per-animal weigh-in targets, a pack & prep checklist, your class schedule, and one-tap result entry.'),
      F('💊','Withdrawal-safe','Medication withdrawal windows are checked against the shows an animal is entered in, so you stay show-legal.'),
    ]}],
    related:[['features/game-plan.html','Game Plan'],['features/record-books.html','Record books'],['features/weights.html','Weights']] },

  { slug:'features/record-books.html', depth:1, title:'Show record books & 4-H / FFA readiness · Show Team',
    desc:'A compiled career achievement record plus a readiness score that shows exactly what a youth-project record book is still missing before it’s due — printable and save-as-PDF.',
    eyebrow:'Record Books', h1:'Never scramble at record-book time again',
    lead:'Show Team compiles a career achievement record automatically and scores how complete each youth project is, linking straight to whatever is still missing.',
    sections:[{h2:'What you get', items:[
      F('📗','Career record','Class wins, banners and champions, placings, premiums and sale totals, grouped by show — printable or save-as-PDF.'),
      F('📊','Readiness score','A percentage and a missing-items list covering identification, weights, feed, expenses, income, health, photos, results and project reflection.'),
      F('✍️','Youth-project details','Capture goals, project hours, a learning journal, skills learned and a final reflection — all counting toward completeness.'),
      F('🧾','Export-friendly','Structured so common 4-H and FFA financial and journal information transfers with minimal re-entry.'),
    ]}],
    related:[['features/expenses.html','Expenses'],['features/show-management.html','Shows'],['features/teams.html','Teams']] },

  { slug:'features/teams.html', depth:1, title:'Team, coaches & helper collaboration · Show Team',
    desc:'Owners, exhibitors, coaches and helpers with animal-level access, a coach recommend → review → accept flow with a full audit trail, and an auto-generated weekly brief.',
    eyebrow:'Team & Coaches', h1:'Your whole barn, on the same page',
    lead:'Bring family, coaches and helpers into one barn — each with the access they need, a real recommendation workflow, and reports that keep everyone informed.',
    sections:[{h2:'What you get', items:[
      F('👥','Animal-level access','Assign a helper or child to only the animals they’re responsible for — they see just those across the app.'),
      F('🔁','Coach recommendations','A coach recommends a change; the owner accepts, modifies or declines; accepted recs convert into real records — with a full audit trail.'),
      F('📝','Weekly coach brief','One tap generates a weekly rundown per helper — weight, 7-day gain, plan status, ration, notes and upcoming shows.'),
      F('🏷️','QR pen cards','Print a barn card per animal; scanning opens a simplified barn card for feed, tasks and quick logging.'),
    ]}],
    related:[['features/game-plan.html','Game Plan'],['features/weights.html','Weights'],['features/feed.html','Feed']] },

  { slug:'features/expenses.html', depth:1, title:'Show-animal expenses, income & cost of gain · Show Team',
    desc:'Per-animal cost tracking with feed and bedding auto-filled from bulk purchases and rations, true cost of gain, income and net — the numbers a parent actually wants.',
    eyebrow:'Expenses & Income', h1:'Know what the project really costs',
    lead:'Feed and bedding costs fill themselves in from your bulk buys and dated rations, so you only log the extras — and always know cost of gain and net result.',
    sections:[{h2:'What you get', items:[
      F('💵','Auto feed & bedding cost','Buy in bulk once; weighted-average cost per pound flows into each animal from the rations and bedding they use.'),
      F('📉','Cost of gain','See cost per pound of gain per animal and across the herd, even when you change feed constantly.'),
      F('💰','Income & net','Track sale prices, premiums and other income for a true net result per animal.'),
      F('🧮','Season review','An end-of-project “what worked?” review ties cost, gain and results together for next year.'),
    ]}],
    related:[['features/feed.html','Feed'],['features/record-books.html','Record books'],['features/weights.html','Weights']] },
];

const SPECIES = [
  ['for-show-pigs.html','show pigs','🐖','swine','ear-notch IDs, market-barrow finishing, and show-safe medication withdrawal'],
  ['for-show-lambs.html','show lambs','🐑','sheep','scrapie tags, tight finishing windows, and precise weigh-in targets'],
  ['for-show-goats.html','show goats','🐐','goats','scrapie tags, conditioning, and show-day readiness'],
  ['for-show-cattle.html','show cattle','🐄','cattle','registration and brand IDs, long feeding programs, and cost of gain'],
];
for(const [slug,name,emoji,species,blurb] of SPECIES){
  PAGES.push({ slug, depth:0,
    title:`Show Team for ${name} — barn management app`,
    desc:`Manage ${name} with Show Team: ${blurb}, plus weights & ADG, feed programs, game plans, shows, record books and team collaboration. iPhone, Android and web.`,
    eyebrow:`Built for ${name}`, h1:`Run your ${name} barn from one place`,
    lead:`Show Team is built for ${name} families — ${blurb} — alongside everything you need to plan, feed, track and show.`,
    sections:[{h2:`Everything ${name} families need`, items:[
      F(emoji,'Species-specific IDs',`The right identification and workflow for ${name}, so records match how you actually work.`),
      F('⚖️','Weights, ADG & game plans','One-tap weigh-ins, automatic average daily gain, and a coach that keeps every head on plan for show day.'),
      F('🌾','Feed, meds & cost of gain','Versioned feed programs, a feed room with shopping lists, withdrawal-safe medication tracking, and true cost per pound of gain.'),
      F('🏆','Shows, record books & team','Show-day tools, packing lists, record-book readiness, and coaches and helpers on the same page.'),
    ]}],
    related:[['features/weights.html','Weights'],['features/feed.html','Feed'],['features/game-plan.html','Game Plan'],['features/show-management.html','Shows']] });
}

let count=0;
for(const p of PAGES){
  const out = path.join(ROOT, p.slug);
  fs.mkdirSync(path.dirname(out), {recursive:true});
  fs.writeFileSync(out, page(p));
  count++;
}
// robots.txt + sitemap.xml
const urls = ['', ...PAGES.map(p=>p.slug), 'privacy.html'];
const today = process.argv[2] || '2026-08-23';
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u=>`  <url><loc>https://showteam.app/${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT,'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(ROOT,'robots.txt'), `User-agent: *\nAllow: /\nSitemap: https://showteam.app/sitemap.xml\n`);
console.log('generated', count, 'marketing pages + sitemap.xml + robots.txt');
