// Our own server (functions/index.js, a Cloud Run function behind Firebase Hosting, 2026-10-26): weather from MET Norway, live planes from
// adsb.lol, fresh satellite data for the phone apps, and the anonymous usage reports. Free for commercial use, which
// Open-Meteo's free plan and the adsb.fi / adsbdb feeds weren't. Empty until it's deployed: the app then keeps its old
// sources. localStorage 'scServer' overrides it (testing, e.g. http://localhost:8787 with `wrangler dev`).
const DEPLOYED = 'https://spacecollector.app/api'; // functions/index.js on Firebase (2026-10-26)
export const SERVER = (() => { try { return localStorage.getItem('scServer') || DEPLOYED; } catch { return DEPLOYED; } })().replace(/\/$/, '');
