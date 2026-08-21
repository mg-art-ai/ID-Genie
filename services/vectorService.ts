
// A simplified client-side vector database implementation for contextual memory.
// In a production environment, this would be replaced with a real vector DB
// and a proper embedding model.

interface VectorEntry {
  id: string;
  text: string;
  type: 'style-guide' | 'design';
  vector: Map<string, number>;
  createdAt: number;
}

// In-memory store for our vectors
const vectorStore: VectorEntry[] = [];
const MAX_STORE_SIZE = 100; // Limit the size to prevent memory issues

/**
 * Simple text tokenizer: splits text into words, converts to lowercase, and removes punctuation.
 */
const tokenize = (text: string): string[] => {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
};

/**
 * Creates a simple term frequency vector (as a Map) from an array of tokens.
 */
const createTextVector = (tokens: string[]): Map<string, number> => {
  const vector = new Map<string, number>();
  for (const token of tokens) {
    vector.set(token, (vector.get(token) || 0) + 1);
  }
  return vector;
};

/**
 * Calculates the cosine similarity between two vectors (maps).
 * A value closer to 1 means the vectors are more similar.
 */
const cosineSimilarity = (vecA: Map<string, number>, vecB: Map<string, number>): number => {
  const allTokens = new Set([...vecA.keys(), ...vecB.keys()]);
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const token of allTokens) {
    const valA = vecA.get(token) || 0;
    const valB = vecB.get(token) || 0;
    dotProduct += valA * valB;
    magnitudeA += valA * valA;
    magnitudeB += valB * valB;
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
};


/**
 * Adds a new text entry to the vector store.
 */
export const addVectorEntry = (text: string, type: 'style-guide' | 'design'): void => {
  if (!text || text.trim().length < 20) return; // Don't store empty or very short entries

  const tokens = tokenize(text);
  const vector = createTextVector(tokens);

  // Avoid storing duplicates
  for (const entry of vectorStore) {
      if (cosineSimilarity(entry.vector, vector) > 0.98) {
          return; // Already have a very similar entry
      }
  }

  vectorStore.push({
    id: `vec-${Date.now()}-${Math.random()}`,
    text,
    type,
    vector,
    createdAt: Date.now(),
  });

  // If store is too large, remove the oldest entry
  if (vectorStore.length > MAX_STORE_SIZE) {
    vectorStore.sort((a, b) => a.createdAt - b.createdAt).shift();
  }
};


/**
 * Finds the most relevant entries from the store based on a query text.
 */
export const findMostRelevantEntries = (query: string, topN: number): { text: string; type: 'style-guide' | 'design'; }[] => {
  if (!query || vectorStore.length === 0) return [];

  const queryTokens = tokenize(query);
  const queryVector = createTextVector(queryTokens);

  const similarities = vectorStore.map(entry => ({
    entry,
    similarity: cosineSimilarity(queryVector, entry.vector),
  }));

  return similarities
    .filter(item => item.similarity > 0.1) // Set a minimum relevance threshold
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN)
    .map(item => ({
        text: item.entry.text,
        type: item.entry.type,
    }));
};
