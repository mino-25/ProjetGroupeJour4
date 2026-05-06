import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';
import { MistralAIEmbeddings, ChatMistralAI } from '@langchain/mistralai';
import { PineconeStore } from '@langchain/pinecone';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { CONFIG } from './config.js';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const prompt = ChatPromptTemplate.fromTemplate(`Tu es un assistant expert qui répond uniquement à partir des sources fournies.

Règles :
- Réponds uniquement à partir du contexte ci-dessous. N'utilise pas ta mémoire interne.
- Si la réponse n'est pas dans le contexte, dis explicitement "Je ne trouve pas cette information dans les documents fournis."
- Cite toujours tes sources entre crochets : [Source 1], [Source 2], etc.
- Sois précis et concis.

Contexte :
{context}

Question : {input}`);

async function buildChain() {
  const embeddings = new MistralAIEmbeddings({ model: CONFIG.embedModel });
  const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex });
  const retriever = vectorStore.asRetriever({ k: CONFIG.topK });
  const llm = new ChatMistralAI({ model: CONFIG.model, temperature: 0.1 });
  const combineDocsChain = await createStuffDocumentsChain({ llm, prompt });
  return createRetrievalChain({ combineDocsChain, retriever });
}

let _chain = null;

export async function ragQueryLangChain(question) {
  if (!_chain) _chain = await buildChain();

  const result = await _chain.invoke({ input: question });

  const sources = [...new Map(
    result.context.map(doc => [
      doc.metadata.source,
      { file: doc.metadata.source ?? 'Source inconnue', relevance: doc.metadata.score ?? null },
    ])
  ).values()];

  return {
    answer: result.answer,
    sources,
    chunks: result.context.map(doc => ({
      text: doc.pageContent,
      source: doc.metadata.source ?? 'Source inconnue',
    })),
  };
}
