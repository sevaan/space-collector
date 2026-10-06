// What you can actually see from here, right now. No DOM.
//
// The faintest star you can see (naked-eye limiting magnitude) depends on how bright the sky is. We add up
// the sky's brightness from light pollution (your "sky" setting), twilight and the Moon, then turn that into
// a limiting magnitude with the usual approximation (Schaefer 1990 / Crumey 2014 style):
//   NELM ≈ 7.93 − 5·log10(10^(4.316 − SB/5) + 1),  SB in magnitudes per square arcsecond.
// Satellites are moving points, which are harder to pick out than a star, so we take half a magnitude
// off. Objects low in the sky are dimmed by the extra air they shine through (extinction).
// All of this is an estimate: good eyes and a clear night can beat it, haze makes it worse.

export const SKIES = {
  city: { label: 'City', sb: 18.0, hint: 'bright city sky, only a few stars' },
  suburbs: { label: 'Suburbs or town', sb: 19.0, hint: 'the main constellations, no Milky Way' },
  rural: { label: 'Countryside', sb: 20.8, hint: 'lots of stars, the Milky Way is faint' },
  dark: { label: 'Dark site', sb: 21.7, hint: 'the Milky Way casts shadows' },
};
export const DEFAULT_SKY = 'suburbs';
// The sky slider (2026-10-06) sets the sky's own brightness continuously, from a lit-up city to a pristine site.
export const SB_MIN = 17.0, SB_MAX = 21.9;
export const sbOfSky = (key) => SKIES[key]?.sb ?? SKIES[DEFAULT_SKY].sb;
// The nearest named sky, for the slider's label.
export function skyNameFor(sb) {
  if (sb < 18.5) return 'City'; if (sb < 19.9) return 'Suburbs'; if (sb < 21.25) return 'Countryside'; return 'Dark site';
}
const NATURAL_SB = 21.9;           // a pristine moonless sky
const MOVING_PENALTY = 0.5;        // a moving point is harder to see than a fixed star
const BINOCULAR_GAIN = 3;          // typical 7×50 or 10×50 binoculars
const EXTINCTION_K = 0.28;         // magnitudes per airmass, average clear sky

const flux = (sb) => 10 ** (-0.4 * sb);
const sbOf = (f) => -2.5 * Math.log10(f);
export const nelmFromSb = (sb) => 7.93 - 5 * Math.log10(10 ** (4.316 - sb / 5) + 1);

// Twilight: the sky fades from about 16.5 mag/arcsec² when the Sun is 6° down to fully dark at 18° down.
function twilightSb(sunEl) {
  if (sunEl <= -18) return null;
  return NATURAL_SB - 0.45 * (18 + Math.max(-18, Math.min(-6, sunEl)));
}
// Moonlight: a high full Moon brightens a dark sky to roughly 19.5 mag/arcsec²; less when it's a
// crescent (brightness falls off faster than the lit fraction) or low.
function moonSb(moonEl, illum) {
  if (!(moonEl > 0) || !(illum > 0.02)) return null;
  const f = illum ** 1.7 * Math.sqrt(Math.sin(moonEl * Math.PI / 180));
  return 19.5 - 2.5 * Math.log10(Math.max(f, 1e-4));
}

// sky: key of SKIES. sunEl, moonEl in degrees; moonIllum 0..1.
// Returns the zenith limiting magnitude for stars and for satellites (naked eye and binoculars), and
// the combined sky brightness.
// sb (mag/arcsec², from the sky slider) wins over a named sky.
export function skyLimit({ sky = DEFAULT_SKY, sb: base = null, sunEl = -90, moonEl = -90, moonIllum = 0 } = {}) {
  let f = flux(base ?? sbOfSky(sky));
  const tw = twilightSb(sunEl); if (tw !== null) f += flux(tw);
  const mo = moonSb(moonEl, moonIllum); if (mo !== null) f += flux(mo);
  const sb = sbOf(f);
  const stars = nelmFromSb(sb);
  const satellites = stars - MOVING_PENALTY;
  return { sb, stars, satellites, binoculars: satellites + BINOCULAR_GAIN };
}

// Extra dimming (magnitudes) for an object at elevation el° compared with straight overhead.
export function extinction(el) {
  const s = Math.sin(Math.max(0.5, el) * Math.PI / 180);
  const airmass = 1 / (s + 0.025 * Math.exp(-11 * s)); // Kasten–Young style, finite at the horizon
  return EXTINCTION_K * (airmass - 1);
}

// Starlink brightness. Since SpaceX darkened the satellites and added visors, working Starlinks at their
// operating height are faint (about magnitude 6.5–7 at 1000 km, Mallama et al. 2023), but new ones still
// climbing from their low drop-off orbit are much brighter and show up as "trains".
export function starlinkStdMag(o, now = Date.now()) {
  const launched = o.launch ? Date.parse(`${o.launch}T00:00:00Z`) : 0;
  const fresh = (launched && now - launched < 60 * 86400e3) || (o.perigee && o.perigee < 420);
  return fresh ? 5.0 : 6.8;
}
