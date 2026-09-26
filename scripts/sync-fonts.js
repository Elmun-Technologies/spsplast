/**
 * Copies the vendored Inter woff2 subsets from `@fontsource-variable/inter`
 * into `public/fonts`.
 *
 * The font is self-hosted (see the `@font-face` block in `src/app/globals.css`)
 * so that `next build` has no outbound network dependency on Google Fonts.
 * Run `npm run fonts:sync` after bumping `@fontsource-variable/inter` and then
 * update the version mentioned in the `globals.css` comment.
 */
const fs = require('fs');
const path = require('path');

const PKG = '@fontsource-variable/inter';
const SUBSETS = ['latin', 'cyrillic'];
const TARGET_DIR = path.join(__dirname, '..', 'public', 'fonts');

function resolvePkgRoot() {
  try {
    return path.dirname(
      require.resolve(path.join(PKG, 'package.json'), { paths: [__dirname] })
    );
  } catch {
    // Fall back to the conventional node_modules location (npm/pnpm/yarn hoisting).
    return path.join(__dirname, '..', 'node_modules', PKG);
  }
}

function main() {
  const pkgRoot = resolvePkgRoot();
  const pkgJsonPath = path.join(pkgRoot, 'package.json');

  if (!fs.existsSync(pkgJsonPath)) {
    console.error(`[fonts:sync] ${PKG} is not installed. Run \`npm install\` first.`);
    process.exit(1);
  }

  const version = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).version;
  fs.mkdirSync(TARGET_DIR, { recursive: true });

  const written = [];
  for (const subset of SUBSETS) {
    const fileName = `inter-${subset}-wght-normal.woff2`;
    const from = path.join(pkgRoot, 'files', fileName);
    const to = path.join(TARGET_DIR, fileName);

    if (!fs.existsSync(from)) {
      console.error(`[fonts:sync] missing ${from}`);
      process.exit(1);
    }

    fs.copyFileSync(from, to);
    written.push(`${fileName} (${(fs.statSync(to).size / 1024).toFixed(1)} KB)`);
  }

  console.log(`[fonts:sync] ${PKG}@${version} -> public/fonts`);
  for (const file of written) console.log(`  - ${file}`);
  console.log('[fonts:sync] Remember to refresh the version note in src/app/globals.css');
}

main();
