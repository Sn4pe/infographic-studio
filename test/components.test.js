import test from 'node:test';
import assert from 'node:assert/strict';
import { createComponent, composeComponents, createSection, listComponents, renderScene, listLabels } from '../src/index.js';

test('generic objects compose and render with unique editable parts',async()=>{
  const elements=composeComponents(listComponents().map((component,i)=>({component,id:`part-${i}`,x:25+i%4*220,y:25+Math.floor(i/4)*190,width:120,height:130})));
  elements.push(...createSection({id:'layers',x:920,y:40,width:150,height:150,view:'end',layers:[{ratio:1},{ratio:.7,fill:'#E9C399'}]}));
  const scene={version:1,title:'Generic vocabulary',description:'Local original vector components.',width:1440,height:650,theme:'paper',sources:[{title:'Test fixture',url:'https://example.org/fixture'}],panels:[{id:'sheet',x:52,y:182,width:1336,height:380,framed:false,elements}]};
  const {files}=await renderScene(scene,{strict:true,formats:['svg','png','pdf']});
  assert.ok(!files['figure.svg'].toString().includes('<image'));
  assert.equal(files['figure.pdf'].subarray(0,5).toString(),'%PDF-');
  assert.throws(()=>composeComponents([{component:'document',id:'same'},{component:'document',id:'same'}]),/unique/);
  assert.throws(()=>createComponent('device',{id:'x',variant:'unknown'}),/variant/);
  assert.throws(()=>createSection({id:'x',x:0,y:0,width:10,height:10,layers:[{from:.9,to:.1}]}),/proportions/);
});
