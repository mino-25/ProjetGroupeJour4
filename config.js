export const CONFIG = {
  chunkSize: 400,
  overlap: 50,
  batchSize: 50,
  embedConcurrency: 5,
  topK: 5,
  scoreThreshold: 0.5,
  model: 'mistral-tiny', // Changé de 'mistral-small-latest' pour éviter les quotas
  embedModel: 'mistral-embed',
  costPerMillionTokens: 0.10,
  demoMode: true, // Mode démo sans API externe
};
