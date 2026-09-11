import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { inspectScene, renderScene, listIcons } from '../src/index.js';
import { getIcon, decodeOutlineSvg, renderIcon } from '../src/icons.js';

const sample = () => ({version:1,title:'A consistent visual family',description:'Two outline icons and an editable label.',width:800,height:500,theme:'paper',sources:[{title:'Tabler Icons',url:'https://github.com/tabler/tabler-icons'}],panels:[{id:'body',x:52,y:150,width:696,height:280,framed:false,elements:[
  {id:'wallet',type:'icon',icon:'tabler/wallet',x:40,y:50,width:96,height:96,stroke:'$secondary',strokeWidth:3},
  {id:'credential',type:'icon',icon:'tabler/id-badge-2',x:350,y:50,width:72,height:72,stroke:'$secondary',strokeWidth:3},
  {id:'label',type:'text',text:'Wallet and credentials',x:40,y:190,width:500,fontSize:24}
]}]});

test('bundled icons have pinned sources, searchable tags and isolated metadata', () => {
  const icons = listIcons();
  assert.equal(icons.length,17);
  assert.ok(listIcons('payment').some(i=>i.name==='tabler/wallet'));
  for(const icon of icons){assert.equal(icon.family,'tabler-outline');assert.equal(icon.license,'MIT');assert.match(icon.revision,/^[a-f0-9]{40}$/);assert.match(icon.hash,/^[a-f0-9]{64}$/);assert.ok(getIcon(icon.name).paths.length);}
  const copy=getIcon('tabler/wallet');copy.paths.length=0;
  assert.ok(getIcon('tabler/wallet').paths.length);
  assert.throws(()=>getIcon('tabler/../../wallet'));
});

test('outline decoder rejects active content, unexpected attributes and non-path markup', async () => {
  const svg=await readFile(new URL('../assets/icons/tabler/wallet.svg',import.meta.url),'utf8');
  assert.ok(decodeOutlineSvg(svg).length);
  for(const bad of [svg.replace('<svg','<svg onload="alert(1)"'),svg.replace('</svg>','<script>alert(1)</script></svg>'),svg.replace('<path d=','<path transform="scale(2)" d='),svg.replace('</svg>','<image href="https://example.org/a.png"/></svg>'),svg.replace('M17','&entity;'),svg.replace('width="24"','width="24" width="24"')]) assert.throws(()=>decodeOutlineSvg(bad));
});

test('scene checks reject unknown icons, clipping and inconsistent filled style', () => {
  const scene=sample();assert.deepEqual(inspectScene(scene).issues,[]);
  const icon=scene.panels[0].elements[0];
  icon.icon='tabler/missing';assert.ok(inspectScene(scene).issues.some(i=>i.code==='unknown-icon'));
  icon.icon='tabler/wallet';icon.fill='#000000';icon.x=-1;
  const codes=inspectScene(scene).issues.map(i=>i.code);
  assert.ok(codes.includes('icon-style'));assert.ok(codes.includes('icon-bounds'));
});

test('different icon sizes keep the same stroke weight in scene coordinates', () => {
  for(const size of [48,96,240]){
    const svg=renderIcon({icon:'tabler/wallet',x:10,y:10,width:size,height:size,strokeWidth:3},'#123456');
    const scale=Number(svg.match(/scale\(([^)]+)\)/)[1]);
    const width=Number(svg.match(/stroke-width="([^"]+)"/)[1]);
    assert.equal(scale*width,3);
  }
});

test('icons export as PDF vector paths with editable text and complete license notices', async () => {
  const result=await renderScene(sample(),{strict:true});
  const svg=result.files['figure.svg'].toString();
  assert.ok(svg.includes('data-icon="tabler/wallet"'));
  assert.ok(!svg.includes('<image'));
  assert.ok(svg.includes('MIT License'));
  assert.ok(result.files['credits.txt'].toString().includes('Permission is hereby granted'));
  assert.equal(result.report.icons.length,2);
  const task=getDocument({data:new Uint8Array(result.files['figure.pdf']),useSystemFonts:false,verbosity:0});
  try{
    const doc=await task.promise;const page=await doc.getPage(1);
    assert.ok((await page.getTextContent()).items.some(i=>i.str.includes('Wallet and credentials')));
    const ops=await page.getOperatorList();
    assert.ok(!ops.fnArray.includes(OPS.paintImageXObject));
    assert.ok(!ops.fnArray.includes(OPS.paintInlineImageXObject));
  }finally{await task.destroy();}
});
