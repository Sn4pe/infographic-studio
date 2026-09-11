import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createComponent, composeSpecification, inspectScene, composeSvg, assertScene } from '../src/index.js';
import { segmentIntersectsBox } from '../src/collisions.js';

const label = () => ({id:'label',type:'text',x:110,y:110,width:170,text:'Sample label',fontSize:20});
const drawing = () => createComponent('device',{id:'device',x:100,y:100,width:100,height:100});
const scene = elements => ({version:1,title:'Layout fixture',description:'Synthetic layout test.',width:800,height:600,theme:'paper',sources:[{title:'Test fixture',url:'https://example.org/fixture'}],panels:[{id:'panel',x:52,y:150,width:696,height:380,elements}]});
const codes = elements => inspectScene(scene(elements)).issues.map(i=>i.code);
const edge = options => ({id:'edge',type:'arrow',x:20,y:150,x2:300,y2:150,stroke:'$ink',...options});
const specification = () => ({scene:scene([label()]),placements:[{panel:'panel',component:'device',id:'device',x:100,y:100,width:100,height:100}]});

test('component/text collisions are detected in either paint order without treating earlier backgrounds as obstacles',()=>{
  for(const elements of [[label(),...drawing()],[...drawing(),label()]])assert.ok(codes(elements).includes('label-artwork-overlap'));
  const background={id:'background',type:'rect',x:10,y:10,width:350,height:300,fill:'$panel'};
  assert.deepEqual(codes([background,label()]),[]);
  assert.ok(codes([label(),background]).includes('label-occluded'));
  assert.deepEqual(codes([label(),{...background,opacity:0}]),[]);
  assert.ok(codes([label(),...drawing().map(({artworkId,artworkBounds,...e})=>e)]).includes('label-occluded'));
});

test('straight connectors avoid labels and illustrations while allowing endpoint attachments',()=>{
  assert.ok(codes([label(),edge({y:122,y2:122})]).includes('connector-label-crossing'));
  assert.ok(codes([...drawing(),edge()]).includes('connector-artwork-crossing'));
  assert.deepEqual(codes([...drawing(),edge({x2:100})]),[]);
  assert.deepEqual(codes([...drawing(),edge({type:'line',geometryRole:'illustration'})]),[]);
  assert.ok(codes([label(),edge({type:'line',geometryRole:'illustration',y:122,y2:122})]).includes('connector-label-crossing'));
  assert.throws(()=>assertScene(scene([edge({geometryRole:'illustration'})])),/Invalid scene/);
  assert.equal(segmentIntersectsBox([0,0],[100,100],{x:70,y:10,w:20,h:20}),false);
  assert.equal(segmentIntersectsBox([0,0],[100,100],{x:40,y:40,w:20,h:20}),true);
  assert.ok(codes([label(),{id:'route',type:'path',d:'M20 122 h300 v100',stroke:'$ink'}]).includes('connector-label-crossing'));
});

test('artwork metadata is mandatory per group, unique and bounded, and never changes rendered SVG',()=>{
  const parts=drawing(), plain=parts.map(({artworkId,artworkBounds,...e})=>e);
  assert.equal(composeSvg(scene(parts)),composeSvg(scene(plain)));
  assert.ok(codes(parts.map(({artworkBounds,...e})=>e)).includes('artwork-metadata'));
  parts[1].artworkBounds={...parts[0].artworkBounds};
  assert.ok(codes(parts).includes('artwork-metadata'));
  delete parts[1].artworkBounds;
  parts[0].artworkBounds.x=-10;
  assert.ok(codes(parts).includes('artwork-bounds'));
  assert.equal(inspectScene(scene([])).visualReview,'required');
});

test('data-only composition preserves the authored layout and rejects invalid host instructions',()=>{
  const input=specification(), before=structuredClone(input), result=composeSpecification(input);
  assert.deepEqual(input,before);
  assert.deepEqual(result.panels[0].elements,[label(),...drawing()]);
  assert.ok(inspectScene(result).issues.some(i=>i.code==='label-artwork-overlap'),'Compiler must not silently repair a bad layout');
  assert.throws(()=>composeSpecification({...input,command:'anything'}),/only scene/);
  for(const patch of [{panel:'missing'},{width:undefined},{width:-1},{component:'unknown'},{id:'bad id'},{script:'anything'}]){
    assert.throws(()=>composeSpecification({...input,placements:[{...input.placements[0],...patch}]}));
  }
  assert.throws(()=>composeSpecification({...input,placements:[input.placements[0],input.placements[0]]}),/duplicate/);
});

test('CLI composes JSON without overwriting files and strict check rejects the resulting collision',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'studio-compose-'));
  try {
    const input=join(dir,'input.json'), output=join(dir,'scene.json');
    await writeFile(input,JSON.stringify(specification()));
    const cli=fileURLToPath(new URL('../bin/cli.js',import.meta.url));
    const run=(...args)=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
    assert.equal(run('compose',input,'--out',output).status,0);
    const original=await readFile(output,'utf8');
    assert.equal(run('compose',input,'--out',output).status,1);
    assert.equal(await readFile(output,'utf8'),original);
    const check=run('check',output,'--strict','--json');
    assert.equal(check.status,1);
    assert.ok(JSON.parse(check.stdout).issues.some(i=>i.code==='label-artwork-overlap'));
  } finally { await rm(dir,{recursive:true,force:true}); }
});
