// Lists star facts whose distance in light-years differs from the DISTANCE on the card (2026-10-20, Sevaan). The ones
// left are about other things: a past or future close approach, a neighbour star, the galactic centre.
globalThis.fetch=async(u)=>{const t=(await import('node:fs')).readFileSync(String(u).replace(/\?.*/,''),'utf8');return {ok:true,json:async()=>JSON.parse(t)}};
process.chdir(decodeURIComponent(new URL('..', import.meta.url).pathname));
const V=JSON.parse((await import('node:fs')).readFileSync('version.json','utf8')).version; const m=await import('../js/constellations.js?v='+V); await m.loadConstellations();
const n=await import('../js/natural.js?v='+V);
const num=(s)=>Number(String(s).replace(/[~,]/g,''));
const out=[];
for (const o of n.NATURAL) {
  const st=o.stats?.find(s=>/DISTANCE/.test(s[0])); const shown = st ? st[1] : o.far && /LIGHT-YEARS/.test(o.far[1]) ? o.far[0] : null;
  if (!shown || !o.fact) continue;
  const re=/(?:about |some |nearly |almost |over |more than |roughly |just over |just under )?~?([\d,.]+)(?:\s*(million|thousand))?\s+light-years?/gi; let mm;
  while ((mm=re.exec(o.fact))) { let v=num(mm[1]); if (mm[2]==='million') v*=1e6; if (mm[2]==='thousand') v*=1e3; const c=num(shown); if (!c) continue; const r=v/c; if (Math.round(v)!==Math.round(c)) out.push({name:o.name, hip:o.hip, key:o.key, shown, fact:o.fact.slice(Math.max(0,mm.index-70), mm.index+mm[0].length+25)}); }
}
console.log(out.length); for (const x of out) console.log(JSON.stringify(x));
