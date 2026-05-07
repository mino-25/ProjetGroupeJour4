import 'dotenv/config';
import { retrieveContext } from './retrieval.js';
import { generateCompletion } from './generation.js';
import { CONFIG } from './config.js';

export async function ragQuery(question, options = {}) {
  const { topK = CONFIG.topK, threshold = CONFIG.scoreThreshold, verbose = false } = options;
  const t0 = Date.now();

  if (verbose) {
    console.log(`\n[ragQuery] question="${question.slice(0, 60)}..."`);
  }

  const t1 = Date.now();
  const chunks = await retrieveContext(question, topK, threshold);
  const retrievalMs = Date.now() - t1;

  if (verbose) {
    const topScore = chunks[0]?.score ?? 0;
    const avgScore = chunks.length
      ? chunks.reduce((s, c) => s + c.score, 0) / chunks.length
      : 0;
    console.log(
      `[retrieve] topK=${chunks.length} retournés en ${retrievalMs}ms, top score ${topScore.toFixed(2)}, avg score ${avgScore.toFixed(2)}`
    );
    chunks.forEach(c =>
      console.log(`  [${c.score.toFixed(2)}] ${c.source}, "${c.text.slice(0, 60)}..."`)
    );
  }

  const t2 = Date.now();
  let answer, usage;
  try {
    const result = await generateCompletion(question, chunks);
    answer = result.answer;
    usage = result.usage;
  } catch (error) {
    // Si la récupération a réussi mais pas la génération, afficher les sources disponibles
    if (chunks.length > 0) {
      answer = `Erreur lors de la génération de la réponse: ${error.message}\n\nSources trouvées (${chunks.length}) :\n${chunks.map((c, i) => `${i + 1}. ${c.source} (score: ${c.score.toFixed(2)})`).join('\n')}`;
    } else {
      answer = `Erreur: ${error.message}`;
    }
    usage = { prompt_tokens: 0, completion_tokens: 0 };
  }
  const generationMs = Date.now() - t2;

  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const costUSD = ((promptTokens + completionTokens) / 1_000_000) * CONFIG.costPerMillionTokens;

  if (verbose) {
    console.log(
      `[generate] ${CONFIG.model}, ${promptTokens} tokens in / ${completionTokens} tokens out, ${generationMs}ms, $${costUSD.toFixed(6)}`
    );
    console.log(`[ragQuery] total ${Date.now() - t0}ms`);
  }

  const sources = Object.values(
    chunks.reduce((acc, c, i) => {
      const key = c.source;
      if (!acc[key] || c.score > acc[key].relevance) {
        acc[key] = { index: i + 1, file: c.source, relevance: parseFloat(c.score.toFixed(2)) };
      }
      return acc;
    }, {})
  );

  const citedIndices = answer && typeof answer === 'string'
    ? [...answer.matchAll(/\[Source (\d+)\]/g)].map(m => parseInt(m[1], 10))
    : [];
  const validIndices = new Set(chunks.map((_, i) => i + 1));
  const orphanCitations = [...new Set(citedIndices.filter(n => !validIndices.has(n)))];

  const metrics = {
    topScore: chunks[0]?.score ?? 0,
    avgScore: chunks.length
      ? parseFloat((chunks.reduce((s, c) => s + c.score, 0) / chunks.length).toFixed(2))
      : 0,
    retrievalMs,
    generationMs,
    promptTokens,
    completionTokens,
    costUSD: parseFloat(costUSD.toFixed(6)),
    orphanCitations,
  };

  return { answer, sources, chunks, metrics, chunksUsed: chunks.length };
}
