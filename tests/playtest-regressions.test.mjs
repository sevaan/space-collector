// Exercise actual UI handlers in small DOM/worker doubles; no browser automation here.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const read = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const cards = read('js/cards-page.js'), main = read('js/main.js');
const between = (s, a, b) => s.slice(s.indexOf(a), s.indexOf(b, s.indexOf(a)));

test('earned-card deep links always open Mine after any prior collection tab', () => {
  for (const view of ['owned', 'discover', 'albums', 'patches', 'find']) {
    const card = {key:'moon'}, other={key:'other'};
    const state = {ready:true,view,byKey:new Map([['moon',card]]),sightingsByKey:new Map([['moon',[{}]]]),list:view==='owned'?[card]:[other,card], query:'',set:'all',rarity:'all'};
    let opened;
    const ctx = {state,returnView:null,setView:v=>{state.view=v;state.list=v==='owned'?[card]:[other,card];},resetFilters:()=>{},openViewer:i=>{opened=i;}};
    vm.runInNewContext(between(cards,'function openKey(key) {','// ---------- mission patches'),ctx);
    ctx.openKey('moon'); assert.equal(state.view,'owned',view); assert.equal(opened,0,view);
  }
});

test('a new observing context clears old predictions and rejects a late old-location reply', () => {
  const handlers = [], cache = new Map([[25544,{start:1}]]); let renders=0;
  const ctx = {window:{addEventListener:(_t,fn)=>handlers.push(fn)},location:{origin:'local'},findContext:'toronto',findPasses:cache,findSuggest:[],state:{ready:true,view:'find'},renderFind:()=>renders++,findReminded:new Set()};
  vm.runInNewContext(between(cards,"window.addEventListener('message', (e) => {\n  if (e.origin !== location.origin) return;","let upHold = false;"),ctx);
  handlers[0]({origin:'local',data:{sc:'find-context',context:'sydney'}});
  assert.equal(cache.size,0);assert.equal(renders,1);
  handlers[0]({origin:'local',data:{sc:'find-passes',context:'toronto',passes:{25544:{start:2}}}});
  assert.equal(cache.size,0);
});

test('clearing a city query prevents its pending response from repopulating old results', async () => {
  let input, task, resolveFetch;
  const box={innerHTML:'',querySelectorAll:()=>[]}, q={value:'London',addEventListener:(_t,fn)=>input=fn};
  const ctx={ $:id=>id==='loc-results'?box:q, setTimeout:fn=>{task=fn;return 1;},clearTimeout:()=>{},fetch:()=>new Promise(r=>resolveFetch=r),AbortSignal:{timeout:()=>undefined},escapeHtml:s=>s};
  vm.runInNewContext(between(main,'{ let qt = 0, qn = 0;',"document.querySelectorAll('[data-close]')"),ctx);
  input(); const pending=task(); q.value='';input();
  resolveFetch({json:async()=>({results:[{name:'London',latitude:51.5,longitude:-0.1}]})});
  await pending; assert.equal(box.innerHTML,'');
});

test('Find worker responses preserve their observing context, including errors', () => {
  const replies=[]; const ctx={self:{postMessage:r=>replies.push(r)},setBinocularMode:()=>{},withSatrecs:(l)=>l,frame:()=>{throw Error('test failure');},Date};
  const source=read('js/find-worker.js').replace(/^import .*;\n/gm,'');
  vm.runInNewContext(source,ctx);
  ctx.self.onmessage({data:{requestId:7,context:'toronto',objects:[{id:25544}],startMs:0,days:1}});
  assert.equal(replies[0].context,'toronto'); assert.equal(replies[0].requestId,7);
  assert.equal(replies[0].error,'test failure');
});
