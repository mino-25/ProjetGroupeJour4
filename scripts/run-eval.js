import { readFileSync, writeFileSync } from 'fs';
import { ragQuery } from '../rag-pipeline.js';

const questions = readFileSync('./questions-test.txt', 'utf-8')
  .split('\n')
  .filter(l => /^\d+\./.test(l.trim()))
  .map(l => l.replace(/^\d+\.\s*/, '').trim())
  .filter(Boolean);

async function main() {
  console.log(`Évaluation sur ${questions.length} questions...\n`);

  const rows = [];
  for (const [i, question] of questions.entries()) {
    console.log(`[${i + 1}/${questions.length}] ${question.slice(0, 60)}...`);
    const result = await ragQuery(question, { topK: 5, verbose: false });

    const top3Scores = result.chunks.slice(0, 3).map(c => c.score);
    const avgTop3 = top3Scores.length
      ? (top3Scores.reduce((a, b) => a + b, 0) / top3Scores.length).toFixed(2)
      : 0;

    rows.push({
      index: i + 1,
      question,
      topScore: result.metrics.topScore.toFixed(2),
      avgTop3,
      tokens: `${result.metrics.promptTokens}/${result.metrics.completionTokens}`,
      cost: result.metrics.costUSD.toFixed(6),
      latencyMs: result.metrics.retrievalMs + result.metrics.generationMs,
      answer: result.answer,
      sources: result.sources.map(s => s.file).join(', '),
      orphanCitations: result.metrics.orphanCitations.join(', ') || 'aucune',
    });
  }

  const totalCost = rows.reduce((s, r) => s + parseFloat(r.cost), 0).toFixed(6);
  const avgLatency = Math.round(rows.reduce((s, r) => s + r.latencyMs, 0) / rows.length);

  console.log('\n--- Résumé ---');
  console.log(`Coût total : $${totalCost}`);
  console.log(`Latence moyenne : ${avgLatency}ms`);
  console.log('\nRemplissez les colonnes Pertinence et Fidélité dans eval-table.md après relecture des réponses.');

  writeFileSync('./eval-results.json', JSON.stringify(rows, null, 2));
  console.log('Résultats bruts sauvegardés dans eval-results.json');
}

main().catch(console.error);
