import { Pinecone } from '@pinecone-database/pinecone';
import 'dotenv/config';
import { CONFIG } from './config.js';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// Données mock pour la démonstration
const mockChunks = [
  {
    text: "L'intelligence artificielle (IA) est un domaine de l'informatique qui vise à créer des machines capables de simuler l'intelligence humaine.",
    source: "intelligence-artificielle.txt",
    score: 0.89,
    chunkIndex: 0,
  },
  {
    text: "L'apprentissage automatique est une branche de l'IA qui permet aux ordinateurs d'apprendre sans être explicitement programmés.",
    source: "intelligence-artificielle.txt",
    score: 0.85,
    chunkIndex: 1,
  },
  {
    text: "Node.js est un environnement d'exécution JavaScript côté serveur basé sur le moteur V8 de Google Chrome.",
    source: "nodejs-programmation.txt",
    score: 0.78,
    chunkIndex: 0,
  },
  {
    text: "L'histoire de l'informatique moderne commence au milieu du XXe siècle avec l'invention des premiers ordinateurs électroniques.",
    source: "histoire-informatique.txt",
    score: 0.76,
    chunkIndex: 0,
  },
  {
    text: "Les algorithmes et structures de données sont les fondements de l'informatique.",
    source: "algorithmes-structures.txt",
    score: 0.74,
    chunkIndex: 0,
  },
];

async function embedText(text) {
  if (CONFIG.demoMode) {
    // Simulation d'embedding en mode démo
    return new Array(1536).fill(0).map(() => Math.random());
  }

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

export async function retrieveContext(query, topK = CONFIG.topK, threshold = CONFIG.scoreThreshold) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  if (CONFIG.demoMode) {
    // Mode démo : retourner des chunks mockés filtrés par seuil
    const filtered = mockChunks
      .filter(chunk => chunk.score >= threshold)
      .slice(0, topK);
    return filtered;
  }

  try {
    const queryVector = await embedText(query);
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

    const results = await index.query({
      vector: queryVector,
      topK,
      includeMetadata: true,
    });

    return (results.matches || [])
      .filter(match => match.score >= threshold)
      .map(match => ({
        text: match.metadata?.text ?? '',
        source: match.metadata?.source ?? 'Source inconnue',
        score: match.score,
        chunkIndex: match.metadata?.chunkIndex,
      }));
  } catch (error) {
    console.error(`Erreur lors de la récupération: ${error.message}`);
    return [];
  }
}
