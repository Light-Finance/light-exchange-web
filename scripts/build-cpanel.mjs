// Post-build step for cPanel deployments.
//
// Vercel gets its routing from vercel.json; Apache needs the same rules in an
// .htaccess sitting next to index.html. That file is kept out of public/ on
// purpose — anything in public/ is also published by Vercel, where the file is
// dead weight and would expose the rewrite rules at /.htaccess.
//
// If VITE_BASE is set (subfolder deployment), RewriteBase is rewritten to match
// so the two can't drift apart.
import { copyFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'deploy/cpanel/.htaccess');
const target = resolve(root, 'dist/.htaccess');

if (!existsSync(resolve(root, 'dist'))) {
  console.error('dist/ not found — run the build first.');
  process.exit(1);
}

copyFileSync(source, target);

const base = process.env.VITE_BASE || '/';
if (base !== '/') {
  const normalised = `/${base.replace(/^\/|\/$/g, '')}/`;
  const contents = readFileSync(target, 'utf8').replace(
    /^(\s*RewriteBase\s+).*$/m,
    `$1${normalised}`,
  );
  writeFileSync(target, contents);
  console.log(`.htaccess written to dist/ (RewriteBase ${normalised})`);
} else {
  console.log('.htaccess written to dist/ (RewriteBase /)');
}

console.log('Upload the *contents* of dist/ — including the dotfile — to your cPanel docroot.');
