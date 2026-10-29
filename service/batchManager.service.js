let collectingBatch = {};
let collectionTimer = null;
let processing = false;
let flushRequested = false;
const {
    batchProcessing
} = require("../service/batchProcessing.service");
// Requests enter this batch
module.exports.collectRequest = function({ productId, variantId, latestState, selectionPath }) {
  collectingBatch[productId] ??= {};
  collectingBatch[productId][variantId] = { latestState, selectionPath };

  // Start one fixed collection window
  if (!collectionTimer) {
    collectionTimer = setTimeout(() => {
      collectionTimer = null;
      requestFlush();
    }, 200);
  }
}

// Both timer and external signal call this
function requestFlush() {
  flushRequested = true;
  void pump();
}

// Converts collecting batch into sealed batch
async function pump() {
  if (processing || !flushRequested) return;

  if (Object.keys(collectingBatch).length === 0) {
    flushRequested = false;
    return;
  }

  const sealedBatch = collectingBatch;
  collectingBatch = {}; // New requests enter a fresh batch
  flushRequested = false;

  processing = true;

  try {
    await batchProcessing(sealedBatch);
  } catch (error) {
    console.error("Batch failed:", error);
    // Don't discard sealedBatch; add retry/persistence here.
  } finally {
    processing = false;

    // Process another batch if a flush was requested meanwhile
    if (flushRequested) {
      void pump();
    }
  }
}
//still missing faliure of processing batch and retry logic, but this is a good start.