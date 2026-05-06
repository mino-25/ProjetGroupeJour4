import { Pinecone } from '@pinecone-database/pinecone';
import 'dotenv/config';
import { CONFIG } from './config.js';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

async function embedText(text) {
  const response = await fetch('https://api.mistral.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CONFIG.embedModel,
      input: [text],
    }),
  });
  const data = await response.json();
  return data.data[0].embedding;
}

export async function retrieveContext(query, topK = CONFIG.topK) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const queryVector = await embedText(query);
  const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

  const results = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  return results.matches
    .filter(match => match.score >= CONFIG.scoreThreshold)
    .map(match => ({
      text: match.metadata.text,
      source: match.metadata.source ?? 'Source inconnue',
      score: match.score,
      chunkIndex: match.metadata.chunkIndex,
    }));
}
