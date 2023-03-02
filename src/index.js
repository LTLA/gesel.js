export * from "./genes.js";
export * from "./sets.js";
export * from "./mappings.js";
export * from "./search.js";

import { initializeGenes } from "./genes.js";
import { initializeSets } from "./sets.js";
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
    let promises = [initializeGenes(), initializeMappings()];
    if (includeSets) {
        promises.push(initializeSets());
    }

    var out = await Promise.all(promises);
    for (const i of out) {
        if (i) {
            return true;
        }
    }
    return false;
}
