#!/usr/bin/env node
import {join, resolve} from 'node:path';
import {skillRoot, loadRuntime, parseArgs} from './lib.mjs';
import {auditContracts} from './contract-audit.mjs';

try {
  const {opts,positional} = parseArgs(process.argv.slice(2));
  if (positional.length || Object.keys(opts).some(key => key !== 'runtime-dir')) {
    throw Error('Usage: verify-contracts.mjs [--runtime-dir verified/runtime-directory]');
  }
  const runtimeDirectory = resolve(opts['runtime-dir'] ?? join(skillRoot, 'assets/runtime'));
  const api = await loadRuntime(runtimeDirectory);
  const report = await auditContracts({root:skillRoot,api,runtimeDirectory});
  if (!opts['runtime-dir'] && !report.bundledRuntimeMatches) throw Error('Bundled runtime does not match its lock');
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
