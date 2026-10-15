// Things released from the ISS (CubeSats, 2026-10-15) carry the station's international designator 1998-067xx, so SATCAT
// gives them its 1998 launch date ("Duplex · launched 1998"). Their real launch is the cargo flight that carried them up,
// which isn't in the catalogue, so estimate it from the closest catalogue numbers: neighbours were catalogued at the same
// time. The date becomes that neighbour's launch; `issDeploy: 1` marks it (cards say "From the ISS").
export function fixIssDeployed(objects) {
  const dated = objects.filter((o) => o.launch && !/^1998-067/.test(o.cospar ?? '')).map((o) => [Number(o.id), o.launch]).sort((a, b) => a[0] - b[0]);
  let n = 0;
  for (const o of objects) {
    if (!/^1998-067/.test(o.cospar ?? '') || Number(o.id) === 25544) continue;
    const id = Number(o.id); let best = null;
    for (const [nid, l] of dated) if (nid < id) best = l; else { if (!best || nid - id < 50) best = best ?? l; break; }
    if (best) { o.launch = best; o.issDeploy = 1; n++; }
  }
  return n;
}
