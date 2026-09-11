import test from 'node:test';
import assert from 'node:assert/strict';
import { createIllustration, listIllustrations, illustrationProfile, inspectScene, renderScene } from '../src/index.js';

test('illustration family keeps its palette and stroke tiers at different scales',()=>{
  const colors=new Set([...Object.values(illustrationProfile.palette),'none']);
  assert.equal(listIllustrations().length,14);
  for(const {name} of listIllustrations())for(const scale of [0.5,1,2]){
    const elements=createIllustration(name,{id:'sample',x:10,y:20,scale});
    assert.ok(elements.length>0);
    assert.equal(new Set(elements.map(e=>e.id)).size,elements.length);
    for(const e of elements){assert.ok(colors.has(e.fill??'none'));assert.ok(colors.has(e.stroke??'none'));assert.ok([3,1.5].includes(e.strokeWidth));}
  }
});

test('all illustration components compose into an editable vector figure',async()=>{
  const elements=[];
  for(const [index,{name,width,height}]of listIllustrations().entries()){
    const scale=Math.min(140/width,140/height);
    elements.push(...createIllustration(name,{id:name,x:25+(index%5)*250,y:25+Math.floor(index/5)*215,scale}));
  }
  const scene={version:1,title:'Editorial illustration family',description:'Fourteen original vector components with shared styling.',width:1440,height:950,theme:'paper',sources:[{title:'Original local artwork',url:'https://example.org/fixture'}],panels:[{id:'sheet',x:52,y:150,width:1336,height:740,framed:false,elements}]};
  assert.deepEqual(inspectScene(scene).issues,[]);
  const {files}=await renderScene(scene,{formats:['svg','png','pdf'],strict:true});
  assert.ok(!files['figure.svg'].toString().includes('<image'));
  assert.equal(files['figure.pdf'].subarray(0,5).toString(),'%PDF-');
});

test('invalid illustration names, identifiers and placements fail explicitly',()=>{
  for(const [name,options]of [['missing',{id:'a'}],['person',{}],['person',{id:'../a'}],['person',{id:'a',scale:0}],['person',{id:'a',x:NaN}],['person',{id:'a',variant:'unknown'}]])assert.throws(()=>createIllustration(name,options));
  const first=createIllustration('person',{id:'borrower'});
  first[0].fill='#000000';
  assert.notEqual(createIllustration('person',{id:'borrower'})[0].fill,'#000000');
});
