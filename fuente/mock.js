// minimal in-memory mock of claude db/user for local testing
(function(){
  const store={};const subs=[];
  const now=Date.now(),D=864e5;
  const seed=(path,data)=>{store[path]=JSON.parse(JSON.stringify(data))};
  const UID='u_me';
  const sim=(t,f)=>({title:'Simulacro completo',kind:'simulacro',div:'H-Open',total:0,splits:[],at:t});
  function mkSim(at,base){const st=['ski','sled','pull','bbj','row','farmers','lunges','wallball'];const sp=[];let tot=0;
    const v={ski:290,sled:200,pull:300,bbj:320,row:300,farmers:120,lunges:270,wallball:420};
    st.forEach(k=>{const r=base+Math.round(Math.random()*20);sp.push({label:'Carrera',t:r});sp.push({label:k,t:v[k]+Math.round(Math.random()*30-10)});tot+=r+v[k]});
    return {title:'Simulacro completo',kind:'simulacro',div:'H-Open',total:tot,splits:sp,at}}
  seed(`data/users/${UID}/sessions/a1`,mkSim(now-20*D,290));
  seed(`data/users/${UID}/sessions/a2`,mkSim(now-3*D,280));
  for(let i=0;i<9;i++)seed(`data/users/${UID}/sessions/i${i}`,{title:'Intervalos 40 min',kind:'intervalos',div:'H-Open',total:1500+i*10,splits:[{label:'R1',t:500},{label:'R2',t:500},{label:'R3',t:500+i*10}],at:now-i*2*D});
  seed('activity/u_a',{div:'H-Open',last:now-1*D,list:[{at:now-1*D,title:'Intervalos 40 min',kind:'intervalos',total:1500},{at:now-3*D,title:'Base Hyrox · S1 D1',kind:'programa',total:3000}]});
  seed('activity/u_b',{div:'M-Open',last:now-7*D,list:[{at:now-7*D,title:'Simulacro completo',kind:'simulacro',total:5200}]});
  seed('activity/u_c',{div:'H-Pro',last:now-16*D,list:[{at:now-16*D,title:'Fuerza completo 40 min',kind:'fuerza',total:2400}]});
  seed('wods/reto',{id:'r1',title:'Mejor 1000 m de remo',desc:'Remo 1000 m a máxima intensidad, damper 6.',unit:'time',end:new Date(now+10*D).toISOString().slice(0,10),at:now});
  seed('board/u_a',{retos:{r1:{v:212,div:'H-Open',at:now-D}}});seed('board/u_b',{retos:{r1:{v:241,div:'M-Open',at:now-2*D}}});
  const snapDoc=(path)=>({id:path.split('/').pop(),exists:path in store,data:()=>store[path]?JSON.parse(JSON.stringify(store[path])):undefined,metadata:{}});
  const children=(col)=>Object.keys(store).filter(k=>k.startsWith(col+'/')&&k.slice(col.length+1).indexOf('/')<0).sort();
  function notify(){subs.forEach(s=>s())}
  const docRef=path=>({id:path.split('/').pop(),path,get:async()=>snapDoc(path),set:async d=>{store[path]=JSON.parse(JSON.stringify(d));notify()},update:async d=>{Object.assign(store[path],d);notify()},delete:async()=>{delete store[path];notify()},
    onSnapshot(n){const f=()=>n(snapDoc(path));subs.push(f);setTimeout(f,10);return()=>{}},collection:c=>colRef(path+'/'+c)});
  const colRef=(col,ord)=>({path:col,doc:id=>docRef(col+'/'+(id||Math.random().toString(36).slice(2))),add:async d=>{const r=docRef(col+'/'+Math.random().toString(36).slice(2));await r.set(d);return r},
    orderBy:(f,dir)=>colRef(col,[f,dir]),limit:()=>colRef(col,ord),where:()=>colRef(col,ord),
    get:async()=>q(col,ord),onSnapshot(n){const f=()=>n(q(col,ord));subs.push(f);setTimeout(f,10);return()=>{}}});
  function q(col,ord){let docs=children(col).map(snapDoc);if(ord)docs.sort((a,b)=>(a.data()[ord[0]]-b.data()[ord[0]])*(ord[1]==='desc'?-1:1));return {docs,size:docs.length,empty:!docs.length,docChanges:()=>[],metadata:{}}}
  const db={doc:docRef,collection:c=>colRef(c)};
  const user={isOwner:async()=>true,canEdit:async()=>true,can:async()=>true,id:async()=>UID,me:async()=>({}),profiles:async ids=>Object.fromEntries(ids.map(i=>[i,{name:{u_a:'Carlos Méndez',u_b:'Ana Ruiz',u_c:'Luis Pérez',u_me:'Armando'}[i]||'Atleta'}]))};
  window.claude={use:async n=>n==='db'?db:n==='user'?user:null};
})();
