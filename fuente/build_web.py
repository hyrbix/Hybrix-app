import re,os,json,shutil
from PIL import Image
os.makedirs('hybrix-web',exist_ok=True)
s=open('hybrix-app.html').read()
head='''<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0E1720">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="HYBRIX">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
'''
assert s.startswith('<meta charset="utf-8">\n')
s=s[len('<meta charset="utf-8">\n'):]
s=s.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','')
for l in ['<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n','<meta name="theme-color" content="#0E1720">\n','<meta name="apple-mobile-web-app-capable" content="yes">\n']: s=s.replace(l,'',1)
# split head-ish part (title/links/style) from body markup: style ends then markup begins
i=s.index('</style>')+len('</style>')
local=open('local.js').read()
sw_reg="<script>if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))</script>"
out=head+s[:i]+'\n<script>'+local+'</script>\n</head><body>\n'+s[i:]+'\n'+sw_reg+'\n</body></html>\n'
open('hybrix-web/index.html','w').write(out)
# icons
mk=Image.open('hx-mark.png').convert('RGBA')
for size,name,pad in [(192,'icon-192.png',.16),(512,'icon-512.png',.16),(180,'apple-touch-icon.png',.14),(512,'icon-maskable.png',.24)]:
    bg=Image.new('RGBA',(size,size),(14,23,32,255));m=int(size*(1-2*pad));lg=mk.resize((m,m),Image.LANCZOS)
    bg.alpha_composite(lg,((size-m)//2,(size-m)//2));bg.convert('RGB').save('hybrix-web/'+name)
json.dump({"name":"HYBRIX Training","short_name":"HYBRIX","start_url":"./","scope":"./","display":"standalone","orientation":"any",
 "background_color":"#0E151C","theme_color":"#0E1720","lang":"es",
 "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png"},{"src":"icon-maskable.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]},
 open('hybrix-web/manifest.webmanifest','w'),ensure_ascii=False,indent=1)
open('hybrix-web/sw.js','w').write('''const C='hybrix-v1';const F=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))))});
''')
