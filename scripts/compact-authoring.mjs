/** Optional JSON authoring sugar. Expansion creates canonical data, never evaluates code. */
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

export const AUTHORING_FORMAT = 'iui-author/1';
const limits = { nodes: 50000, depth: 64, text: 2_000_000, expression: 12000 };
const arities = { add:[1,12], sub:[2,2], mul:[1,12], div:[2,2], min:[1,12], max:[1,12], round:[1,2], abs:[1,1], clamp:[3,3], gt:[2,2], lt:[2,2], eq:[2,2], if:[3,3], format:[1,2] };
const reserved = new Set(['$expr', '$table', '$literal']);
const forbidden = new Set(['__proto__', 'constructor', 'prototype']);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const record = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const pointer = (p, k) => `${p}/${String(k).replace(/~/g, '~0').replace(/\//g, '~1')}`;
export class AuthoringError extends Error {
  constructor(code, at, message) { super(`${code} ${at || '/'}: ${message}`); this.code = code; this.path = at; }
}
const fail = (code, at, message) => { throw new AuthoringError(code, at, message); };

function jsonCopy(input) {
  let nodes = 0, text = 0; const active = new WeakSet();
  function copy(x, at, depth) {
    if (++nodes > limits.nodes || depth > limits.depth) fail('AUTHOR_BUDGET', at, 'JSON nesting or size exceeds the supported budget.');
    if (x === null || typeof x === 'boolean') return x;
    if (typeof x === 'string') { text += x.length; if (text > limits.text) fail('AUTHOR_BUDGET', at, 'Text exceeds the supported budget.'); return x; }
    if (typeof x === 'number') { if (!Number.isFinite(x)) fail('AUTHOR_JSON', at, 'Only finite JSON numbers are allowed.'); return x; }
    if (typeof x !== 'object') fail('AUTHOR_JSON', at, 'Only JSON data is supported.');
    const array = Array.isArray(x), proto = Object.getPrototypeOf(x), keys = Object.keys(x);
    if (active.has(x) || Object.getOwnPropertySymbols(x).length || (array ? proto !== Array.prototype : proto !== Object.prototype && proto !== null)) fail('AUTHOR_JSON', at, 'Expected acyclic plain JSON data.');
    if (array && keys.length !== x.length) fail('AUTHOR_JSON', at, 'Sparse arrays are not JSON arrays.');
    active.add(x); const out = array ? [] : {};
    for (const k of keys) {
      if (forbidden.has(k) || array && !/^(0|[1-9]\d*)$/.test(k)) fail('AUTHOR_KEY', pointer(at, k), 'Unsupported property name.');
      const d = Object.getOwnPropertyDescriptor(x, k); if (!d || !own(d, 'value')) fail('AUTHOR_JSON', pointer(at, k), 'Accessors are not JSON data.');
      text += k.length; if (text > limits.text) fail('AUTHOR_BUDGET', at, 'Text exceeds the supported budget.');
      out[k] = copy(d.value, pointer(at, k), depth + 1);
    }
    active.delete(x); return out;
  }
  return copy(input, '', 0);
}

/** Retains negative zero; does not omit null, false, empty strings, arrays or objects. */
export function stringifyAuthoring(input) {
  const value = jsonCopy(input);
  function emit(x) {
    if (typeof x === 'number' && Object.is(x, -0)) return '-0';
    if (Array.isArray(x)) return `[${x.map(emit).join(',')}]`;
    if (record(x)) return `{${Object.entries(x).map(([k,v]) => `${JSON.stringify(k)}:${emit(v)}`).join(',')}}`;
    return JSON.stringify(x);
  }
  return emit(value);
}

/** Calls and JSON literals only: no infix precedence, property access, eval or callbacks. */
export function parseAuthorExpression(source, at = '') {
  if (typeof source !== 'string' || source.length > limits.expression) fail('AUTHOR_EXPRESSION', at, 'Expected an expression string of at most 12000 characters.');
  let i = 0, nodes = 0;
  const skip = () => { while (/\s/.test(source[i] ?? '') && i < source.length) i++; };
  const error = message => fail('AUTHOR_EXPRESSION', at, `${message} (offset ${i}).`);
  function value(depth) {
    skip(); if (++nodes > limits.nodes || depth > limits.depth) error('Expression is too deeply nested');
    const rest = source.slice(i);
    if (source[i] === '"') {
      const match = rest.match(/^"(?:[^"\\\x00-\x1f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/);
      if (!match) error('Expected a JSON string'); i += match[0].length; return JSON.parse(match[0]);
    }
    if (source[i] === '$') {
      const match = rest.match(/^\$([A-Za-z_][A-Za-z0-9_.-]{0,79})/);
      if (!match || forbidden.has(match[1])) error('Expected a safe field or computed reference'); i += match[0].length; return { $: match[1] };
    }
    const number = rest.match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (number) { i += number[0].length; const n = Number(number[0]); if (!Number.isFinite(n) || n === 0 && /[1-9]/.test(number[0].split(/[eE]/)[0])) error('Number must be finite without nonzero underflow'); return n; }
    for (const [word, v] of [['true', true], ['false', false], ['null', null]]) if (rest.startsWith(word)) { i += word.length; return v; }
    const op = rest.match(/^[a-z]+/); if (!op || !own(arities, op[0])) error('Expected an allowed operator, reference or JSON scalar');
    i += op[0].length; skip(); if (source[i++] !== '(') error('Expected opening parenthesis');
    const args = []; skip(); if (source[i] !== ')') {
      while (true) { args.push(value(depth + 1)); skip(); if (source[i] !== ',') break; i++; }
    }
    if (source[i++] !== ')') error('Expected closing parenthesis');
    const [min,max] = arities[op[0]]; if (args.length < min || args.length > max) error(`Operator ${op[0]} needs ${min === max ? min : `${min}–${max}`} arguments`);
    return { op: op[0], args };
  }
  const out = value(0); skip(); if (i !== source.length) error('Unexpected trailing input'); return out;
}

function expressionText(x) {
  if (x === null || ['string', 'number', 'boolean'].includes(typeof x)) return stringifyAuthoring(x);
  if (!record(x)) return null;
  if (Object.keys(x).length === 1 && typeof x.$ === 'string' && /^[A-Za-z_][A-Za-z0-9_.-]{0,79}$/.test(x.$) && !forbidden.has(x.$)) return `$${x.$}`;
  if (Object.keys(x).length !== 2 || !own(arities, x.op) || !Array.isArray(x.args)) return null;
  const [min,max] = arities[x.op]; if (x.args.length < min || x.args.length > max) return null;
  const args = x.args.map(expressionText); if (args.includes(null)) return null;
  const text = `${x.op}(${args.join(',')})`; return text.length <= limits.expression ? text : null;
}

/** Existing iui/1 input is copied unchanged. New syntax must use the explicit envelope. */
export function compileAuthorDocument(input) {
  const value = jsonCopy(input);
  if (!record(value)) fail('AUTHOR_DOCUMENT', '', 'Expected a document object.');
  if (value.version === 'iui/1' && !own(value, 'format')) return value;
  if (value.format !== AUTHORING_FORMAT || Object.keys(value).length !== 2 || !own(value, 'document')) fail('AUTHOR_FORMAT', '', 'Expected format iui-author/1 and document.');
  function expand(x, at) {
    if (Array.isArray(x)) return x.map((v,i) => expand(v, pointer(at,i)));
    if (!record(x)) return x;
    const marker = Object.keys(x).find(k => reserved.has(k));
    if (marker) {
      if (Object.keys(x).length !== 1) fail('AUTHOR_MARKER', at, 'A marker object must have exactly one property; use $literal for data.');
      if (marker === '$literal') return jsonCopy(x.$literal);
      if (marker === '$expr') return parseAuthorExpression(x.$expr, pointer(at, '$expr'));
      const t = x.$table;
      if (!record(t) || Object.keys(t).length !== 2 || !Array.isArray(t.columns) || !Array.isArray(t.rows)) fail('AUTHOR_TABLE', at, 'Expected columns and rows arrays.');
      if (t.columns.length > 100 || t.rows.length > 10000 || t.columns.some(k => typeof k !== 'string' || forbidden.has(k)) || new Set(t.columns).size !== t.columns.length) fail('AUTHOR_TABLE', at, 'Columns must be unique safe strings within the table budget.');
      return t.rows.map((row, index) => {
        if (!Array.isArray(row) || row.length !== t.columns.length) fail('AUTHOR_TABLE', pointer(at, index), 'Every row must have exactly one value per column; null is not a missing key.');
        return Object.fromEntries(t.columns.map((key,j) => [key, expand(row[j], `${at}/$table/rows/${index}/${j}`)]));
      });
    }
    return Object.fromEntries(Object.entries(x).map(([k,v]) => [k, expand(v, pointer(at,k))]));
  }
  const document = jsonCopy(expand(value.document, '/document'));
  if (!record(document) || document.version !== 'iui/1') fail('AUTHOR_DOCUMENT', '/document', 'Expansion must preserve an explicit iui/1 version.');
  return document;
}

/** Optimize only where exact JSON value preservation and measured byte reduction hold. */
export function compactAuthorDocument(input, { force = false } = {}) {
  const original = jsonCopy(input);
  if (!record(original) || original.version !== 'iui/1') fail('AUTHOR_DOCUMENT', '', 'Expected a canonical iui/1 document.');
  const size = x => Buffer.byteLength(stringifyAuthoring(x));
  function compact(x) {
    if (Array.isArray(x)) {
      const plain = x.map(compact);
      if (x.length < 3 || !x.every(record)) return plain;
      const columns = Object.keys(x[0]); if (!columns.length || columns.length > 100 || !x.every(row => Object.keys(row).length === columns.length && columns.every(k => own(row,k)))) return plain;
      const table = { $table: { columns, rows: x.map(row => columns.map(k => compact(row[k]))) } };
      return size(table) < size(plain) ? table : plain;
    }
    if (!record(x)) return x;
    if (Object.keys(x).some(k => reserved.has(k))) return { $literal: x };
    const plain = Object.fromEntries(Object.entries(x).map(([k,v]) => [k, compact(v)]));
    if (own(x, 'op') && own(x, 'args')) {
      const text = expressionText(x), candidate = text === null ? null : { $expr: text };
      if (candidate && size(candidate) < size(plain)) return candidate;
    }
    return plain;
  }
  const envelope = { format: AUTHORING_FORMAT, document: compact(original) };
  return force || size(envelope) < size(original) ? envelope : original;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [mode, file, output] = process.argv.slice(2);
  if (!['compact','compile'].includes(mode) || !file || !output) throw Error('Usage: compact-authoring.mjs compact|compile input.json output.json');
  const input = JSON.parse(await readFile(file, 'utf8'));
  const result = mode === 'compact' ? compactAuthorDocument(input) : compileAuthorDocument(input);
  await writeFile(output, stringifyAuthoring(result) + '\n');
}
