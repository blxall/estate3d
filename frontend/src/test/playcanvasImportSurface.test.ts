import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');

function readProjectFile(path: string) {
  return readFileSync(resolve(root, path), 'utf8');
}

describe('PlayCanvas GLB-only import surface', () => {
  it('keeps the public GLB renderer off the full playcanvas Application entry that imports gsplat handlers', () => {
    const sceneSource = readProjectFile('src/components/PlayCanvasGlbScene.tsx');
    const factorySource = readProjectFile('src/playcanvas/createEstate3dGlbApplication.ts');

    expect(sceneSource).not.toContain("from 'playcanvas'");
    expect(sceneSource).not.toContain('from "playcanvas"');
    expect(sceneSource).toContain('createEstate3dGlbApplication');

    expect(factorySource).toContain('AppBase');
    expect(factorySource).toContain('ContainerHandler');
    expect(factorySource).not.toContain('GSplat');
    expect(factorySource).not.toContain('framework/application');
    expect(factorySource).not.toContain('handlers/gsplat');
    expect(factorySource).not.toContain('components/gsplat');
  });
});
