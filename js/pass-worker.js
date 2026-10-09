// Keep the existing orbital search off the rendering thread.
import { nextVisiblePass, setBinocularMode, setSkyLimit } from './orbit.js?v=0.1.356';
let objects = [];
self.onmessage = ({ data }) => {
  if (data.objects) objects = data.objects;
  try {
    setBinocularMode(data.binoculars);
    setSkyLimit(data.limit);
    const candidates = data.objectId ? objects.filter(o => o.id === data.objectId) : objects;
    const pass = nextVisiblePass(candidates, new Date(data.dateMs), data.observer, 48);
    self.postMessage({ requestId: data.requestId, pass: pass ? { dateMs: pass.date.getTime(), objectId: pass.obj.id, look: pass.look } : null });
  } catch (error) { self.postMessage({ requestId: data.requestId, error: error.message }); }
};
