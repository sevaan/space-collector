// Find /* … */ that sit inside template-literal TEXT (they'd show on screen). Tiny lexer: strings, templates, ${} nesting, comments.
import { readFileSync, readdirSync } from 'node:fs';
const dir = process.argv[2];
for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) {
  const s = readFileSync(dir + '/' + f, 'utf8'); const stack = []; let i = 0, line = 1;
  const mode = () => stack[stack.length - 1] ?? 'code';
  while (i < s.length) {
    const c = s[i], m = mode();
    if (c === '\n') line++;
    if (m === 'code' || m === 'expr') {
      if (c === '/' && s[i + 1] === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
      if (c === '/' && s[i + 1] === '*') { const e = s.indexOf('*/', i + 2); line += (s.slice(i, e).match(/\n/g) || []).length; i = e + 2; continue; }
      if (c === '"' || c === "'") { const q = c; i++; while (i < s.length && s[i] !== q) { if (s[i] === '\\') i++; i++; } i++; continue; }
      if (c === '`') { stack.push('tpl'); i++; continue; }
      if (c === '{' && m === 'expr') { stack.push('brace'); i++; continue; }
      if (c === '}' && m === 'expr') { stack.pop(); i++; continue; }
      i++; continue;
    }
    if (m === 'brace') { // inside { } within an expr: treat like code
      if (c === '`') { stack.push('tpl'); i++; continue; }
      if (c === '"' || c === "'") { const q = c; i++; while (i < s.length && s[i] !== q) { if (s[i] === '\\') i++; i++; } i++; continue; }
      if (c === '{') { stack.push('brace'); i++; continue; }
      if (c === '}') { stack.pop(); i++; continue; }
      if (c === '/' && s[i + 1] === '*') { const e = s.indexOf('*/', i + 2); i = e + 2; continue; }
      i++; continue;
    }
    if (m === 'tpl') {
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { stack.pop(); i++; continue; }
      if (c === '$' && s[i + 1] === '{') { stack.push('expr'); i += 2; continue; }
      if (c === '/' && s[i + 1] === '*') console.log(f + ':' + line + '  ' + s.slice(i, i + 80).replace(/\n/g, ' '));
      i++; continue;
    }
  }
}
