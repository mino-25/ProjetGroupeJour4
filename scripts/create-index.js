import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { CONFIG } from '../config.js';

function chunkWithOverlap(text, chunkSize, overlap) {
  if (overlap >= chunkSize) {
    throw new Error(`overlap (${overlap}) doit être inférieur à chunkSize (${chunkSize})`);
  }
  const words = text.split(' ');
  if (words.length === 0) return [];
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ').trim();
    if (chunk.length > 0) chunks.push(chunk);
    i += chunkSize - overlap;
  }
  return chunks;
}

function loadCorpus(dir) {
  return readdirSync(dir)
    .filter(f => f.endsWith('.txt') || f.endsWith('.md'))
    .map(f => ({
      filename: f,
      text: readFileSync(join(dir, f), 'utf-8'),
    }));
}

// TODO Phase 3 : async function embedBatch(texts) { ... }
// TODO Phase 3 : async function embedAndIndex(chunks, indexName) { ... }
// TODO Phase 3 : async function main() { ... }

export { chunkWithOverlap, loadCorpus };
