// 12- or 24-hour times (Settings → Display → Clock, 2026-10-21, Sevaan). Every time in the app is written with
// toLocaleTimeString / toLocaleString and an hour option, so this sets hour12 on those calls when the player has picked
// one; 'auto' (or nothing saved) leaves the phone's own choice. Loaded first on both pages; read on every call, so a
// change shows everywhere without a reload.
const pick = () => { try { const v = localStorage.getItem('clock'); return v === '12' ? true : v === '24' ? false : null; } catch { return null; } };
const withClock = (o) => { const h = pick(); return h == null || !o || !('hour' in o) || 'hour12' in o ? o : { ...o, hour12: h }; };
const P = Date.prototype, time = P.toLocaleTimeString, both = P.toLocaleString;
P.toLocaleTimeString = function (l, o) { return time.call(this, l, withClock(o)); };
P.toLocaleString = function (l, o) { return both.call(this, l, withClock(o)); };
