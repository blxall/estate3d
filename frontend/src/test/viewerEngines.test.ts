import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildFallbackRendererUrl,
  getViewerEngineConfig,
  playCanvasSmokeFixture,
  resolveViewerEngineFromSearch,
  viewerEngineOptions,
} from '../viewerEngines';

describe('viewer engine adapter boundary', () => {
  it('uses PlayCanvas as the public/uploaded GLB default while preserving the R3F fallback query flag', () => {
    expect(resolveViewerEngineFromSearch('')).toBe('playcanvas');
    expect(resolveViewerEngineFromSearch('?foo=bar')).toBe('playcanvas');
    expect(resolveViewerEngineFromSearch('?engine=playcanvas')).toBe('playcanvas');
    expect(resolveViewerEngineFromSearch('?engine=PLAYCANVAS')).toBe('playcanvas');
    expect(resolveViewerEngineFromSearch('?engine=r3f')).toBe('r3f');
    expect(resolveViewerEngineFromSearch('?engine=unknown')).toBe('playcanvas');
    expect(getViewerEngineConfig('playcanvas')).toMatchObject({
      id: 'playcanvas',
      label: 'PlayCanvas runtime',
      publicTourDefault: true,
      validationStatus: 'production',
    });
    expect(getViewerEngineConfig('r3f')).toMatchObject({
      id: 'r3f',
      label: 'Orbit controls',
      publicTourDefault: false,
      validationStatus: 'production',
    });
  });

  it('builds resilient fallback renderer URLs by replacing malformed engine queries and preserving campaign params', () => {
    expect(buildFallbackRendererUrl('api-slug', '')).toBe('/tour/api-slug?engine=r3f');
    expect(buildFallbackRendererUrl('api slug', '?engine=bad&utm=broker')).toBe('/tour/api%20slug?utm=broker&engine=r3f');
    expect(buildFallbackRendererUrl('api-slug', '?utm=broker&engine=playcanvas&view=mobile')).toBe(
      '/tour/api-slug?utm=broker&view=mobile&engine=r3f',
    );
  });

  it('documents renderer capabilities and validation risks separately from CTA/domain logic', () => {
    expect(viewerEngineOptions).toHaveLength(2);
    expect(getViewerEngineConfig('playcanvas')).toMatchObject({
      id: 'playcanvas',
      label: 'PlayCanvas runtime',
      readout: 'Renderer: PlayCanvas · WebGL/WebGPU-ready · GLB-first',
      publicTourDefault: true,
      validationStatus: 'production',
    });
    expect(getViewerEngineConfig('playcanvas').riskNotes).toContain('large-lazy-chunk');
    expect(getViewerEngineConfig('playcanvas').smokeChecklist).toEqual([
      'real-glb-loads-or-fallback-is-visible',
      'resize-keeps-canvas-usable',
      'fullscreen-targets-viewer-root',
      'mobile-viewport-has-no-horizontal-overflow',
      'console-has-no-runtime-errors',
    ]);
    expect(getViewerEngineConfig('playcanvas').runtimeControls).toEqual({
      label: 'Вращайте модель перетаскиванием · масштабируйте колесом · откройте на весь экран',
      gestures: ['drag-orbit', 'wheel-zoom', 'resize-safe'],
      pointerReadout: 'Интерактивный 3D-просмотр готов для публичного тура',
      controlClass: 'viewer-engine-controls playcanvas-orbit-controls customer-safe-controls',
    });
  });

  it('documents PlayCanvas rollout guardrails for default GLB tours', () => {
    expect(getViewerEngineConfig('playcanvas').rollout).toEqual({
      status: 'default-with-guardrails',
      fallbackQuery: '?engine=r3f',
      fallbackLabel: 'Fallback renderer: add ?engine=r3f if PlayCanvas fails on this device',
      lazyChunkBudgetKbGzip: 500,
      acceptedBuildWarnings: ['playcanvas-lazy-chunk-over-700kb', 'vite-node-worker-threads-externalized-for-gsplat-workers'],
      nextMitigation: 'Investigate PlayCanvas import/bundle splitting before premium ЖК migration',
    });
  });

  it('documents the committed sample GLB used by browser smoke checks', () => {
    expect(playCanvasSmokeFixture).toEqual({
      publicSlug: 'playcanvas-smoke',
      sceneUrl: '/playcanvas-smoke.glb',
      routePath: '/tour/playcanvas-smoke',
      fallbackRoutePath: '/tour/playcanvas-smoke?engine=r3f',
      expectedLoadedStatus: '3D-модель загружена',
    });
    const fixture = readFileSync(join(process.cwd(), 'public', playCanvasSmokeFixture.sceneUrl.replace(/^\//, '')));
    expect(fixture.subarray(0, 4).toString('utf8')).toBe('glTF');
    expect(fixture.readUInt32LE(4)).toBe(2);
    expect(fixture.byteLength).toBeGreaterThan(200);
  });
});
