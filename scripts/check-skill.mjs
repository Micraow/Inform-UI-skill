import { readFile, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';
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

export function forbiddenPath(file) {
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
  if (text.split(/\s+/).length > 850) throw new Error('Keep the skill entrypoint compact; move conditional detail to references.');
  return { name, description };
}

export async function checkSkill() {
  const files = await repositoryFiles();
  for (const file of files) {
    if (forbiddenPath(file)) throw new Error(`Non-distributable or out-of-scope path: ${file}`);
    if ((await lstat(path.join(root, file))).size > 256_000) throw new Error(`Unexpected large file: ${file}`);
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
