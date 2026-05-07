import 'dotenv/config';
import readline from 'readline';
import { ragQuery } from './rag-pipeline.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

process.on('SIGINT', () => {
  console.log('\nAu revoir !');
  rl.close();
  process.exit(0);
});

function ask(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function main() {
  console.log('Mini-Perplexity - posez vos questions sur le corpus (Ctrl+C pour quitter)\n');

  while (true) {
    const question = await ask('> ');

    if (!question.trim()) continue;

    if (question.trim().length > 5000) {
      console.log('Question trop longue (max 5000 caractères).\n');
      continue;
    }

    console.log('Recherche en cours...');
    try {
      const result = await ragQuery(question, { topK: 5, verbose: false });
      console.log(`\n${result.answer}`);
      if (result.sources.length > 0) {
        console.log(`\nSources : [${result.sources.map(s => s.file).join(', ')}]`);
        console.log(`Pertinence moyenne : ${result.metrics.avgScore.toFixed(2)}`);
      }
      console.log();
    } catch (err) {
      console.error(`Erreur : ${err.message}\n`);
    }
  }
}

main();
