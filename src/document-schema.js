import Ajv from 'ajv';
import { readFileSync } from 'node:fs';
const read=name=>JSON.parse(readFileSync(new URL(`../schema/${name}.schema.json`,import.meta.url),'utf8'));
const validate=new Ajv({allErrors:true,strictRequired:false}).addSchema(read('scene')).compile(read('document'));
export function assertDocument(document) {
  if(!validate(document))throw new Error('Invalid document:\n'+validate.errors.filter(e=>e.keyword!=='if').map(e=>`  ${e.instancePath||'/'}: ${e.message}${e.params.allowedValues?` (${e.params.allowedValues.join(', ')})`:e.keyword==='const'?` (${e.params.allowedValue})`:''}`).join('\n'));
}
