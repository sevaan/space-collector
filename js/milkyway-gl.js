// The Milky Way from a real photograph (2026-10-08, Sevaan: it has to look accurate). The source is ESO's all-sky
// panorama by Serge Brunier (eso0932a, CC BY 4.0) in galactic coordinates, with the point stars filtered out and the
// sky background removed (assets/sky/milkyway.webp, 4096 × 2048, l = 0 in the middle, increasing to the left).
// For every screen pixel a small WebGL shader works out the direction you're looking, turns it into galactic l, b
// and reads the photo there, so the band's shape, the Great Rift, the star clouds and the Magellanic Clouds land
// exactly where they are in your sky. js/sky.js draws the result into the 2D sky with a screen blend.
// No DOM beyond an offscreen canvas.

const VS = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
const FS = `precision highp float;
uniform sampler2D tex;
uniform vec3 R, U, B;          // camera right / up / back in ENU
uniform vec3 G0, G1, G2;       // galactic x / y / z axes in ENU
uniform vec2 size;             // canvas size in CSS px
uniform float scale, f, cx, cy, alpha, mono;
uniform vec3 tint;
void main() {
  vec2 px = vec2(gl_FragCoord.x, gl_FragCoord.y) / scale;
  float X = (px.x - cx) / f, Y = ((size.y - px.y) - cy) / f;
  vec3 enu = normalize(R * X - U * Y + B);
  vec3 g = vec3(dot(G0, enu), dot(G1, enu), dot(G2, enu));
  float l = atan(g.y, g.x), b = asin(clamp(g.z, -1.0, 1.0));
  vec2 uv = vec2(0.5 - l / 6.28318530718, 0.5 - b / 3.14159265359);
  vec3 c = texture2D(tex, uv).rgb;
  c = mix(c, vec3(dot(c, vec3(0.3, 0.55, 0.15))) * tint, mono);
  float fade = clamp((enu.z + 0.02) / 0.2, 0.0, 1.0);   // melts into the horizon haze
  gl_FragColor = vec4(c * alpha * fade, 1.0);
}`;

export function createMilkyGL(src) {
  const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1) : document.createElement('canvas');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true });
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
  const u = Object.fromEntries(['tex', 'R', 'U', 'B', 'G0', 'G1', 'G2', 'size', 'scale', 'f', 'cx', 'cy', 'alpha', 'mono', 'tint'].map((n) => [n, gl.getUniformLocation(prog, n)]));
  let ready = false;
  const img = new Image();
  // iOS drops WebGL contexts when the app is in the background: mark this renderer lost so js/sky.js builds a fresh
  // one (QA 2026-10-08: the Milky Way could vanish for good after a trip to the background).
  let lost = false;
  canvas.addEventListener?.('webglcontextlost', () => { lost = true; ready = false; });
  img.onload = () => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D); // 4096 × 2048: powers of two, so it can repeat across l = ±180° and use mipmaps
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(u.tex, 0);
    ready = true;
  };
  img.src = src;
  return {
    get ready() { return ready && !gl.isContextLost(); },
    get lost() { return lost || gl.isContextLost(); },
    // view: { basis, gal: [G0, G1, G2], w, h, f, cx, cy, scale, alpha, tint: [r, g, b] 0–1, mono 0–1 }. Returns the canvas.
    render(v) {
      const W = Math.max(1, Math.round(v.w * v.scale)), H = Math.max(1, Math.round(v.h * v.scale));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      gl.viewport(0, 0, W, H);
      gl.uniform3fv(u.R, v.basis.right); gl.uniform3fv(u.U, v.basis.up); gl.uniform3fv(u.B, v.basis.back);
      gl.uniform3fv(u.G0, v.gal[0]); gl.uniform3fv(u.G1, v.gal[1]); gl.uniform3fv(u.G2, v.gal[2]);
      gl.uniform2f(u.size, v.w, v.h); gl.uniform1f(u.scale, v.scale); gl.uniform1f(u.f, v.f); gl.uniform1f(u.cx, v.cx); gl.uniform1f(u.cy, v.cy);
      gl.uniform1f(u.alpha, v.alpha); gl.uniform1f(u.mono, v.mono ?? 0); gl.uniform3fv(u.tint, v.tint ?? [1, 1, 1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return canvas;
    },
  };
}
