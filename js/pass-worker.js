// Keep the existing orbital search off the rendering thread.
import { nextVisiblePass, setBinocularMode } from './orbit.js?v=0.1.63';
let objects = [];
self.onmessage = ({ data }) => {
  if (data.objects) objects = data.objects;
  try {
    setBinocularMode(data.binoculars);
    const candidates = data.objectId ? objects.filter(o => o.id === data.objectId) : objects;
    const pass = nextVisiblePass(candidates, new Date(data.dateMs), data.observer, 48);
    self.postMessage({ requestId: data.requestId, pass: pass ? { dateMs: pass.date.getTime(), objectId: pass.obj.id, look: pass.look } : null });
  } catch (error) { self.postMessage({ requestId: data.requestId, error: error.message }); }
};
