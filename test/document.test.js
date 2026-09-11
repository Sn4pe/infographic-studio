import test from 'node:test';
import assert from 'node:assert/strict';
import { composeDocument, composeSpecification, inspectScene, renderScene, listLabels, assertDocument } from '../src/index.js';
import { routeConnections } from '../src/routing.js';
import { segmentIntersectsBox } from '../src/collisions.js';

const fixture = () => ({title:'Illustrated workflow',description:'Synthetic workflow fixture.',width:1600,sources:[{title:'Fixture',url:'https://example.org/fixture'}],sections:[{id:'flow',title:'Measure, process, store, review',layout:'cycle',items:['measure','process','store','review'].map((id,i)=>({id,component:['device','network','container','person'][i],title:id,description:'A complete explanation stays attached to its illustrated object.'})),relations:[{id:'a',from:'measure',to:'process'},{id:'b',from:'process',to:'store'},{id:'c',from:'store',to:'review'},{id:'d',from:'review',to:'measure'}]}]});

test('semantic objects retain all content, draw a closed cycle and render without layout findings',async()=>{
  const input=fixture(), before=structuredClone(input), scene=composeSpecification({document:input});
  assert.deepEqual(input,before);
  assert.deepEqual(inspectScene(scene).issues,[]);
  const labels=listLabels(scene);
  for(const item of input.sections[0].items){assert.equal(labels[`${item.id}-title`],item.title);assert.equal(labels[`${item.id}-description`],item.description);}
  const arrows=scene.panels[0].elements.filter(e=>e.type==='arrow');
  assert.equal(arrows.length,4);
  assert.ok(arrows.some(e=>e.y2<e.y),'Closing edge must travel back upwards');
  const {files}=await renderScene(scene,{strict:true,formats:['svg','png','pdf']});
  assert.ok(files['figure.svg'].includes('data-label="true"'));
  assert.equal(files['figure.pdf'].subarray(0,5).toString(),'%PDF-');
});

test('longer descriptions grow rows and move later sections without shrinking or losing words',()=>{
  const input=fixture();
  input.sections.push({id:'next',title:'Next section',layout:'row',items:[{id:'last',component:'document',title:'Final record'}]});
  const before=composeDocument(input);
  const expanded='An additional observation must remain complete. '.repeat(12);
  input.sections[0].items[0].description=expanded;
  const after=composeDocument(input);
  assert.ok(after.height>before.height);
  assert.ok(after.panels[1].y>before.panels[1].y);
  assert.equal(listLabels(after)['measure-description'],expanded);
  assert.equal(after.panels[0].elements.find(e=>e.id==='measure-description').fontSize,26);
  assert.deepEqual(inspectScene(after).issues,[]);
  assert.throws(()=>composeDocument({...input,height:before.height}),/needs .* height/);
});

test('row, column and grid preserve objects, reject ambiguous semantics and fail clearly on impossible fit',()=>{
  for(const layout of ['row','column','grid']){
    const input=fixture();input.sections[0].layout=layout;
    assert.deepEqual(inspectScene(composeDocument(input)).issues,[]);
  }
  for(const change of [d=>d.sections[0].items[0].id='process',d=>d.sections[0].relations[0].to='missing',d=>d.sections[0].relations[0].to='measure',d=>d.sections[0].items[0].component='unknown',d=>d.sections[0].items[0].x=5,d=>d.sections[0].columns=3,d=>d.sections[0].items[0].title='W'.repeat(100)]){
    const input=fixture();change(input);assert.throws(()=>composeDocument(input));
  }
  assert.throws(()=>composeSpecification({document:fixture(),placements:[]}),/only document/);
});

test('routing skips an unrelated middle object and uses explicit endpoints without inventing edges',()=>{
  const objects=[{id:'left',x:40,y:80,width:150,height:100},{id:'middle',x:260,y:60,width:150,height:160},{id:'right',x:480,y:80,width:150,height:100}];
  const area={x:10,y:10,width:660,height:250};
  assert.deepEqual(routeConnections(objects,[],area),[]);
  const segments=routeConnections(objects,[{id:'across',from:'left',to:'right'}],area);
  assert.equal(segments.filter(e=>e.type==='arrow').length,1);
  assert.ok(segments.length>=3);
  for(const e of segments)assert.equal(segmentIntersectsBox([e.x,e.y],[e.x2,e.y2],{x:260,y:60,w:150,h:160}),false);
});

test('narrow objects switch to stacked titles, and schema feedback aggregates independent input mistakes',()=>{
  const input=fixture();input.sections[0].layout='row';
  input.sections[0].items[0].title='Conversaciones';
  input.sections[0].items.push({id:'extra',title:'Another object',component:'document'});
  const scene=composeDocument(input);
  assert.deepEqual(inspectScene(scene).issues,[]);
  const title=scene.panels[0].elements.find(e=>e.id==='measure-title');
  const art=scene.panels[0].elements.find(e=>e.artworkId==='measure-art'&&e.artworkBounds).artworkBounds;
  assert.equal(title.x,art.x);assert.ok(title.y>=art.y+art.height);
  input.sources=['https://example.org/fixture'];
  input.sections[0].items[0].variant='warm';
  assert.throws(()=>assertDocument(input),error=>error.message.includes('/sources/0')&&error.message.includes('/sections/0/items/0/variant'));
});
