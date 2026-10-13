import { readFile, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excluded = new Set(['.git', 'node_modules', 'artifacts', 'coverage', 'test-results', 'playwright-report']);
export async function repositoryFiles(directory = root) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${path.relative(root, absolute)}`);
    if (entry.isDirectory()) result.push(...await repositoryFiles(absolute));
    else result.push(path.relative(root, absolute).replaceAll(path.sep, '/'));
  }
  return result.sort();
}

const publicGalleryFiles = new Set(['create', 'explore', 'compose', 'panorama'].map(name => 'assets/gallery-' + name + '.png'));
export function forbiddenPath(file) {
  if (publicGalleryFiles.has(file)) return false;
  return /(?:^|\/)(?:private-evidence|historical-archives|captured[^/]*|native-runtime[^/]*)(?:\/|$)/i.test(file)
    || /(?:^|\/)(?:factories\.js|boot\.js|native\.css|requirements(?:-[^.]*)?\.txt|\.env(?:\..*)?)$/i.test(file)
    || /\.(?:py|pyc|whl|har|zip|png|jpe?g|webp|woff2?|ttf)$/i.test(file);
}

export function parseSkillFrontmatter(source) {
  const text = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) throw new Error('SKILL.md must begin with YAML frontmatter.');
  const name = frontmatter[1].match(/^name: (.+)$/m)?.[1];
  const description = frontmatter[1].match(/^description: (.+)$/m)?.[1];
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) throw new Error('Invalid skill name.');
  if (!description || description.length > 1024) throw new Error('Missing or overlong description.');
  return { name, description };
}

export async function checkSkill() {
  const files = await repositoryFiles();
  for (const file of files) {
    if (forbiddenPath(file)) throw new Error(`Non-distributable or out-of-scope path: ${file}`);
    if (publicGalleryFiles.has(file)) {
      const bytes = await readFile(path.join(root, file));
      const manifest = JSON.parse(await readFile(path.join(root, 'assets/gallery-manifest.json'), 'utf8'));
      const item = manifest.files?.find(item => item.path === file);
      if (!item || manifest.format !== 'inform-ui-original-gallery/1' || bytes.length > 1_000_000 || bytes.length !== item.bytes || createHash('sha256').update(bytes).digest('hex') !== item.sha256 || bytes.subarray(1, 4).toString() !== 'PNG' || bytes.readUInt32BE(16) !== item.width || bytes.readUInt32BE(20) !== 1440) throw new Error('Original public gallery image identity mismatch: ' + file);
      continue;
    }
    if ((await lstat(path.join(root, file))).size > 256_000) {
      // Only these explicitly versioned generated WebChat schemas may exceed the limit.
      if (!['authoring/progressive/webchat/iui.schema.json', 'authoring/current219/webchat/iui.schema.json'].includes(file)) throw new Error(`Unexpected large file: ${file}`);
      const bytes = await readFile(path.join(root, file));
      const manifest = JSON.parse(await readFile(path.join(root, path.posix.dirname(file), 'iui.schema.manifest.json'), 'utf8'));
      if (bytes.length > 1_000_000 || manifest.format !== 'inform-ui-source-selection/1' || manifest.mode !== 'full' || manifest.schemaVersion !== 'iui/1' || bytes.length !== manifest.utf8Bytes || createHash('sha256').update(bytes).digest('hex') !== manifest.sha256) throw new Error('Generated WebChat schema identity mismatch.');
    }
  }
  const skill = await readFile(path.join(root, 'SKILL.md'), 'utf8');
  parseSkillFrontmatter(skill);
  for (const file of files.filter(file => file.endsWith('.md'))) {
    const content = await readFile(path.join(root, file), 'utf8');
    for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const destination = match[1];
      if (/^(?:https?:|#)/.test(destination)) continue;
      const target = path.resolve(path.dirname(path.join(root, file)), destination.split('#')[0]);
      if (!target.startsWith(root + path.sep) || !(await lstat(target).catch(() => null))) throw new Error(`Broken relative link in ${file}: ${destination}`);
    }
  }
  return files;
}

/** Read the exact self-contained HTML shell delivered in the public entrypoint. */
export function readSkillShell(source) {
  const html = source.match(/^```html\r?\n([\s\S]*?)^```/m)?.[1];
  if (!html) throw new Error('SKILL.md needs a complete HTML shell for web-chat users.');
  const raw = html.match(/<script id="iui-spec" type="application\/json">\s*([\s\S]*?)\s*<\/script>/)?.[1];
  if (!raw) throw new Error('The HTML shell must contain its JSON data block.');
  return { html, document: JSON.parse(raw) };
}
