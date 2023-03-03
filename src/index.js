export * from "./mappings.js";
export * from "./search.js";
export { setDownload } from "./utils.js";

export * from "./fetchAllGenes.js";
export * from "./mapGenesBySymbol.js";
export * from "./mapGenesByEntrez.js";
export * from "./mapGenesByEnsembl.js";
export * from "./searchGenes.js";

export { fetchAllSets } from "./fetchAllSets.js";
export { fetchSingleSet } from "./fetchSingleSet.js";
export { fetchAllCollections } from "./fetchAllCollections.js";
export { fetchSingleCollection } from "./fetchSingleCollection.js";

import { initializeMappings } from "./mappings.js";

/**
 * Initialize all **gesel** assets.
 *
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.includeSets=false] - Whether or not to call {@linkcode initializeSets}.
 * This is set to `false` to reduce data transfer if {@linkcode sets} and {@linkcode collections} are not going to be called.
 *
 * @return {boolean} `true` once all components are initialized,
 * by calling the individual initializers for each component (i.e., {@linkcode initializeGenes}, {@linkcode initializeSets} and {@linkcode initializeMappings}).
 * If everything was already initialized, `false` is returned instead.
 *
 * @async
 */
export async function initialize({ includeSets = false } = {}) {
    let promises = [initializeMappings()];

    var out = await Promise.all(promises);
    for (const i of out) {
        if (i) {
            return true;
        }
    }
    return false;
}
