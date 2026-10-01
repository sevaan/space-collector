// Rules shared by the sky controls and capture action. No DOM or storage effects.

// A real observation needs the current sky time, a current location fix, and live
// phone pointing. Any manual or visibility override makes the observation practice.
// Callers should pass locationReady=false when their last GPS fix is stale.
export function isPractice({
  timeOffsetMs = 0,
  dragOn = false,
  sensorsLive = false,
  locationReady = false,
  captureAny = false,
  preview = false,
} = {}) {
  return Boolean(timeOffsetMs !== 0 || dragOn || !sensorsLive || !locationReady || captureAny || preview);
}

// Keep the existing twenty-minute, symmetric pass window: moving practice time
// backward must not create duplicates. Practice records never block real captures.
// Existing IndexedDB records use `sim`; `practice` is accepted for new consumers.
// Records predating either flag remain real observations.
export function collectedDuringPass(sightings, objectId, time, practice, passMs = 20 * 60 * 1000) {
  const t = Number(time);
  if (!Number.isFinite(t) || !Number.isFinite(passMs) || passMs <= 0) return false;
  return sightings.some((s) => s.objectId === objectId
    && Boolean(s.sim || s.practice) === Boolean(practice)
    && Number.isFinite(Number(s.time))
    && Math.abs(t - Number(s.time)) < passMs);
}

// The "any object" control can relax visibility only in practice. The selected
// object must still be aligned, even when an override is active.
export function canCapture({ visible = false, aligned = false, practice = false, allowAny = false } = {}) {
  return Boolean(aligned && (visible || (practice && allowAny)));
}

// An observing night runs from local noon to the next local noon, using the longitude where the
// sighting was made (local solar time), so it doesn't depend on the phone's time zone.
export function nightKey(time, lon = 0) {
  return Math.floor((Number(time) + (Number(lon) || 0) / 15 * 3600e3 - 12 * 3600e3) / 86400e3);
}
export function nightsIn(sightings) {
  return new Set(sightings.filter((s) => !s.sim && !s.practice).map((s) => nightKey(s.time, s.lon))).size;
}
// Natural objects (Moon, planets, stars) can be collected once per observing night.
export function collectedTonight(sightings, cardKey, time, lon) {
  const k = nightKey(time, lon);
  return sightings.some((s) => !s.sim && !s.practice && s.cardKey === cardKey && nightKey(s.time, s.lon) === k);
}
