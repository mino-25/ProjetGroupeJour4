import 'dotenv/config';
import { CONFIG } from './config.js';

export async function generateCompletion(query, context) {
  if (CONFIG.demoMode) {
    // Mode démo : générer une réponse simulée basée sur le contexte
    const contextText = context.map(c => c.text).join(' ');
    let answer = '';

    if (query.toLowerCase().includes('intelligence artificielle')) {
      answer = "L'intelligence artificielle (IA) est un domaine de l'informatique qui vise à créer des machines capables de simuler l'intelligence humaine. Elle englobe plusieurs sous-domaines comme l'apprentissage automatique, le traitement du langage naturel et la vision par ordinateur. [Source 1]";
    } else if (query.toLowerCase().includes('node')) {
      answer = "Node.js est un environnement d'exécution JavaScript côté serveur basé sur le moteur V8 de Google Chrome. Il permet d'exécuter du JavaScript en dehors du navigateur web et utilise un modèle d'E/S non bloquant. [Source 3]";
    } else if (query.toLowerCase().includes('histoire')) {
      answer = "L'histoire de l'informatique moderne commence au milieu du XXe siècle avec l'invention des premiers ordinateurs électroniques comme l'ENIAC. [Source 4]";
    } else {
      answer = "Je ne trouve pas cette information dans les documents fournis.";
    }

    return {
      answer,
      usage: { prompt_tokens: 150, completion_tokens: 50 },
    };
  }

  try {
    const contextText = context
      .map((chunk, i) => `[Source ${i + 1} - ${chunk.source}]\n${chunk.text}`)
      .join('\n\n---\n\n');

    const systemPrompt = `Tu es un assistant expert qui répond uniquement à partir des sources fournies.

Règles :
- Réponds uniquement à partir du contexte ci-dessous. N'utilise pas ta mémoire interne.
- Si la réponse n'est pas dans le contexte, dis explicitement "Je ne trouve pas cette information dans les documents fournis."
- Cite toujours tes sources entre crochets : [Source 1], [Source 2], etc.
- Sois précis et concis.`;

    const userMessage = `Contexte :
${contextText}

Question : ${query}`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      // Gestion spécifique des erreurs d'API
      if (data.error) {
        if (data.error.code === '3505' || data.error.type === 'service_tier_capacity_exceeded') {
          throw new Error(`Quota API dépassé. Essayez de changer le modèle dans config.js (ex: 'mistral-tiny') ou attendez la régénération du quota.`);
        }
        throw new Error(`Erreur API Mistral: ${data.error.message}`);
      }
      throw new Error(`Réponse API invalide: ${JSON.stringify(data)}`);
    }

    return {
      answer: data.choices[0].message.content,
      usage: data.usage,
    };
  } catch (error) {
    console.error(`Erreur lors de la génération: ${error.message}`);
    return {
      answer: "Désolé, une erreur s'est produite lors de la génération de la réponse. Veuillez réessayer.",
      usage: { prompt_tokens: 0, completion_tokens: 0 },
    };
  }
}
