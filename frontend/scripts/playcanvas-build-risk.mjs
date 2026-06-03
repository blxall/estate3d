import { spawn } from 'node:child_process';

const ACCEPTED_WARNING_KEYS = ['playcanvas-lazy-chunk-over-700kb', 'vite-node-worker-threads-externalized-for-gsplat-workers'];
const GZIP_GUARDRAIL_KB = 500;
const CHUNK_WARNING_LIMIT_KB = 700;

export function parsePlayCanvasBuildRisk(output) {
  const playCanvasChunk = parsePlayCanvasChunk(output);
  const nodeWorkerThreadsExternalizedCount = (output.match(/node:worker_threads/g) ?? []).length;
  const chunkWarning = output.includes('Some chunks are larger than 700 kB after minification');

  return {
    playCanvasChunk,
    warnings: {
      chunkWarning,
      nodeWorkerThreadsExternalizedCount,
      acceptedWarningKeys: ACCEPTED_WARNING_KEYS,
    },
    mitigationDecision: 'guarded-default-accepted-for-glb-only-public-tours',
    nextMitigation: 'Keep PlayCanvas lazy-loaded; investigate package-level gsplat worker imports before premium ЖК migration.',
  };
}

function parsePlayCanvasChunk(output) {
  const line = output
    .split('\n')
    .find((candidate) => /dist\/assets\/PlayCanvasGlbScene-.*\.js\s+/.test(candidate));

  if (!line) {
    return null;
  }

  const match = line.match(/(dist\/assets\/PlayCanvasGlbScene-[^\s]+\.js)\s+([\d,.]+)\s+kB\s+│\s+gzip:\s+([\d,.]+)\s+kB/);
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
    withinGzipGuardrail: gzipKb <= GZIP_GUARDRAIL_KB,
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
  if (!risk.playCanvasChunk.withinGzipGuardrail) {
    throw new Error(`PlayCanvas gzip chunk exceeds ${GZIP_GUARDRAIL_KB} KB guardrail: ${risk.playCanvasChunk.gzipKb} KB`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
