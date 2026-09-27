#!/usr/bin/env node
/**
 * `prisma generate` with a network fallback.
 *
 * The generated client uses `engineType = "client"` (WASM query compiler +
 * `@prisma/adapter-pg`, see prisma/schema.prisma), so it never executes the
 * native schema/query engine binaries — `prisma generate` merely insists on
 * *resolving* them from https://binaries.prisma.sh before it writes the client.
 * On networks where that CDN is unreachable (corporate firewalls, some
 * regions), the download fails and `npm install` / `npm run build` break even
 * though no engine is actually needed.
 *
 * Strategy: try a normal generate first (so machines with access cache the real
 * engines for `prisma db push` / `prisma migrate`), and if the failure is the
 * engines CDN, retry with the engine paths stubbed at the Node binary — a file
 * that always exists and is never executed by generate or by the client.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const prismaCli = require.resolve('prisma/build/index.js');

function generate(env) {
  return spawnSync(process.execPath, [prismaCli, 'generate'], {
    stdio: 'inherit',
    env,
    cwd: path.join(__dirname, '..'),
  });
}

let result = generate(process.env);

if (result.status !== 0) {
  console.warn(
    '[prisma-generate] Engine download failed; retrying with stub engine paths ' +
      '(safe: the queryCompiler client never runs these binaries).'
  );
  result = generate({
    ...process.env,
    PRISMA_SCHEMA_ENGINE_BINARY: process.execPath,
    PRISMA_QUERY_ENGINE_LIBRARY: process.execPath,
    PRISMA_QUERY_ENGINE_BINARY: process.execPath,
    PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: '1',
  });
}

process.exit(result.status === null ? 1 : result.status);
