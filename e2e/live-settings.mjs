import { chromium } from 'playwright';
const HASH = 'd99b435677c259bc9f5d5476100be9fc5ae0dc72db2abc0393e4ee39257b7639';
const b = await chromium.launch();
for (const [name, viewport] of [['desktop', { width: 1366, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport });
  await ctx.addInitScript((h) => localStorage.setItem('dn-access', h), HASH);
  const p = await ctx.newPage();
  const errs = []; p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await p.goto('https://deeal87.github.io/dennis-nadine/einstellungen', { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);
  const text = (await p.locator('main').innerText()).replace(/\s+/g, ' ');
  console.log(`[${name}] url=${p.url()}`);
  console.log(`[${name}] main starts: ${text.slice(0, 400)}`);
  console.log(`[${name}] has sync section: ${text.includes('Speichern & auf allen')}`);
  console.log(`[${name}] errors: ${JSON.stringify(errs)}`);
  await ctx.close();
}
await b.close();
