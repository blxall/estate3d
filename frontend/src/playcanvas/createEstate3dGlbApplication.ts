import { platform } from 'playcanvas/build/playcanvas/src/core/platform.js';
import { Color } from 'playcanvas/build/playcanvas/src/core/math/color.js';
import { Vec3 } from 'playcanvas/build/playcanvas/src/core/math/vec3.js';
import { WebglGraphicsDevice } from 'playcanvas/build/playcanvas/src/platform/graphics/webgl/webgl-graphics-device.js';
import { AppBase } from 'playcanvas/build/playcanvas/src/framework/app-base.js';
import { AppOptions } from 'playcanvas/build/playcanvas/src/framework/app-options.js';
import { FILLMODE_FILL_WINDOW, RESOLUTION_AUTO } from 'playcanvas/build/playcanvas/src/framework/constants.js';
import { Entity } from 'playcanvas/build/playcanvas/src/framework/entity.js';
import { CameraComponentSystem } from 'playcanvas/build/playcanvas/src/framework/components/camera/system.js';
import { LightComponentSystem } from 'playcanvas/build/playcanvas/src/framework/components/light/system.js';
import { RenderComponentSystem } from 'playcanvas/build/playcanvas/src/framework/components/render/system.js';
import { BinaryHandler } from 'playcanvas/build/playcanvas/src/framework/handlers/binary.js';
import { ContainerHandler } from 'playcanvas/build/playcanvas/src/framework/handlers/container.js';
import { JsonHandler } from 'playcanvas/build/playcanvas/src/framework/handlers/json.js';
import { MaterialHandler } from 'playcanvas/build/playcanvas/src/framework/handlers/material.js';
import { RenderHandler } from 'playcanvas/build/playcanvas/src/framework/handlers/render.js';
import { TextureHandler } from 'playcanvas/build/playcanvas/src/framework/handlers/texture.js';

type Estate3dGlbApplicationOptions = {
  graphicsDeviceOptions?: Record<string, unknown>;
};

export type Estate3dGlbApplication = AppBase;

export { Color, Entity, FILLMODE_FILL_WINDOW, RESOLUTION_AUTO, Vec3 };

export function createEstate3dGlbApplication(
  canvas: HTMLCanvasElement,
  options: Estate3dGlbApplicationOptions = {},
): Estate3dGlbApplication {
  const app = new AppBase(canvas);
  const appOptions = new AppOptions();
  const graphicsDeviceOptions = { ...(options.graphicsDeviceOptions ?? {}) };

  if (platform.browser && typeof navigator !== 'undefined' && navigator.xr) {
    graphicsDeviceOptions.xrCompatible = true;
  }
  graphicsDeviceOptions.alpha = graphicsDeviceOptions.alpha || false;

  appOptions.graphicsDevice = new WebglGraphicsDevice(canvas, graphicsDeviceOptions);
  appOptions.componentSystems = [RenderComponentSystem, CameraComponentSystem, LightComponentSystem];
  appOptions.resourceHandlers = [RenderHandler, MaterialHandler, TextureHandler, JsonHandler, BinaryHandler, ContainerHandler];

  app.init(appOptions);
  return app;
}
