import 'dotenv/config';
import { readFileSync } from 'fs';
import { ragQuery } from '../rag-pipeline.js';

const questions = readFileSync('./questions-test.txt', 'utf-8')
  .split('\n')
  .filter(l => /^\d+\./.test(l.trim()))
  .map(l => l.replace(/^\d+\.\s*/, '').trim())
  .filter(Boolean);

const VARIANTS = [
  { label: 'baseline',           topK: 5,  threshold: 0.5 },
  { label: 'topK=1',             topK: 1,  threshold: 0.5 },
  { label: 'topK=10',            topK: 10, threshold: 0.5 },
  { label: 'threshold=0.3',      topK: 5,  threshold: 0.3 },
  { label: 'threshold=0.7',      topK: 5,  threshold: 0.7 },
];

async function runVariant(variant) {
  const rows = [];
  for (const question of questions) {
    const result = await ragQuery(question, { topK: variant.topK, verbose: false });
    rows.push({
      question: question.slice(0, 50),
      topScore: result.metrics.topScore.toFixed(2),
      avgScore: result.metrics.avgScore.toFixed(2),
      chunksReturned: result.chunks.length,
      costUSD: result.metrics.costUSD,
      latencyMs: result.metrics.retrievalMs + result.metrics.generationMs,
    });
  }
  return rows;
}

async function main() {
  console.log('Audit du retrieval - comparaison des variantes\n');
  console.log(`Questions : ${questions.length}`);
  console.log(`Variantes : ${VARIANTS.map(v => v.label).join(', ')}\n`);

  for (const variant of VARIANTS) {
    console.log(`--- ${variant.label} ---`);
    const rows = await runVariant(variant);
    const avgTop = (rows.reduce((s, r) => s + parseFloat(r.topScore), 0) / rows.length).toFixed(2);
    const avgLatency = Math.round(rows.reduce((s, r) => s + r.latencyMs, 0) / rows.length);
    const totalCost = rows.reduce((s, r) => s + r.costUSD, 0).toFixed(6);
    console.log(`  avg top-1 score : ${avgTop}`);
    console.log(`  latence moyenne : ${avgLatency}ms`);
    console.log(`  coût total      : $${totalCost}`);
    console.log();
  }

  console.log('Identifiez 2 régressions et ajoutez-les dans eval-table.md avec leur explication.');
}

main().catch(console.error);
