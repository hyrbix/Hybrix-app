/* HYBRIX web: guarda todo en este celular (localStorage) cuando la app corre fuera de Claude */
(function(){
  if(window.claude&&window.claude.use)return;
  const KEY='hybrix-web-db';let store={};
  try{store=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){store={}}
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}};
  let UID='';try{UID=localStorage.getItem('hybrix-web-uid')||''}catch(e){}
  if(!UID){UID='u'+Math.random().toString(36).slice(2,10);try{localStorage.setItem('hybrix-web-uid',UID)}catch(e){}}
  let coach=false;try{const q=new URLSearchParams(location.search);if(q.has('coach'))localStorage.setItem('hybrix-web-coach',q.get('coach')==='0'?'0':'1');coach=localStorage.getItem('hybrix-web-coach')==='1'}catch(e){}
  const subs=new Set();const clone=o=>o==null?o:JSON.parse(JSON.stringify(o));
  const snapDoc=p=>({id:p.split('/').pop(),exists:p in store,data:()=>clone(store[p]),metadata:{}});
  const children=c=>Object.keys(store).filter(k=>k.startsWith(c+'/')&&k.slice(c.length+1).indexOf('/')<0).sort();
  const notify=()=>{persist();subs.forEach(f=>{try{f()}catch(e){}})};
  const sub=f=>{subs.add(f);setTimeout(f,0);return()=>subs.delete(f)};
  const docRef=p=>({id:p.split('/').pop(),path:p,get:async()=>snapDoc(p),
    set:async(d,o)=>{store[p]=o&&o.merge&&store[p]?Object.assign(store[p],clone(d)):clone(d);notify()},
    update:async d=>{if(!(p in store))throw new Error('No existe');Object.assign(store[p],clone(d));notify()},
    delete:async()=>{delete store[p];notify()},onSnapshot(n){return sub(()=>n(snapDoc(p)))},collection:c=>colRef(p+'/'+c)});
  const colRef=(c,o)=>({path:c,doc:id=>docRef(c+'/'+(id||Date.now().toString(36)+Math.random().toString(36).slice(2,6))),
    add:async d=>{const r=docRef(c+'/'+Date.now().toString(36)+Math.random().toString(36).slice(2,6));await r.set(d);return r},
    orderBy:(f,dir)=>colRef(c,[f,dir]),limit:()=>colRef(c,o),where:()=>colRef(c,o),
    get:async()=>q(c,o),onSnapshot(n){return sub(()=>n(q(c,o)))}});
  function q(c,o){let docs=children(c).map(snapDoc);if(o)docs.sort((a,b)=>((a.data()[o[0]]||0)-(b.data()[o[0]]||0))*(o[1]==='desc'?-1:1));return {docs,size:docs.length,empty:!docs.length,docChanges:()=>[],metadata:{}}}
  const db={doc:docRef,collection:c=>colRef(c)};
  const user={isOwner:async()=>coach,canEdit:async()=>coach,can:async()=>true,id:async()=>UID,me:async()=>({id:UID,name:''}),profiles:async ids=>Object.fromEntries(ids.map(i=>[i,{name:''}]))};
  window.claude={use:async n=>n==='db'?db:n==='user'?user:null};
})();
