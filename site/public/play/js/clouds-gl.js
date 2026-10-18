// Clouds as a real layer in the sky (2026-10-11, Sevaan: the soft ovals "don't look good, need higher fidelity").
// A WebGL shader casts each screen pixel's view ray up to a flat cloud deck overhead and reads warped fractal noise
// there, so clouds shrink and crowd toward the horizon with true perspective, drift with the wind, cover as much
// of the sky as the forecast says, and are lit from the Sun's side: bright edges facing it, grey-blue bellies away.
// Same camera maths as js/milkyway-gl.js. js/sky.js draws the result over the sky with a normal blend.

const VS = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
const FS = `precision highp float;
uniform vec3 R, U, B, sun;     // camera right / up / back, Sun direction (ENU)
uniform vec2 size, wind;
uniform float scale, f, cx, cy, cover, alpha;
uniform vec3 lit, shade, haze;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), u = fract(p); u = u * u * (3.0 - 2.0 * u);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
// fractal noise; octaves finer than a pixel fade out (lod), so the far deck near the horizon doesn't shimmer.
// A dropped octave becomes its average (0.5), so brightness holds as detail goes.
float fbm(vec2 p, float lod) {
  float t = 0.0, a = 0.5, fr = 1.0; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int o = 0; o < 6; o++) { t += a * mix(0.5, noise(p), clamp(1.6 - fr * lod, 0.0, 1.0)); p = m * p; a *= 0.5; fr *= 2.0; }
  return t;
}
float deck(vec2 q, float lod) {
  vec2 w = vec2(fbm(q * 0.5 + 3.1, lod), fbm(q * 0.5 + 7.7, lod));
  return fbm(q + w * 1.4, lod);
}
void main() {
  vec2 px = gl_FragCoord.xy / scale;
  float X = (px.x - cx) / f, Y = ((size.y - px.y) - cy) / f;
  vec3 d = normalize(R * X - U * Y + B);
  if (d.z < 0.015) { gl_FragColor = vec4(0.0); return; }
  float dist = 1.0 / d.z;                       // distance to the deck, in deck heights
  vec2 q = d.xy * dist * 0.8 + wind;
  // How much deck one pixel covers. Toward the horizon it grows with the square of the distance (the deck is seen
  // edge-on), so fine octaves must drop out there or they flicker as the phone moves (2026-10-11, Sevaan).
  float lod = 0.8 * dist / (f * scale) * (1.0 + dist * 0.35) * 2.0;
  float n = deck(q, lod);
  if (dist > 2.5) {
    // the deck is edge-on here, so a pixel spans a long strip of it front to back: average a second sample half a
    // pixel lower to smooth thin streaks that would otherwise blink as the phone moves
    vec3 d2 = normalize(R * X - U * (Y + 0.5 / (f * scale)) + B);
    if (d2.z > 0.01) n = 0.5 * (n + deck(d2.xy / d2.z * 0.8 + wind, lod));
  }
  float th = mix(0.78, 0.30, cover);            // more cover, lower threshold
  float soft = clamp(lod * 2.0, 0.0, 0.25);
  float a = smoothstep(th - soft * 0.5, th + 0.14 + soft, n);
  if (a < 0.003) { gl_FragColor = vec4(0.0); return; }
  // light: compare with the deck a step toward the Sun; thinner toward the Sun = lit edge
  vec2 sd = normalize(sun.xy + 1e-4) * 0.09;
  float n2 = deck(q + sd, lod);
  float light = clamp(0.7 + (n - n2) * 6.0, 0.0, 1.0);
  float thick = smoothstep(th + 0.05, th + 0.45, n);         // dense cores go grey
  vec3 c = mix(lit, shade, clamp((1.0 - light) * 0.9 + thick * 0.55, 0.0, 1.0));
  float sunGlow = pow(max(0.0, dot(d, sun)), 8.0);            // silver lining near the Sun
  c += lit * sunGlow * (1.0 - thick) * 0.5;
  float far = smoothstep(0.05, 0.4, d.z);                    // melt into the horizon haze
  c = mix(haze, c, 0.35 + 0.65 * far);
  a *= alpha * smoothstep(0.02, 0.14, d.z);
  gl_FragColor = vec4(c * a, a);
}`;

export function createCloudGL() {
  const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1) : document.createElement('canvas');
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true });
  if (!gl) return null;
  const sh = (type, code) => { const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  try { gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); } catch { return null; }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(['R', 'U', 'B', 'sun', 'size', 'wind', 'scale', 'f', 'cx', 'cy', 'cover', 'alpha', 'lit', 'shade', 'haze'].map((n) => [n, gl.getUniformLocation(prog, n)]));
  let lost = false;
  canvas.addEventListener?.('webglcontextlost', () => { lost = true; });
  return {
    get lost() { return lost || gl.isContextLost(); },
    // v: { basis, w, h, f, cx, cy, scale, sun: ENU, wind: [x, y], cover 0–1, alpha, lit/shade/haze: [r, g, b] 0–1 }
    render(v) {
      const W = Math.max(1, Math.round(v.w * v.scale)), H = Math.max(1, Math.round(v.h * v.scale));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform3fv(u.R, v.basis.right); gl.uniform3fv(u.U, v.basis.up); gl.uniform3fv(u.B, v.basis.back); gl.uniform3fv(u.sun, v.sun);
      gl.uniform2f(u.size, v.w, v.h); gl.uniform2fv(u.wind, v.wind); gl.uniform1f(u.scale, v.scale); gl.uniform1f(u.f, v.f);
      gl.uniform1f(u.cx, v.cx); gl.uniform1f(u.cy, v.cy); gl.uniform1f(u.cover, v.cover); gl.uniform1f(u.alpha, v.alpha);
      gl.uniform3fv(u.lit, v.lit); gl.uniform3fv(u.shade, v.shade); gl.uniform3fv(u.haze, v.haze);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return canvas;
    },
  };
}
