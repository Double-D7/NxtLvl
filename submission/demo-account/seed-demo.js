/* ============================================================================
   Show Team — Demo account seeder
   ----------------------------------------------------------------------------
   Paste this whole file into the browser DevTools Console at https://showteam.app
   BEFORE you log in as the demo account. It loads a rich, realistic show-herd
   into this browser. When you then log in as demo@showteam.app for the first
   time, the app turns this data into the demo team's cloud document — so any
   device (including an app reviewer's) that logs in as demo sees a full,
   alive-looking app.

   Dates are computed relative to the day you run this, and the demo show is set
   ~18 days out, so the demo still looks current through a normal review window.
   Re-run + re-seed later if you want to refresh the dates.
   ============================================================================ */
(function seedDemo(){
  const iso = d => d.toISOString().slice(0,10);
  const today = new Date();
  const plus = n => { const d = new Date(today); d.setDate(d.getDate()+n); return iso(d); };
  const W = (animalId, pairs) => pairs.map(([d,w],i)=>({id:animalId+'w'+i, animalId, weight:w, date:plus(d)}));

  const db = {
    version:2, setupComplete:true, seeded:true,
    team:{name:'Devitt Show Team', subtitle:'Show Livestock', colors:{purple:'#4C1D95',teal:'#0D9488'}, weighDay:2},
    // The Owner carries the demo login email, so signing in as demo@showteam.app
    // adopts this identity (owner of the team) instead of creating a stranger.
    users:[{id:'u1',name:'David Devitt',role:'Owner',email:'demo@showteam.app'},
           {id:'u2',name:'Blake Goss',role:'Advisor'},
           {id:'u3',name:'Kade Devitt',role:'Editor'}],
    currentUserId:'u1',
    species:[{id:'swine',name:'Swine',emoji:'🐷',idField:'earNotch',active:true}],
    breeds:[],
    helpers:[{id:'h1',name:'Blake Goss',note:'Swine feeding'}],
    animals:[
      {id:'a1',name:'Batman',species:'swine',breed:'Cross',sex:'Barrow',status:'Active',earTag:'42',earNotch:'3-4',penLocation:'Barn A',helperIds:['h1'],advisorId:'u2',startWeight:58,startWeightDate:plus(-96),acquiredDate:plus(-96),targetWeight:290,targetDate:plus(18),
        project:{goals:'Win market barrow class at county',hours:64,journal:'On full feed, walking daily.',skills:'clipping, bracing',reflection:'Start shaping sooner next year.'}},
      {id:'a2',name:'Brutus',species:'swine',breed:'Duroc',sex:'Barrow',status:'Active',earTag:'7',earNotch:'1-2',penLocation:'Barn A',helperIds:['h1'],startWeight:60,startWeightDate:plus(-96),acquiredDate:plus(-96),targetWeight:280,targetDate:plus(18)},
      {id:'a3',name:'Biscuit',species:'swine',breed:'York',sex:'Gilt',status:'Active',earTag:'15',earNotch:'5-6',penLocation:'Barn B',helperIds:['h1'],startWeight:55,startWeightDate:plus(-96),acquiredDate:plus(-96),targetWeight:265,targetDate:plus(18)},
      {id:'a4',name:'Bandit',species:'swine',breed:'Cross',sex:'Barrow',status:'Active',earTag:'23',earNotch:'2-5',penLocation:'Barn B',helperIds:['h1'],startWeight:62,startWeightDate:plus(-96),acquiredDate:plus(-96),targetWeight:285,targetDate:plus(18)},
      {id:'a5',name:'Hamster',species:'swine',breed:'Hamp',sex:'Gilt',status:'Active',earTag:'9',earNotch:'4-4',penLocation:'Barn B',startWeight:57,startWeightDate:plus(-96),acquiredDate:plus(-96)},
    ],
    weights:[
      ...W('a1',[[-96,58],[-60,150],[-30,215],[-14,252],[-7,266],[-1,281]]),
      ...W('a2',[[-96,60],[-60,148],[-30,210],[-14,246],[-7,258],[-1,268]]),
      ...W('a3',[[-96,55],[-60,138],[-30,196],[-14,228],[-7,240],[-1,250]]),
      ...W('a4',[[-96,62],[-60,132],[-30,188],[-14,214],[-7,224],[-1,232]]),
      ...W('a5',[[-96,57],[-30,180],[-1,238]]),
    ],
    feed:[
      {id:'f1a',animalId:'a1',name:'Grower',startDate:plus(-90),endDate:plus(-31),objective:'Growth',meals:[{time:'AM',items:[{product:'Grow',amount:2,unit:'lb'}]}]},
      {id:'f1',animalId:'a1',name:'Finisher + Shape',startDate:plus(-30),objective:'Add shape',advisorRec:'Bump Game On to 3 oz AM',meals:[
        {time:'AM',items:[{product:'Maxxed Out',amount:0.75,unit:'lb'},{product:'Cruise',amount:0.5,unit:'lb'},{product:'Hold On',amount:1,unit:'lb'},{product:'Game On',amount:4,unit:'oz'},{product:'Colossal',amount:1,unit:'scoop'}]},
        {time:'PM',items:[{product:'Maxxed Out',amount:0.75,unit:'lb'},{product:'Bark',amount:0.5,unit:'lb'},{product:'Tomato Juice',amount:1,unit:'cups'}]}]},
      {id:'f2',animalId:'a2',name:'Finisher',startDate:plus(-30),meals:[{time:'AM',items:[{product:'Maxxed Out',amount:3,unit:'lb'}]},{time:'PM',items:[{product:'Maxxed Out',amount:2,unit:'lb'}]}]},
      {id:'f3',animalId:'a3',name:'Finisher',startDate:plus(-30),meals:[{time:'AM',items:[{product:'Maxxed Out',amount:2.5,unit:'lb'}]}]},
      {id:'f4',animalId:'a4',name:'Push',startDate:plus(-30),meals:[{time:'AM',items:[{product:'Maxxed Out',amount:3,unit:'lb'},{product:'Cruise',amount:0.5,unit:'lb'}]}]},
      {id:'f5',animalId:'a5',name:'Grow',startDate:plus(-30),meals:[{time:'AM',items:[{product:'Grow',amount:2,unit:'lb'}]}]},
    ],
    inventory:[
      {id:'inv1',product:'Maxxed Out',brand:'Sunglo',category:'feed',unit:'lb',onHand:38,reorder:25,bagSize:50},
      {id:'inv2',product:'Cruise',brand:'Sunglo',category:'feed',unit:'lb',onHand:180,reorder:20,bagSize:50},
      {id:'inv3',product:'Grow',brand:'Purina',category:'feed',unit:'lb',onHand:410,reorder:50,bagSize:50},
      {id:'inv4',product:'Hold On',brand:'Sunglo',category:'feed',unit:'lb',onHand:14,reorder:20,bagSize:25},
    ],
    purchases:[
      {id:'l1',productId:'inv1',qty:1,unit:'ton',cost:640,date:plus(-40)},
      {id:'l2',productId:'inv3',qty:500,unit:'lb',cost:150,date:plus(-90)},
    ],
    shows:[{id:'s1',name:'Weld County Fair',type:'County Fair',location:'Greeley, CO',start:plus(18),end:plus(20),entryDeadline:plus(11),weighIn:plus(18),judge:'Dr. J. Malone',org:'Weld County 4-H'}],
    entries:[
      {id:'e1',showId:'s1',animalId:'a1',division:'Market Barrow',cls:'Cross 5',showWeight:281,exhibitor:'Kade Devitt',result:{}},
      {id:'e2',showId:'s1',animalId:'a2',division:'Market Barrow',cls:'Duroc 3',showWeight:268,exhibitor:'Kade Devitt',result:{}},
      {id:'e3',showId:'s1',animalId:'a3',division:'Market Gilt',cls:'York 2',showWeight:250,exhibitor:'Hadlee Devitt',result:{}},
    ],
    tasks:[
      {id:'t1',title:'Rinse, condition & walk pigs',date:plus(-1),recur:'daily',animalIds:['a1','a2','a3','a4']},
      {id:'t2',title:'Brace work',date:plus(0),recur:'daily',animalIds:['a1','a2']},
    ],
    evals:[
      {id:'ev1',animalId:'a1',by:'u2',date:plus(-24),scores:{Muscle:6,Width:5,Shape:5,Finish:5,Freshness:7,'Showmanship':6,Brace:5},note:'Coming along — needs cover.',updatedAt:plus(-24)+'T00:00:00Z'},
      {id:'ev2',animalId:'a1',by:'u2',date:plus(-3),scores:{Muscle:8,Width:7,Shape:7,Finish:6,Freshness:8,'Showmanship':8,Brace:7},note:'Freshest in the barn — hold him here.',updatedAt:plus(-3)+'T00:00:00Z'},
    ],
    recs:[{id:'rec1',animalId:'a1',advisorId:'u2',date:plus(-1),createdAt:plus(-1)+'T00:00:00Z',type:'ration',text:'Add a night feeding — he can carry more cover before the fair.',urgent:true,payload:{},status:'pending'}],
    medLog:[{id:'m1',animalId:'a4',name:'Dewormer',date:plus(-2),withdrawalDays:14,route:'Oral',dose:'per label',by:'u1'}],
    meds:[{id:'med1',name:'Dewormer',withdrawalDays:14,category:'Dewormer'}],
    media:[],measurements:[],exercise:[],health:[],
    notes:[{id:'n1',animalId:'a1',type:'Advisor feedback',date:plus(-6),text:'Freshest pig in the barn — ease the fill the day before show.',by:'u2',pinned:true}],
    expenses:[{id:'x1',animalId:'a1',category:'Purchase',amount:350,date:plus(-96)},{id:'x2',animalId:'a1',category:'Vet',amount:60,date:plus(-30)}],
    income:[],relatives:[],activity:[],savedViews:[],shares:[],layovers:[],care:[],events:[],bedding:[],
    milestones:{},alertAcks:{},fedLog:{},
    notifPrefs:{weightDue:true,quietOn:false,quietStart:'21:00',quietEnd:'06:00'},
    settings:{plan:{tolLb:8,criticalLb:20,aheadPaceLb:8},barnDaylight:false,scoreCats:['Muscle','Width','Shape','Finish','Freshness','Showmanship','Brace']},
  };

  localStorage.setItem('dfst_db_v2', JSON.stringify(db));
  console.log('%c✅ Demo herd loaded into this browser.', 'color:#5eead4;font-size:14px;font-weight:bold');
  console.log('Next: log in as demo@showteam.app. The app will create the demo team from this data and sync it to the cloud.');
})();
