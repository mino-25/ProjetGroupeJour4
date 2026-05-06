import 'dotenv/config';
import { CONFIG } from './config.js';

export async function generateCompletion(query, context) {
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
  return {
    answer: data.choices[0].message.content,
    usage: data.usage,
  };
}
