import mongoose from 'mongoose';
import indexDef from './vectorSearchIndex.json' with { type: 'json' };

/**
 * StudyAI — Atlas Vector Search Index Configuration & Management (Phase 5)
 *
 * Index Name: document_chunks_vector_index
 * Collection: documentchunks
 * Vector Path: embedding
 * Dimensions: 768
 * Similarity: cosine
 * Filters: module, document
 */

export const INDEX_NAME = indexDef.name;
export const VECTOR_INDEX_SPEC = indexDef;

/**
 * Retrieves the current status of the Atlas Vector Search index
 * @returns {Promise<{ exists: boolean, status: string|null, queryable: boolean, index: Object|null }>}
 */
export const getVectorIndexStatus = async () => {
  try {
    if (!mongoose.connection?.db) {
      return { exists: false, status: null, queryable: false, index: null };
    }

    const collection = mongoose.connection.db.collection('documentchunks');
    const indexes = await collection.listSearchIndexes().toArray();
    const found = indexes.find((idx) => idx.name === INDEX_NAME);

    if (!found) {
      return { exists: false, status: null, queryable: false, index: null };
    }

    return {
      exists: true,
      status: found.status || 'UNKNOWN',
      queryable: Boolean(found.queryable),
      index: found
    };
  } catch (err) {
    // Some local MongoDB environments (like mongocryptd or standalone community) do not support search indexes
    console.warn(`[StudyAI Vector Index] Could not query search indexes: ${err.message}`);
    return { exists: false, status: 'UNSUPPORTED', queryable: false, error: err.message };
  }
};

/**
 * Ensures the Atlas Vector Search index exists. Idempotent and non-destructive.
 * Avoids recreating existing indexes.
 *
 * @returns {Promise<{ created: boolean, indexName: string, status: string }>}
 */
export const ensureVectorIndex = async () => {
  try {
    if (!mongoose.connection?.db) {
      return { created: false, indexName: INDEX_NAME, status: 'NO_DB' };
    }

    const collection = mongoose.connection.db.collection('documentchunks');
    const existing = await collection.listSearchIndexes().toArray();
    const alreadyExists = existing.find((idx) => idx.name === INDEX_NAME);

    if (alreadyExists) {
      return {
        created: false,
        indexName: INDEX_NAME,
        status: alreadyExists.status || 'EXISTS'
      };
    }

    console.log(`[StudyAI Vector Index] Creating Atlas Vector Search index "${INDEX_NAME}"...`);
    await collection.createSearchIndex(VECTOR_INDEX_SPEC);

    return {
      created: true,
      indexName: INDEX_NAME,
      status: 'PENDING'
    };
  } catch (err) {
    console.warn(`[StudyAI Vector Index] Atlas Vector Search index creation note: ${err.message}`);
    return {
      created: false,
      indexName: INDEX_NAME,
      status: 'ERROR',
      error: err.message
    };
  }
};

export default {
  INDEX_NAME,
  VECTOR_INDEX_SPEC,
  getVectorIndexStatus,
  ensureVectorIndex
};
