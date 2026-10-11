import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

/** Recovered original fixtures, not the later lost visual-alignment compositions. */
export async function verifyHistoricalScenes(api,JSDOM) {
  const results=[];
  for(const name of ['hpcc-feedback','rtt-trend','wifi-status']){
    const bytes=await readFile(new URL('../../examples/'+name+'.json',import.meta.url));
    const spec=JSON.parse(bytes),before=JSON.stringify(spec);
    const valid=api.validateDocument(spec);assert.equal(valid.ok,true,name+JSON.stringify(valid));
    const dom=new JSDOM('<!doctype html><html lang="en"><body><main></main></body></html>');
    const host=dom.window.document.querySelector('main'),controller=api.mount(host,spec,{styles:false});
    try{
      if(name==='hpcc-feedback'){
        const slider=host.querySelector('input[type=range]');assert.ok(slider);
        slider.value='0.9';slider.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
        assert.equal(controller.getState().middleLoad,0.9);
        const evaluated=api.evaluateState(spec,{middleLoad:0.9});assert.equal(evaluated.ok,true);
        assert.equal(evaluated.computed.maximumLoad,0.9);
        assert.ok(Math.abs(evaluated.computed.nextWindow-(0.95/0.9*100+5))<1e-12);
        assert.ok(host.querySelector('.iui-topology svg'));
        assert.ok(host.querySelector('math'),'Actual MathML is present');
      }else if(name==='rtt-trend'){
        const chart=spec.body.find(n=>n.type==='chart');
        assert.equal(chart.data[2].quiet,null);assert.equal(chart.unit,'ms');
        assert.ok(host.querySelector('.iui-chart svg'));
        const table=spec.body.find(n=>n.type==='details').children[0];
        assert.equal(table.rows[2][1],null);
        assert.match(host.textContent,/missing|null/i);
      }else{
        const metrics=spec.body.find(n=>n.type==='metric-grid').children;
        assert.deepEqual(metrics.map(n=>[n.value,n.unit??null]),[[36,null],[-58,'dBm'],[866,'Mbit/s']]);
        assert.match(host.textContent,/PHY link rate/);assert.match(host.textContent,/not measured application throughput/);
        assert.match(host.textContent,/-58/);assert.match(host.textContent,/dBm/);
      }
      assert.equal(JSON.stringify(spec),before);
      results.push({name,sha256:createHash('sha256').update(bytes).digest('hex'),level:'DOM and supplied-data semantics'});
    }finally{controller.dispose();dom.window.close()}
  }
  return results;
}
