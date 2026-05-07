# Mini-Perplexity (jour4Projet)

Mini-Perplexity est un projet RAG qui combine un corpus local, un index vectoriel Pinecone et l'API Mistral pour répondre aux questions en citant des sources.

## Objectifs
- Indexer un corpus de documents texte avec embeddings Mistral.
- Construire un assistant qui se base uniquement sur le contexte récupéré.
- Finaliser la phase de comparaison / évaluation pour le point 5.

## Structure du projet
- `config.js` : paramètres globaux du projet.
- `generation.js` : génération de réponses avec l'API Mistral.
- `retrieval.js` : recherche de contexte dans Pinecone.
- `rag-pipeline.js` : orchestration RAG et calcul des métriques.
- `cli.js` : interface interactive pour poser des questions.
- `scripts/create-index.js` : indexation du corpus.
- `scripts/retrieval-audit.js` : audit des variantes topK / threshold.
- `scripts/run-eval.js` : évaluation automatique sur questions de test.
- `eval-table.md` : tableau d'évaluation à remplir.

## Installation
1. Copier ou créer le fichier `.env` avec :
   - `MISTRAL_API_KEY`
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX_NAME`
   - `PINECONE_INDEX_HOST`
2. Installer les dépendances :
   ```bash
   npm install
   ```

## Utilisation
1. Construire l'index :
   ```bash
   npm run index
   ```
2. Lancer l'interface interactive :
   ```bash
   npm start
   ```
3. Lancer une requête directe :
   ```bash
   npm run query "Quel est le sujet principal ?"
   ```
4. Tester des variantes d'indexation / récupération :
   ```bash
   npm run audit
   ```
5. Évaluer le système sur le jeu de questions de test :
   ```bash
   npm run evaluate
   ```

## Phase 5 - Finalisation
La finalisation consiste à :
- vérifier le pipeline RAG complet,
- activer le filtrage avec `threshold`,
- comparer des variantes `topK` / `threshold`,
- générer des résultats d'évaluation structurés,
- remplir `eval-table.md` après analyse.

## Notes importantes
- `questions-test.txt` doit être rempli avec des questions réelles.
- `eval-table.md` se complète après exécution de `npm run evaluate`.
- `cli.js` accepte les options suivantes : `--topK`, `--threshold`, `--verbose`.
