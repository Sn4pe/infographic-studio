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

test('architecture groups create editable layers and labelled relationships without reverting to an icon row',()=>{
  const input={
    title:'Retrieval architecture',description:'Synthetic layered architecture fixture.',width:1600,
    sources:[{title:'Fixture',url:'https://example.org/fixture'}],
    sections:[{id:'system',title:'Retrieve grounded context',layout:'architecture',items:[
      {id:'api',component:'device',title:'Chat API',description:'Receives the question.'},
      {id:'router',component:'network',title:'Query router',description:'Chooses the retrieval path.'},
      {id:'vectors',component:'grid',title:'Vector store',description:'Returns similar passages.'},
      {id:'graph',component:'network',title:'Knowledge graph',description:'Expands related entities.'}
    ],groups:[
      {id:'experience',title:'Experience layer',items:['api','router']},
      {id:'knowledge',title:'Knowledge layer',items:['vectors','graph']}
    ],relations:[
      {id:'api-router',from:'api',to:'router',label:'question'},
      {id:'router-vectors',from:'router',to:'vectors',label:'vector search'},
      {id:'router-graph',from:'router',to:'graph',label:'entity expansion'}
    ]}]
  };
  const scene=composeDocument(input), panel=scene.panels[0];
  assert.deepEqual(inspectScene(scene).issues,[]);
  assert.ok(panel.elements.some(element=>element.id==='experience-band'));
  assert.ok(panel.elements.some(element=>element.id==='knowledge-band'));
  assert.equal(panel.elements.find(element=>element.id==='experience-heading').text,'Experience layer');
  assert.match(panel.elements.find(element=>element.id==='system-relations').text,/router → vectors: vector search/);
  assert.ok(panel.elements.find(element=>element.id==='knowledge-band').y > panel.elements.find(element=>element.id==='experience-band').y);
});

test('architecture cards calculate local text space and validate long labels without manual placement', () => {
  const input = {
    title: 'Long-form architecture', description: 'A synthetic fit test.', width: 1600,
    sources: [{ title: 'Fixture', url: 'https://example.org/fixture' }],
    sections: [{ id: 'system', title: 'Cards reserve their own content area', layout: 'architecture', groups: [
      { id: 'entry', title: 'Ingress', items: ['gateway'] },
      { id: 'execution', title: 'Execution', items: ['executor', 'sandbox'] }
    ], items: [
      { id: 'gateway', component: 'device', title: 'Reverse proxy and API gateway', description: 'Accepts browser, command-line and meeting-transcription requests before dispatch.' },
      { id: 'executor', component: 'person', title: 'Session executor', description: 'Runs the language-model and tool loop in a sequence that can take several steps.' },
      { id: 'sandbox', component: 'container', title: 'KVM sandbox', description: 'Contains tool access, files and isolated execution resources for each session.' }
    ], relations: [{ id: 'dispatch', from: 'gateway', to: 'executor' }, { id: 'isolate', from: 'executor', to: 'sandbox' }] }]
  };
  const scene = composeDocument(input);
  const panel = scene.panels[0];
  for (const id of ['gateway', 'executor', 'sandbox']) {
    assert.ok(panel.elements.some(element => element.id === `${id}-card`));
    assert.equal(panel.elements.find(element => element.id === `${id}-title`).container, `${id}-card`);
  }
  assert.deepEqual(inspectScene(scene).issues, []);
});

test('architecture routes skip intermediate cards through a generated layer corridor', () => {
  const document = {
    title: 'Route corridor', description: 'Synthetic routing fixture.', width: 1800,
    sources: [{ title: 'Fixture', url: 'https://example.org/fixture' }],
    sections: [{ id: 'system', title: 'A layer has an intermediate card', layout: 'architecture', groups: [
      { id: 'top', title: 'Top layer', items: ['source', 'middle', 'target'] },
      { id: 'bottom', title: 'Bottom layer', items: ['sink'] }
    ], items: [
      { id: 'source', component: 'device', title: 'Source', description: 'Starts the link.' },
      { id: 'middle', component: 'container', title: 'Intermediate', description: 'Must remain unobstructed.' },
      { id: 'target', component: 'device', title: 'Target', description: 'Receives the link.' },
      { id: 'sink', component: 'document', title: 'Sink', description: 'Completes the layer contract.' }
    ], relations: [{ id: 'skip-middle', from: 'source', to: 'target' }] }]
  };
  const scene = composeDocument(document);
  const segments = scene.panels[0].elements.filter(element => element.id.startsWith('skip-middle-segment-'));
  assert.equal(segments.length, 3);
  assert.equal(segments[0].type, 'line');
  assert.equal(segments[2].type, 'arrow');
  assert.ok(segments[1].y > scene.panels[0].elements.find(element => element.id === 'middle-card').y + scene.panels[0].elements.find(element => element.id === 'middle-card').height);
  assert.deepEqual(inspectScene(scene).issues, []);
});

test('architecture distributes adjacent-layer links across generated corridor lanes', () => {
  const document = {
    title: 'Route lanes', description: 'Synthetic routing fixture.', width: 1800,
    sources: [{ title: 'Fixture', url: 'https://example.org/fixture' }],
    sections: [{ id: 'system', title: 'Several links share one layer transition', layout: 'architecture', groups: [
      { id: 'top', title: 'Top layer', items: ['first', 'second', 'third'] },
      { id: 'bottom', title: 'Bottom layer', items: ['target'] }
    ], items: [
      { id: 'first', component: 'device', title: 'First', description: 'Starts a link.' },
      { id: 'second', component: 'device', title: 'Second', description: 'Starts a link.' },
      { id: 'third', component: 'device', title: 'Third', description: 'Starts a link.' },
      { id: 'target', component: 'container', title: 'Target', description: 'Receives the links.' }
    ], relations: [{ id: 'first-target', from: 'first', to: 'target' }, { id: 'second-target', from: 'second', to: 'target' }, { id: 'third-target', from: 'third', to: 'target' }] }]
  };
  const scene = composeDocument(document);
  const lanes = ['first-target', 'second-target', 'third-target'].map(id => scene.panels[0].elements.find(element => element.id === `${id}-segment-2`).y);
  assert.equal(new Set(lanes).size, 3);
  assert.deepEqual(inspectScene(scene).issues, []);
});

test('architecture overview preserves the semantic graph while routing only one declared journey', () => {
  const document = {
    title: 'Overview grammar', description: 'A synthetic overview fixture.', width: 1600,
    sources: [{ title: 'Fixture', url: 'https://example.org/fixture' }],
    sections: [{ id: 'system', title: 'One readable path through a complete system', layout: 'architecture-overview', groups: [
      { id: 'entry', title: 'Entry', items: ['client'] },
      { id: 'control', title: 'Control', items: ['api', 'store', 'scheduler'] },
      { id: 'node', title: 'Node', items: ['agent'] }
    ], items: [
      { id: 'client', component: 'person', title: 'Client' },
      { id: 'api', component: 'device', title: 'API' },
      { id: 'store', component: 'grid', title: 'Store' },
      { id: 'scheduler', component: 'network', title: 'Scheduler' },
      { id: 'agent', component: 'container', title: 'Node agent' }
    ], relations: [
      { id: 'client-api', from: 'client', to: 'api' },
      { id: 'api-store', from: 'api', to: 'store' },
      { id: 'api-scheduler', from: 'api', to: 'scheduler' },
      { id: 'api-agent', from: 'api', to: 'agent' }
    ], journey: ['client-api', 'api-agent'] }]
  };
  const scene = composeDocument(document);
  const elements = scene.panels[0].elements;
  assert.ok(elements.some(element => element.id === 'store-card'));
  assert.ok(elements.some(element => element.id === 'scheduler-card'));
  assert.ok(elements.some(element => element.id.startsWith('client-api-segment-')));
  assert.ok(elements.some(element => element.id.startsWith('api-agent-segment-')));
  assert.ok(!elements.some(element => element.id.startsWith('api-store-segment-')));
  assert.ok(!elements.some(element => element.id.startsWith('api-scheduler-segment-')));
  assert.deepEqual(inspectScene(scene).issues, []);
  document.sections[0].journey = ['client-api', 'api-store', 'api-agent'];
  assert.throws(() => composeDocument(document), /continuous directed path/);
});
