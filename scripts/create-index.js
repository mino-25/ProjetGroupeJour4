import { Pinecone } from '@pinecone-database/pinecone';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';
import { CONFIG } from '../config.js';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

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

async function embedBatch(texts) {
  const response = await fetch('https://api.mistral.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CONFIG.embedModel,
      input: texts,
    }),
  });
  const data = await response.json();
  return data.data.map(d => d.embedding);
}

async function embedAndIndex(chunks, indexName) {
  const index = pinecone.index(indexName);
  const vectors = [];

  for (let i = 0; i < chunks.length; i += CONFIG.embedConcurrency) {
    const batch = chunks.slice(i, i + CONFIG.embedConcurrency);
    const texts = batch.map(c => c.text);
    const embeddings = await embedBatch(texts);
    for (let j = 0; j < batch.length; j++) {
      vectors.push({
        id: `${batch[j].filename}-chunk-${batch[j].chunkIndex}`,
        values: embeddings[j],
        metadata: {
          text: batch[j].text,
          source: batch[j].filename,
          chunkIndex: batch[j].chunkIndex,
        },
      });
    }
  }

  for (let i = 0; i < vectors.length; i += CONFIG.batchSize) {
    const batch = vectors.slice(i, i + CONFIG.batchSize);
    await index.upsert(batch);
    console.log(`  Upsert ${Math.min(i + CONFIG.batchSize, vectors.length)}/${vectors.length} vecteurs...`);
  }

  return vectors.length;
}

async function main() {
  const INDEX_NAME = process.env.PINECONE_INDEX_NAME;
  const CORPUS_DIR = './corpus';

  console.log('Chargement du corpus...');
  const docs = loadCorpus(CORPUS_DIR);
  console.log(`${docs.length} fichiers trouvés`);

  let allChunks = [];
  for (const doc of docs) {
    const rawChunks = chunkWithOverlap(doc.text, CONFIG.chunkSize, CONFIG.overlap);
    const chunks = rawChunks.map((text, i) => ({
      text,
      filename: doc.filename,
      chunkIndex: i,
    }));
    console.log(`  ${doc.filename} → ${chunks.length} chunks`);
    allChunks = allChunks.concat(chunks);
  }

  console.log(`\nTotal : ${allChunks.length} chunks créés`);
  console.log(`\nIndexation dans "${INDEX_NAME}"...`);

  const total = await embedAndIndex(allChunks, INDEX_NAME);
  console.log(`\nIndexation terminée : ${total} vecteurs dans l'index "${INDEX_NAME}"`);
}

main().catch(console.error);
