# Baseline d'évaluation RAG

## Configuration
- corpus : documentation Pydantic AI (~22 fichiers markdown)
- chunk_size: 400, overlap: 50
- topK: 5, threshold: 0.5
- modèle : mistral-small-latest, mistral-embed

## Résultats

| # | Question | Top-1 score | Avg top-3 score | Tokens (in/out) | Coût ($) | Pertinence (1-5) | Fidélité (1-5) | Notes |
|---|----------|-------------|-----------------|-----------------|----------|------------------|----------------|-------|
| 1 | Comment définir un outil (tool) dans Pydantic AI ? | 0.91 | 0.84 | 712 / 183 | 0.000090 | 5 | 5 | Réponse précise, décorateur @agent.tool cité [Source 1] |
| 2 | Quelle est la différence entre Agent et RunContext ? | 0.88 | 0.79 | 683 / 201 | 0.000088 | 5 | 5 | Distinction claire, deux sources citées |
| 3 | Comment streamer une réponse avec Pydantic AI ? | 0.85 | 0.77 | 741 / 167 | 0.000091 | 5 | 4 | Exemple de code correct, méthode `.stream()` bien citée |
| 4 | Comment Pydantic AI gère-t-il la validation des données de sortie ? | 0.83 | 0.74 | 698 / 214 | 0.000091 | 5 | 5 | Schéma Pydantic et ModelRetry expliqués [Source 1][Source 2] |
| 5 | Comment configurer le modèle LLM dans un Agent Pydantic AI ? | 0.87 | 0.80 | 654 / 178 | 0.000083 | 5 | 5 | Paramètre `model=` et types supportés cités |
| 6 | Comment accéder au RunContext depuis un outil ? | 0.79 | 0.70 | 727 / 192 | 0.000092 | 4 | 4 | Réponse correcte mais manque le détail sur `ctx.deps` |
| 7 | Comment gérer les erreurs dans Pydantic AI ? | 0.72 | 0.63 | 768 / 239 | 0.000101 | 3 | 4 | Chunk ambigu : mélange ValidationError et RetryError — réponse correcte mais incomplète |
| 8 | Comment tester un agent Pydantic AI ? | 0.68 | 0.59 | 743 / 221 | 0.000096 | 3 | 3 | Plusieurs stratégies (mocking, TestModel) évoquées sans hiérarchie claire |
| 9 | Quel est le PIB de la France en 2023 ? | 0.38 | 0.29 | 412 / 47 | 0.000046 | 1 | 5 | Hors corpus → "Je ne trouve pas cette information dans les documents fournis." ✓ |
| 10 | Comment créer une API REST avec Express.js ? | 0.34 | 0.26 | 398 / 44 | 0.000044 | 1 | 5 | Hors corpus → refus correct, aucune hallucination ✓ |

## Agrégats

| Métrique | Valeur |
|----------|--------|
| Moyenne pertinence | 3.7 / 5 |
| Moyenne fidélité | 4.5 / 5 |
| Coût total 10 requêtes ($) | 0.000822 |
| Latence moyenne (ms) | 1 240 |

---

## Audit Phase 11 — variantes testées

| Variante | Avg top-1 score | Latence moy. (ms) | Coût total ($) | Observations |
|----------|-----------------|-------------------|----------------|--------------|
| **baseline** (topK=5, threshold=0.5) | 0.73 | 1 240 | 0.000822 | Référence |
| topK=1 | 0.79 | 980 | 0.000631 | Plus rapide mais perd les questions ambiguës |
| topK=10 | 0.71 | 1 580 | 0.001140 | Meilleur recall, réponses plus verbeuses, coût +39 % |
| threshold=0.3 | 0.73 | 1 250 | 0.000910 | Bruit supplémentaire sur les adversariales |
| threshold=0.7 | 0.76 | 1 190 | 0.000774 | Plus strict : Q6 dégradée (chunk utile écarté) |

### Régressions identifiées

**Régression 1 — topK=1 sur Q7 (ambiguë : gestion des erreurs)**
Avec topK=1, le retrieval retourne uniquement le chunk traitant de `ValidationError` (score 0.72).
Le chunk sur `RetryError` et la boucle agentique (score 0.65), pourtant complémentaire, est écarté.
La réponse omet la logique de retry et donne une image partielle de la gestion d'erreurs.
Pertinence tombe de 3 → 2, fidélité de 4 → 2.
**Cause :** topK=1 est trop restrictif pour les questions qui couvrent plusieurs concepts distincts dans le corpus.

**Régression 2 — threshold=0.7 sur Q6 (RunContext depuis un outil)**
Avec threshold=0.7, le chunk expliquant l'accès à `ctx.deps` (score 0.68, sous le nouveau seuil) est filtré.
La réponse reste correcte sur l'injection de `RunContext` mais ne mentionne plus les dépendances typées.
Pertinence passe de 4 → 3.
**Cause :** un seuil plus élevé améliore la précision sur les requêtes claires mais élimine des chunks légèrement moins proches qui restent factuellement utiles sur les questions nuancées.
