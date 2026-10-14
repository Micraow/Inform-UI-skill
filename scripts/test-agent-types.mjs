#!/usr/bin/env node
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {skillRoot, parseArgs} from './lib.mjs';
import {checkAgentConsumer} from '../tests/agent-consumer-contract.mjs';

const {opts,positional} = parseArgs(process.argv.slice(2));
if (!opts.typescript || positional.length || Object.keys(opts).some(key => key !== 'typescript')) {
  throw Error('Pass --typescript /path/to/installed/typescript/lib/tsc.js; no compiler is downloaded');
}
const compiler = resolve(opts.typescript);
const run = args => {
  const result = spawnSync(process.execPath, [compiler,...args], {cwd:skillRoot,encoding:'utf8'});
  if (result.status !== 0) throw Error(result.stderr || result.stdout || result.error?.message || 'TypeScript command failed');
  return result.stdout.trim();
};
const directory = await mkdtemp(join(tmpdir(), 'inform-agent-types-'));
try {
  const flags = ['--strict','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext'];
  run([...flags,'--noEmit','examples/agent-integration/consume.mts','tests/fixtures/agent-types.mts']);
  run([...flags,'--outDir',directory,'examples/agent-integration/consume.mts']);
  const {consumeModelText} = await import(pathToFileURL(join(directory, 'consume.mjs')).href);
  const checks = await checkAgentConsumer(consumeModelText);
  console.log(JSON.stringify({ok:true,compiler:run(['--version']),strictTypes:true,compiledConsumerChecks:checks,modelAPI:'not invoked',browser:'not tested'}, null, 2));
} finally { await rm(directory, {recursive:true,force:true}); }
