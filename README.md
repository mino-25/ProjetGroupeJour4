# Mini-Perplexity (jour4Projet)

Mini-Perplexity est un projet RAG qui combine un corpus local, un index vectoriel Pinecone et l'API Mistral pour répondre aux questions en citant des sources.

## 🚀 Démarrage rapide

### Mode démo (recommandé pour commencer)
Le projet fonctionne maintenant en mode démo sans nécessiter d'accès réseau aux APIs :

```bash
cd /Users/mino/COUR-DEV/IA:NodeJS/jour4Projet
npm install
npm start
```

### Mode production (avec APIs)
1. Assurez-vous d'avoir accès à Internet
2. Modifiez `config.js` : `demoMode: false`
3. Lancez l'indexation : `npm run index`
4. Utilisez : `npm start`

## 📚 Corpus et données de test

- **Corpus** : 6 fichiers texte sur IA, Node.js, histoire informatique, dev web, algorithmes
- **Questions test** : 10 questions (6 happy paths, 2 ambiguës, 2 adversariales)
- **Évaluation** : Tableau d'évaluation pré-rempli avec métriques simulées

## 🎯 Utilisation

### Interface interactive
```bash
npm start
```

### Requête directe
```bash
npm run query "Votre question ici"
```

### Options CLI
```bash
node cli.js --topK=3 --threshold=0.7 --verbose
```

### Audit des variantes
```bash
npm run audit
```

### Évaluation complète
```bash
npm run evaluate
```

## ⚙️ Configuration

### Variables d'environnement (.env)
```env
MISTRAL_API_KEY=votre_clé_mistral
PINECONE_API_KEY=votre_clé_pinecone
PINECONE_INDEX_NAME=mini-perplexity
PINECONE_INDEX_HOST=https://votre-host.pinecone.io
```

### Paramètres (config.js)
```javascript
export const CONFIG = {
  demoMode: true,        // false pour mode production
  model: 'mistral-tiny', // ou 'mistral-small-latest'
  topK: 5,
  scoreThreshold: 0.5,
  // ... autres paramètres
};
```

## 🔧 Phase 5 - Finalisation

La finalisation comprend :
- ✅ Pipeline RAG complet avec gestion d'erreurs
- ✅ Filtrage par seuil de similarité
- ✅ Comparaison variantes topK/threshold
- ✅ Évaluation structurée avec métriques
- ✅ Documentation complète

## 📊 Métriques trackées

- **Récupération** : Temps, nombre de chunks, scores
- **Génération** : Tokens utilisés, coût, latence
- **Qualité** : Citations orphelines, pertinence moyenne
- **Sources** : Fichiers cités avec scores de pertinence

## 🎨 Fonctionnalités

- Mode démo sans APIs externes
- Gestion robuste des erreurs réseau
- Interface CLI avec options configurables
- Scripts d'audit et d'évaluation automatisés
- Métriques détaillées et logging verbose
