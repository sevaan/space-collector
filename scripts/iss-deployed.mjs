// ISS deployables share the station’s 1998 COSPAR prefix. A nearby catalogue number
// records when something was catalogued, not when it launched. Use only reviewed
// launch dates; leave new, unidentified deployables undated until a source is found.
export function fixIssDeployed(objects, corrections = {}) {
  let n = 0;
  for (const o of objects) {
    if (!/^1998-067/.test(o.cospar ?? '') || Number(o.id) === 25544) continue;
    const entry = corrections[String(o.id)];
    const launch = entry?.cospar === o.cospar ? entry.fields?.launch : null;
    o.issDeploy = 1;
    if (launch) { o.launch = launch; o.year = Number(launch.slice(0, 4)); }
    else { delete o.launch; delete o.year; }
    n++;
  }
  return n;
}
