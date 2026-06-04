const { createRequire } = require('module');
const requireFromFrontend = createRequire('/Users/blxall/estate3d/frontend/package.json');
const { chromium } = requireFromFrontend('playwright');
const fs = require('fs');
const path = require('path');

const outDir = '/Users/blxall/.hermes/media_cache/estate3d-v42-runtime-quality';
const baseUrl = process.env.ESTATE3D_FRONTEND_URL || 'http://127.0.0.1:15175';
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
    const leaks = [
      'Share handoff',
      'viewerState',
      'R3F-ready',
      'Camera position',
      'Camera frame:',
      'Unit footprint:',
      'Room footprint:',
      'Viewpoint anchor:',
      'Window hotspot:',
      '/developments/demo-premium/viewer?',
      '/demo/source/estate3d-skyline-massing.glb',
    ].filter((needle) => visibleText.includes(needle));
    const scene = document.querySelector('.viewer-scene');
    const sceneRect = scene?.getBoundingClientRect();
    const runtime = document.querySelector('.showroom-runtime-slot');
    const runtimeRect = runtime?.getBoundingClientRect();
    const asset = document.querySelector('.showroom-asset-card');
    const assetRect = asset?.getBoundingClientRect();
    const quality = document.querySelector('.runtime-quality-card');
    const qualityRect = quality?.getBoundingClientRect();
    const runtimeInsideScene = Boolean(runtimeRect && sceneRect && runtimeRect.left >= sceneRect.left && runtimeRect.right <= sceneRect.right && runtimeRect.top >= sceneRect.top && runtimeRect.bottom <= sceneRect.bottom);
    const qualityInsideScene = Boolean(qualityRect && sceneRect && qualityRect.left >= sceneRect.left && qualityRect.right <= sceneRect.right && qualityRect.top >= sceneRect.top && qualityRect.bottom <= sceneRect.bottom);
    const runtimeOverlapsAsset = Boolean(runtimeRect && assetRect && !(runtimeRect.right < assetRect.left || runtimeRect.left > assetRect.right || runtimeRect.bottom < assetRect.top || runtimeRect.top > assetRect.bottom));
    const qualityOverlapsAsset = Boolean(qualityRect && assetRect && !(qualityRect.right < assetRect.left || qualityRect.left > assetRect.right || qualityRect.bottom < assetRect.top || qualityRect.top > assetRect.bottom));
    const qualityOverlapsRuntime = Boolean(qualityRect && runtimeRect && !(qualityRect.right < runtimeRect.left || qualityRect.left > runtimeRect.right || qualityRect.bottom < runtimeRect.top || qualityRect.top > runtimeRect.bottom));
    return {
      leaks,
      runtimeInsideScene,
      qualityInsideScene,
      runtimeOverlapsAsset,
      qualityOverlapsAsset,
      qualityOverlapsRuntime,
      runtimeLabel: document.querySelector('.showroom-runtime-title')?.textContent,
      runtimeStatus: document.querySelector('.showroom-runtime-status')?.textContent,
      qualityLabel: document.querySelector('.runtime-quality-label')?.textContent,
      qualityBadge: document.querySelector('.runtime-quality-badge')?.textContent,
      runtimeAssetUrl: document.querySelector('.source-backed-gltf-stage')?.getAttribute('data-asset-url'),
      canvasCount: document.querySelectorAll('canvas').length,
      facadeBays: document.querySelectorAll('.facade-bay').length,
      foregroundPlanes: document.querySelectorAll('.architectural-foreground-plane').length,
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
    await page.goto(`${baseUrl}/developments/demo-premium/viewer`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.showroom-runtime-slot.source-backed-runtime-ready');
    await page.waitForSelector('.runtime-quality-card.demo-fixture-runtime.production-asset-needed');
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
  const failing = results.filter((entry) => {
    const audit = entry.audit;
    return audit.leaks.length || !audit.runtimeInsideScene || !audit.qualityInsideScene || audit.runtimeOverlapsAsset || audit.qualityOverlapsAsset || audit.qualityOverlapsRuntime || audit.horizontalOverflow || audit.facadeBays !== 16 || audit.foregroundPlanes !== 4 || audit.runtimeAssetUrl !== '/demo/source/estate3d-skyline-massing.glb' || audit.runtimeLabel !== 'Интерактивная модель комплекса подключена к сцене' || audit.qualityLabel !== 'Качество модели: демо-GLB подключен к runtime' || audit.qualityBadge !== 'Demo GLB · production asset next';
  });
  const summary = { outDir, baseUrl, errors, results, failing };
  fs.writeFileSync(path.join(outDir, 'audit.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  if (errors.length || failing.length) process.exit(1);
})();
