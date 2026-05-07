import 'dotenv/config';
import readline from 'readline';
import { ragQuery } from './rag-pipeline.js';
import { CONFIG } from './config.js';

const args = process.argv.slice(2);
const options = parseArgs(args);
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
  console.log(`Mini-Perplexity - posez vos questions sur le corpus (Ctrl+C pour quitter)`);
  console.log(`Configuration : topK=${options.topK}, threshold=${options.threshold}, verbose=${options.verbose}\n`);

  while (true) {
    const question = await ask('> ');

    if (!question.trim()) continue;
    if (question.trim().toLowerCase() === 'exit' || question.trim().toLowerCase() === 'quit') {
      break;
    }

    if (question.trim().length > 5000) {
      console.log('Question trop longue (max 5000 caractères).\n');
      continue;
    }

    console.log('Recherche en cours...');
    try {
      const result = await ragQuery(question, {
        topK: options.topK,
        threshold: options.threshold,
        verbose: options.verbose,
      });

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

  rl.close();
}

function parseArgs(args) {
  const options = {
    topK: CONFIG.topK,
    threshold: CONFIG.scoreThreshold,
    verbose: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--topK' && args[i + 1]) {
      options.topK = Number(args[i + 1]);
      i += 1;
    } else if (arg.startsWith('--topK=')) {
      options.topK = Number(arg.split('=')[1]);
    } else if (arg === '--threshold' && args[i + 1]) {
      options.threshold = Number(args[i + 1]);
      i += 1;
    } else if (arg.startsWith('--threshold=')) {
      options.threshold = Number(arg.split('=')[1]);
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node cli.js [--topK=N] [--threshold=F] [--verbose]\n`);
  console.log('Exemples:');
  console.log('  node cli.js --topK=5 --threshold=0.5');
  console.log('  node cli.js --verbose');
}

main();
