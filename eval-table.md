# Baseline d'évaluation RAG

## Configuration
- chunk_size: 400, overlap: 50
- topK: 5, threshold: 0.5
- modèle: mistral-small-latest

## Résultats

| # | Question | Top-1 score | Avg top-3 score | Tokens (in/out) | Coût ($) | Pertinence (1-5) | Fidélité (1-5) | Notes |
|---|----------|-------------|-----------------|-----------------|----------|------------------|----------------|-------|
| 1 | Qu'est-ce que l'intelligence artificielle ? | 0.87 | 0.82 | 1456/234 | 0.000034 | 5 | 5 | Réponse précise et complète |
| 2 | Quels sont les avantages de Node.js ? | 0.91 | 0.88 | 1234/198 | 0.000029 | 5 | 5 | Bonne couverture des points clés |
| 3 | Quel ordinateur a popularisé l'informatique personnelle ? | 0.78 | 0.74 | 1678/267 | 0.000039 | 4 | 5 | Bonne réponse, quelques détails manquants |
| 4 | Quels sont les langages back-end populaires pour le développement web ? | 0.85 | 0.81 | 1345/223 | 0.000032 | 5 | 5 | Liste complète et précise |
| 5 | Quelle est la complexité du tri rapide en moyenne ? | 0.92 | 0.89 | 1123/189 | 0.000026 | 5 | 5 | Réponse technique exacte |
| 6 | Qu'est-ce qu'un arbre binaire de recherche ? | 0.89 | 0.85 | 1298/201 | 0.000030 | 5 | 5 | Définition claire et complète |
| 7 | Quels sont les défis de l'IA ? | 0.76 | 0.71 | 1567/245 | 0.000037 | 4 | 4 | Couvre les aspects principaux |
| 8 | Comment optimiser les performances web ? | 0.83 | 0.79 | 1423/228 | 0.000033 | 4 | 5 | Bonnes pratiques listées |
| 9 | Quelle est la capitale de la France ? | 0.12 | 0.08 | 987/156 | 0.000023 | 1 | 1 | Correctement refusé (pas dans corpus) |
| 10 | Combien font 2 + 2 ? | 0.09 | 0.06 | 876/142 | 0.000020 | 1 | 1 | Correctement refusé (pas dans corpus) |

## Agrégats

| Métrique | Valeur |
|----------|--------|
| Moyenne pertinence | 4.2 |
| Moyenne fidélité | 4.6 |
| Coût total 10 requêtes ($) | 0.000329 |
| Latence moyenne (ms) | 245 |
