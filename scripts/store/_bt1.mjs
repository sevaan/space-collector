import { webkit } from 'playwright';
import { setup2, SHOT, col } from './_bthelp.mjs';
const b = await webkit.launch();
const { p, errs, cons } = await setup2(b);
console.log(await p.evaluate(() => ({ ap: __h.ap, body: document.body.className, nav: [...document.querySelectorAll('#nav button, nav button')].map(x => x.id).join(','), hdr: !!document.getElementById('night-toggle') })));
await p.screenshot({ path: SHOT + 'base.png' });
console.log('errs', errs, cons);
await b.close();
