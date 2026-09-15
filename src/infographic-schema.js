import Ajv from 'ajv';
import { readFileSync } from 'node:fs';

const schema = JSON.parse(readFileSync(new URL('../schema/infographic.schema.json', import.meta.url), 'utf8'));
const sceneSchema = JSON.parse(readFileSync(new URL('../schema/scene.schema.json', import.meta.url), 'utf8'));
const validate = new Ajv({ allErrors: true, strictRequired: false, schemas: [sceneSchema] }).compile(schema);

export function assertInfographic(infographic) {
  if (!validate(infographic)) throw new Error('Invalid infographic:\n' + validate.errors.map(error => `  ${error.instancePath || '/'}: ${error.message}`).join('\n'));
}
