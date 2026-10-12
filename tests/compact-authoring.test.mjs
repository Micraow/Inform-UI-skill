import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compileAuthorDocument as compile, compactAuthorDocument as compact, parseAuthorExpression as parse, stringifyAuthoring as stringify, AuthoringError } from '../scripts/compact-authoring.mjs';
const doc = data => ({ version: 'iui/1', body: [{ type: 'text', value: 'Original example' }], data });
const author = document => ({ format: 'iui-author/1', document });

test('five representative documents roundtrip through serialized optional authoring data', async () => {
  for (const p of ['examples/minimal.json','examples/hpcc-feedback.json','examples/rtt-trend.json','examples/primitives-with-form-and-time.json','candidates/questionnaire/examples/event-packing.json']) {
    const d = JSON.parse(await readFile(new URL('../' + p, import.meta.url))), before = stringify(d), c = compact(d);
    assert.deepEqual(compile(JSON.parse(stringify(c))), d, p); assert.equal(stringify(d), before);
    assert.ok(Buffer.byteLength(stringify(c)) <= Buffer.byteLength(before), p);
  }
});

test('operators expand to canonical ASTs with no execution or implicit type conversion', () => {
  assert.deepEqual(parse('if(eq($mode,"travel"),sub($seats,$participants),null)'), { op:'if', args:[{op:'eq',args:[{$:'mode'},'travel']},{op:'sub',args:[{$:'seats'},{$:'participants'}]},null] });
  for (const [text,value] of [['0',0],['-0',-0],['false',false],['null',null],['""',''],['"空白 \\n"','空白 \n'],['1.25e2',125]]) assert.deepEqual(parse(text), value);
  assert.deepEqual(parse(' add ( 1, mul(2,3) ) '), {op:'add',args:[1,{op:'mul',args:[2,3]}]});
  assert.deepEqual(parse('$field.with-hyphen'), {$:'field.with-hyphen'});
});

test('unknown syntax, side-effect expressions, wrong arity and overflow fail explicitly', () => {
  for (const source of ['1+2','x','eval("1")','fetch("https://example.test")','process.exit()','add(1);alert(1)','add()','sub(1)','if(true,1)','add(1,)','add(1) garbage','Infinity','NaN','1e999','1e-999','01','+2','$constructor','format(1,2,3)']) assert.throws(() => parse(source), AuthoringError, source);
  assert.throws(() => parse('abs('.repeat(70) + '1' + ')'.repeat(70)), /deeply/);
});

test('literal escape preserves marker-shaped caller data rather than running a macro', () => {
  for (const data of [{$expr:'not an expression'},{$expr:'mul(2,3)',other:false},{$literal:{a:null}},{$table:{columns:['x'],rows:[[0]]}}]) {
    const input = doc(data); assert.deepEqual(compile(compact(input,{force:true})), input);
    assert.deepEqual(compile(input), input, 'Canonical input never interprets authoring markers');
  }
  const input = author(doc({$literal:{$expr:'fetch("https://example.test")'}})); assert.deepEqual(compile(input).data, {$expr:'fetch("https://example.test")'});
  assert.throws(() => compile(author(doc({$expr:'mul(2,3)',extra:1}))), /exactly one/);
});

test('record tables preserve column association, row order, null and explicit empty values', () => {
  const table = {$table:{columns:['name','value','enabled','note','items'],rows:[['zero',0,false,'',[]],['unknown',null,true,'supplied',[]]]}};
  assert.deepEqual(compile(author(doc(table))).data, [{name:'zero',value:0,enabled:false,note:'',items:[]},{name:'unknown',value:null,enabled:true,note:'supplied',items:[]}]);
  assert.deepEqual(compile(author(doc({$table:{columns:[],rows:[[],[]]}}))).data,[{},{}]);
  for (const table of [{columns:['a','a'],rows:[[1,2]]},{columns:['a'],rows:[[]]},{columns:['a'],rows:[[1,2]]},{columns:['__proto__'],rows:[[1]]},{columns:['a'],rows:'no'},{columns:['a'],rows:[[1]],extra:true}]) assert.throws(() => compile(author(doc({$table:table}))), AuthoringError);
});

test('automatic packing never changes missing keys into null or drops explicit false/zero', () => {
  const rows = [{a:1,b:null},{a:2},{a:3,b:false},{a:4,b:0}], input = doc(rows), c = compact(input,{force:true});
  assert.ok(Array.isArray(c.document.data)); assert.deepEqual(compile(JSON.parse(stringify(c))), input);
  assert.equal(Object.hasOwn(compile(c).data[1],'b'),false);
});

test('negative zero, Unicode, version and safety metadata survive the serialized roundtrip', () => {
  const input = doc({value:-0,missing:null,text:'原文\n"quoted"',empty:[],metadata:{version:'1.0.0',disabled:false,sources:[{title:'Original synthetic rules',url:'https://example.test/rules'}]}});
  const output = compile(JSON.parse(stringify(compact(input,{force:true})))); assert.deepEqual(output,input); assert.ok(Object.is(output.data.value,-0));
});

test('finite JSON boundaries reject accessors, sparse arrays, cycles and executable values', () => {
  let called = 0; const getter = Object.defineProperty({},'value',{enumerable:true,get(){called++;return 1;}});
  const cyclic={};cyclic.x=cyclic;
  for (const bad of [undefined,NaN,Infinity,()=>1,1n,getter,cyclic,new Date(),Array(1),JSON.parse('{"__proto__":1}')]) assert.throws(()=>compact(doc(bad)),AuthoringError);
  assert.equal(called,0);
  assert.throws(()=>compile({format:'iui-author/2',document:doc(null)}),/AUTHOR_FORMAT/);
  assert.throws(()=>compile(author({version:'other',body:[]})),/explicit iui\/1/);
});

test('100 deterministic heterogeneous documents preserve full JSON semantics', () => {
  for(let i=0;i<100;i++) {
    const values=[null,false,0,'',[],{},i,'样例'+i];
    const d=doc({rows:Array.from({length:4},(_,j)=>({id:'item'+j,amount:values[(i+j)%values.length],flags:[false,0,null]})),calculation:{op:'if',args:[{op:'eq',args:[{$:'kind'},'sample']},i,null]}});
    assert.deepEqual(compile(JSON.parse(stringify(compact(d,{force:true})))),d);
  }
});
