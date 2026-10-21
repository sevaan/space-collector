// Reviewed historical metadata, never live orbital elements. Guard the COSPAR identity
// so an upstream reassignment cannot silently apply an old correction to another object.
export function applyCatalogCorrections(objects, corrections) {
  let count = 0;
  for (const o of objects) {
    const entry = corrections[String(o.id)];
    if (!entry || entry.cospar !== o.cospar) continue;
    for (const [field, value] of Object.entries(entry.fields)) {
      if (value == null) delete o[field]; else o[field] = value;
    }
    if ('launch' in entry.fields) {
      if (o.launch) o.year = Number(o.launch.slice(0, 4)); else delete o.year;
    }
    count++;
  }
  return count;
}
