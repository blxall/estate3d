const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outDir = '/Users/blxall/.hermes/media_cache/estate3d-v40-asset-readiness';
fs.mkdirSync(outDir, { recursive: true });

async function stateShot(page, name) {
  await page.screenshot({ path: path.join(outDir, `${name}.jpg`), type: 'jpeg', quality: 78, fullPage: true });
}

async function auditPage(page) {
  return await page.evaluate(() => {
    const visibleText = (() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const chunks = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.textContent?.trim();
        if (!text) continue;
        const parent = node.parentElement;
        if (!parent) continue;
        const style = window.getComputedStyle(parent);
        const rect = parent.getBoundingClientRect();
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
        if (rect.width <= 2 || rect.height <= 2 || rect.bottom <= 0 || rect.right <= 0) continue;
        chunks.push(text);
      }
      return chunks.join('\n');
    })();
    const leaks = ['Share handoff', 'viewerState', 'R3F-ready', 'Camera position', 'Camera frame:', 'Unit footprint:', 'Room footprint:', 'Viewpoint anchor:', 'Window hotspot:', '/developments/demo-premium/viewer?'].filter((needle) => visibleText.includes(needle));
    const assetCard = document.querySelector('.showroom-asset-card');
    const scene = document.querySelector('.viewer-scene');
    const depth = document.querySelector('.architectural-depth-layer');
    const cardRect = assetCard?.getBoundingClientRect();
    const customerRect = document.querySelector('.r3f-customer-readout')?.getBoundingClientRect();
    const sceneRect = scene?.getBoundingClientRect();
    const cardInsideScene = Boolean(cardRect && sceneRect && cardRect.left >= sceneRect.left && cardRect.right <= sceneRect.right && cardRect.top >= sceneRect.top && cardRect.bottom <= sceneRect.bottom);
    const assetOverlapsCustomerReadout = Boolean(cardRect && customerRect && !(cardRect.right < customerRect.left || cardRect.left > customerRect.right || cardRect.bottom < customerRect.top || cardRect.top > customerRect.bottom));
    return {
      leaks,
      cardInsideScene,
      assetOverlapsCustomerReadout,
      assetTitle: document.querySelector('.showroom-asset-title')?.textContent,
      assetDetail: document.querySelector('.showroom-asset-detail')?.textContent,
      facadeBays: document.querySelectorAll('.facade-bay').length,
      foregroundPlanes: document.querySelectorAll('.architectural-foreground-plane').length,
      depthInsideScene: Boolean(depth && sceneRect && (() => { const r = depth.getBoundingClientRect(); return r.left >= sceneRect.left && r.right <= sceneRect.right && r.top >= sceneRect.top && r.bottom <= sceneRect.bottom; })()),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const results = [];

  for (const cfg of [
    { name: 'desktop', viewport: { width: 1440, height: 1100 } },
    { name: 'mobile', viewport: { width: 390, height: 1200 }, isMobile: true },
  ]) {
    const page = await browser.newPage({ viewport: cfg.viewport, isMobile: cfg.isMobile });
    page.on('console', (msg) => { if (['error'].includes(msg.type())) errors.push(`${cfg.name}: ${msg.text()}`); });
    page.on('pageerror', (err) => errors.push(`${cfg.name}: ${err.message}`));
    await page.goto('http://127.0.0.1:15173/developments/demo-premium/viewer', { waitUntil: 'networkidle' });
    await page.waitForSelector('.showroom-asset-card');
    await stateShot(page, `${cfg.name}-overview`);
    results.push({ state: `${cfg.name}-overview`, audit: await auditPage(page) });
    await page.getByRole('button', { name: '3D floor mesh: 8 этаж' }).click();
    await page.waitForSelector('.r3f-unit-hitbox');
    await stateShot(page, `${cfg.name}-floor`);
    results.push({ state: `${cfg.name}-floor`, audit: await auditPage(page) });
    await page.getByRole('button', { name: '3D unit mesh: квартира 81' }).click();
    await page.waitForSelector('.floating-plan');
    await stateShot(page, `${cfg.name}-unit`);
    results.push({ state: `${cfg.name}-unit`, audit: await auditPage(page) });
    await page.close();
  }

  await browser.close();
  const failing = results.filter((entry) => entry.audit.leaks.length || !entry.audit.cardInsideScene || entry.audit.assetOverlapsCustomerReadout || entry.audit.horizontalOverflow || entry.audit.facadeBays !== 16 || entry.audit.foregroundPlanes !== 4 || !entry.audit.depthInsideScene);
  const summary = { outDir, errors, results, failing };
  fs.writeFileSync(path.join(outDir, 'audit.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  if (errors.length || failing.length) process.exit(1);
})();
