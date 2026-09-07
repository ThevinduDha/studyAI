import * as retrievalService from './retrieval.service.js';
import * as contextService from './context.service.js';
import * as generationService from './generation.service.js';

/**
 * StudyAI — RAG Orchestration Service (Phase 7)
 *
 * Coordinates the full grounded Question-Answering pipeline:
 * 1. Validates query and options
 * 2. Scopes and executes semantic retrieval (via retrieval.service)
 * 3. Short-circuits safely if no relevant context exists (NO Gemini call)
 * 4. Assembles bounded grounded context and authoritative citations (via context.service)
 * 5. Generates grounded answer using Google Gemini (via generation.service)
 * 6. Returns structured answer contract with verified source citations
 */

/**
 * Executes a grounded RAG question-answering workflow
 *
 * @param {Object} params - { user, question, moduleId, documentId, topK }
 * @param {Object} [options] - Options { embeddingClient, generationClient, minScore, maxChars }
 * @returns {Promise<{ question: string, answer: string, sources: Array<Object>, retrieval: { count: number } }>}
 */
export const askQuestion = async (
  { user, question, moduleId, documentId, topK },
  options = {}
) => {
  // 1. Validate inputs and parameters
  const { trimmedQuestion } = retrievalService.validateRetrievalInput({
    question,
    moduleId,
    documentId,
    topK
  });

  // 2. Perform authorized semantic retrieval via Phase 6 service
  const retrievalResult = await retrievalService.searchChunks(
    {
      question: trimmedQuestion,
      moduleId,
      documentId,
      topK,
      user
    },
    {
      embeddingClient: options.embeddingClient
    }
  );

  const rawChunks = retrievalResult.results || [];

  // 3. Short-circuit if no chunks were retrieved
  // DO NOT call Gemini if no relevant study material exists
  if (rawChunks.length === 0) {
    return {
      question: trimmedQuestion,
      answer: generationService.INSUFFICIENT_INFO_MESSAGE,
      sources: [],
      retrieval: {
        count: 0
      }
    };
  }

  // 4. Build bounded context and authoritative application citations
  const { contextString, citations, includedCount } = contextService.buildGroundedContext(
    rawChunks,
    options
  );

  // If all chunks were filtered out (e.g. below minimum relevance threshold)
  if (includedCount === 0 || !contextString) {
    return {
      question: trimmedQuestion,
      answer: generationService.INSUFFICIENT_INFO_MESSAGE,
      sources: [],
      retrieval: {
        count: 0
      }
    };
  }

  // 5. Generate grounded answer via Gemini
  const answer = await generationService.generateGroundedAnswer(
    {
      question: trimmedQuestion,
      context: contextString
    },
    {
      client: options.generationClient,
      temperature: options.temperature,
      model: options.model
    }
  );

  // 6. Return response contract
  return {
    question: trimmedQuestion,
    answer,
    sources: citations,
    retrieval: {
      count: includedCount
    }
  };
};

export default {
  askQuestion
};
