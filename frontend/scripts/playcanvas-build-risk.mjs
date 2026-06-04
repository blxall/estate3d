import { spawn } from 'node:child_process';

const CHUNK_WARNING_KEY = 'playcanvas-lazy-chunk-over-700kb';
const NODE_WORKER_WARNING_KEY = 'vite-node-worker-threads-externalized-for-gsplat-workers';
const GZIP_GUARDRAIL_KB = 500;
const CHUNK_WARNING_LIMIT_KB = 700;

export function parsePlayCanvasBuildRisk(output) {
  const playCanvasChunks = parsePlayCanvasChunks(output);
  const playCanvasChunk = playCanvasChunks.vendorChunk
    ? { ...playCanvasChunks.vendorChunk, withinGzipGuardrail: playCanvasChunks.withinGzipGuardrail }
    : playCanvasChunks.sceneChunk
      ? { ...playCanvasChunks.sceneChunk, withinGzipGuardrail: playCanvasChunks.withinGzipGuardrail }
      : null;
  const nodeWorkerThreadsExternalizedCount = (output.match(/node:worker_threads/g) ?? []).length;
  const chunkWarning = output.includes('Some chunks are larger than 700 kB after minification');
  const split = playCanvasChunks.splitStrategy === 'manual-playcanvas-vendor-chunk';
  const acceptedWarningKeys = [chunkWarning ? CHUNK_WARNING_KEY : null, nodeWorkerThreadsExternalizedCount > 0 ? NODE_WORKER_WARNING_KEY : null].filter(Boolean);
  const eliminatedWarningKeys = nodeWorkerThreadsExternalizedCount === 0 ? [NODE_WORKER_WARNING_KEY] : [];
  const glbOnlyFactory = split && nodeWorkerThreadsExternalizedCount === 0;

  return {
    playCanvasChunk,
    playCanvasChunks,
    warnings: {
      chunkWarning,
      nodeWorkerThreadsExternalizedCount,
      acceptedWarningKeys,
      eliminatedWarningKeys,
    },
    mitigationDecision: glbOnlyFactory
      ? 'glb-only-app-factory-accepted-for-public-tours'
      : split
      ? 'manual-vendor-split-accepted-for-cacheable-glb-runtime'
      : 'guarded-default-accepted-for-glb-only-public-tours',
    nextMitigation: glbOnlyFactory
      ? 'Keep the GLB-only AppBase factory; do not reintroduce full Application imports before premium ЖК migration.'
      : split
      ? 'Keep PlayCanvas vendor isolated; investigate package-level gsplat worker imports before premium ЖК migration.'
      : 'Keep PlayCanvas lazy-loaded; investigate package-level gsplat worker imports before premium ЖК migration.',
  };
}

function parsePlayCanvasChunks(output) {
  const sceneChunk = parseChunkLine(output, /dist\/assets\/PlayCanvasGlbScene-.*\.js\s+/);
  const vendorChunk = parseChunkLine(output, /dist\/assets\/playcanvas-vendor-.*\.js\s+/);
  const totalGzipKb = Number([sceneChunk, vendorChunk].filter(Boolean).reduce((sum, chunk) => sum + chunk.gzipKb, 0).toFixed(2));

  return {
    sceneChunk,
    vendorChunk,
    totalGzipKb,
    splitStrategy: vendorChunk ? 'manual-playcanvas-vendor-chunk' : 'unsplit-scene-chunk',
    withinGzipGuardrail: totalGzipKb > 0 && totalGzipKb <= GZIP_GUARDRAIL_KB,
  };
}

function parseChunkLine(output, pattern) {
  const line = output.split('\n').find((candidate) => pattern.test(candidate));

  if (!line) {
    return null;
  }

  const match = line.match(/(dist\/assets\/(?:PlayCanvasGlbScene|playcanvas-vendor)-[^\s]+\.js)\s+([\d,.]+)\s+kB\s+│\s+gzip:\s+([\d,.]+)\s+kB/);
  if (!match) {
    return null;
  }

  const sizeKb = Number(match[2].replace(/,/g, ''));
  const gzipKb = Number(match[3].replace(/,/g, ''));

  return {
    file: match[1],
    sizeKb,
    gzipKb,
    overChunkWarningLimit: sizeKb > CHUNK_WARNING_LIMIT_KB,
  };
}

function runViteBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['vite', 'build'], {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
    });
    let output = '';
    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`vite build exited with ${code}`));
      }
    });
  });
}

async function main() {
  const output = await runViteBuild();
  const risk = parsePlayCanvasBuildRisk(output);
  console.log(`\nPLAYCANVAS_BUILD_RISK ${JSON.stringify(risk, null, 2)}`);
  if (!risk.playCanvasChunk) {
    throw new Error('PlayCanvas chunk was not found in Vite build output');
  }
  if (!risk.playCanvasChunks.withinGzipGuardrail) {
    throw new Error(`PlayCanvas combined gzip chunks exceed ${GZIP_GUARDRAIL_KB} KB guardrail: ${risk.playCanvasChunks.totalGzipKb} KB`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
