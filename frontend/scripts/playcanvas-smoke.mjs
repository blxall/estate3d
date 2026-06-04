import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const publicSlug = 'playcanvas-smoke';
const sceneUrl = '/playcanvas-smoke.glb';
const routePath = `/tour/${publicSlug}`;
const fallbackRoutePath = `/tour/${publicSlug}?engine=r3f`;
const expectedLoadedStatus = '3D-модель загружена';
const outDir = '/Users/blxall/.hermes/media_cache/estate3d-playcanvas-controls';

function publicTourPayload(baseUrl) {
  return {
    property: {
      id: 'prop_playcanvas_smoke',
      title: 'PlayCanvas smoke GLB',
      property_type: 'apartment',
      status: 'ready',
      public_slug: publicSlug,
      is_public: true,
    },
    tour: {
      id: 'tour_playcanvas_smoke',
      property_id: 'prop_playcanvas_smoke',
      tour_type: 'glb_model',
      scene_url: `${baseUrl}${sceneUrl}`,
      public_url: `/tour/${publicSlug}`,
    },
    viewer_config: {
      tour_type: 'glb_model',
      scene_url: `${baseUrl}${sceneUrl}`,
    },
  };
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const server = await createServer({
    server: {
      host: '127.0.0.1',
      port: 5191,
      strictPort: false,
    },
  });
  await server.listen();
  const address = server.httpServer?.address();
  const port = typeof address === 'object' && address ? address.port : 5191;
  const baseUrl = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--disable-dev-shm-usage'],
  });

  const errors = [];
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`console:${message.text()}`);
    }
  });
  page.on('pageerror', (error) => errors.push(`pageerror:${error.message}`));
  await page.route(`**/api/tour/${publicSlug}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(publicTourPayload(baseUrl)),
    }),
  );

  try {
    await page.goto(`${baseUrl}${routePath}`, { waitUntil: 'networkidle' });
    await page.getByRole('region', { name: /3d viewer/i }).waitFor();
    const selectedEngine = await page.getByRole('region', { name: /3d viewer/i }).getAttribute('data-viewer-engine');
    if (selectedEngine !== 'playcanvas') {
      throw new Error(`expected PlayCanvas default engine, got ${selectedEngine ?? 'missing'}`);
    }
    await page.getByText('GLB scene · PlayCanvas runtime').waitFor();
    await page.getByText('Renderer: PlayCanvas · WebGL/WebGPU-ready · GLB-first').waitFor();
    await page.getByRole('status', { name: /playcanvas interaction controls/i }).waitFor();
    await page.getByText('Вращайте модель перетаскиванием · масштабируйте колесом · откройте на весь экран').waitFor();
    await page.getByText('Интерактивный 3D-просмотр готов для публичного тура').waitFor();
    const fallbackLink = page.getByRole('link', { name: /open fallback renderer/i });
    await fallbackLink.waitFor();
    const fallbackLinkHref = await fallbackLink.getAttribute('href');
    if (fallbackLinkHref !== fallbackRoutePath) {
      throw new Error(`expected fallback link ${fallbackRoutePath}, got ${fallbackLinkHref ?? 'missing'}`);
    }
    await page.getByText(sceneUrl).waitFor();
    const visibleLeakage = await page.evaluate(() => {
      const leaks = ['Renderer:', 'PlayCanvas rollout guardrails', 'accepted warnings:', 'http://127.0.0.1'];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const visibleText = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!parent || parent.closest('.visually-hidden')) continue;
        const style = window.getComputedStyle(parent);
        const rect = parent.getBoundingClientRect();
        if (style.visibility === 'hidden' || style.display === 'none' || rect.width <= 1 || rect.height <= 1) continue;
        visibleText.push(node.textContent ?? '');
      }
      return leaks.filter((leak) => visibleText.some((text) => text.includes(leak)));
    });
    if (visibleLeakage.length > 0) {
      throw new Error(`visible technical leakage: ${visibleLeakage.join(', ')}`);
    }
    await page.getByText(expectedLoadedStatus).waitFor({ timeout: 10_000 });
    await page.screenshot({ path: join(outDir, 'mobile-playcanvas-loaded.jpg'), type: 'jpeg', quality: 78, fullPage: true });

    const canvasCount = await page.locator('[data-testid="playcanvas-glb-canvas"]').count();
    if (canvasCount !== 1) {
      throw new Error(`expected one PlayCanvas canvas, got ${canvasCount}`);
    }

    const canvasBox = await page.locator('[data-testid="playcanvas-glb-canvas"]').boundingBox();
    if (!canvasBox) {
      throw new Error('PlayCanvas canvas bounding box missing');
    }
    await page.mouse.move(canvasBox.x + canvasBox.width * 0.45, canvasBox.y + canvasBox.height * 0.45);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + canvasBox.width * 0.7, canvasBox.y + canvasBox.height * 0.55, { steps: 6 });
    await page.mouse.up();
    await page.getByText('Вращение модели обновлено').waitFor({ timeout: 2_000 });
    await page.mouse.wheel(0, -180);
    await page.getByText('Масштаб модели обновлён').waitFor({ timeout: 2_000 });

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(250);
    await page.screenshot({ path: join(outDir, 'desktop-playcanvas-controls.jpg'), type: 'jpeg', quality: 78, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    await page.screenshot({ path: join(outDir, 'mobile-playcanvas-controls.jpg'), type: 'jpeg', quality: 78, fullPage: true });

    const layout = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="viewer-canvas-root"]');
      const canvas = document.querySelector('[data-testid="playcanvas-glb-canvas"]');
      return {
        bodyScrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.documentElement.clientWidth,
        rootWidth: root?.clientWidth ?? 0,
        rootHeight: root?.clientHeight ?? 0,
        canvasWidth: canvas?.clientWidth ?? 0,
        canvasHeight: canvas?.clientHeight ?? 0,
        fullscreenAvailable: typeof root?.requestFullscreen === 'function',
      };
    });

    if (layout.bodyScrollWidth > layout.bodyClientWidth + 1) {
      throw new Error(`mobile viewport has horizontal overflow: ${JSON.stringify(layout)}`);
    }
    if (layout.rootWidth <= 0 || layout.rootHeight <= 0 || layout.canvasWidth <= 0 || layout.canvasHeight <= 0) {
      throw new Error(`viewer/canvas size invalid after resize: ${JSON.stringify(layout)}`);
    }

    await fallbackLink.click();
    await page.waitForURL(`${baseUrl}${fallbackRoutePath}`);
    await page.getByRole('region', { name: /3d viewer/i }).waitFor();
    const fallbackNavigationUrl = page.url();
    const fallbackEngine = await page.getByRole('region', { name: /3d viewer/i }).getAttribute('data-viewer-engine');
    if (fallbackEngine !== 'r3f') {
      throw new Error(`expected R3F fallback engine, got ${fallbackEngine ?? 'missing'}`);
    }
    await page.getByText('GLB scene · Orbit controls').waitFor();
    await page.getByText('Renderer: Three.js/R3F · explicit fallback · GLB-first').waitFor();

    if (errors.length > 0) {
      throw new Error(`browser runtime errors: ${errors.join(' | ')}`);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          url: `${baseUrl}${routePath}`,
          fallbackUrl: `${baseUrl}${fallbackRoutePath}`,
          fallbackLinkHref,
          fallbackNavigationUrl,
          sceneUrl: `${baseUrl}${sceneUrl}`,
          outDir,
          status: expectedLoadedStatus,
          fallbackEngine,
          layout,
          errors,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
