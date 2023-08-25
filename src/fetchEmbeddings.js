import * as utils from "./utils.js";

const _cache = new Map;

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.download=true] - Whether to download the gene-to-set mappings if they are not already available.
 * If `false`, `null` is returned if the gene-to-set mappings have not already been loaded into memory.
 *
 * @return {?Object} Object with the x and y coordinates. 
 * 
 * Each element in x and y corresponds to an entry in {@linkcode fetchAllSets} and 
 * length of x and y is equal to the total number of sets for this `species`.
 * 
 * If the embedding mappings have not already been loaded and `download = false`, `null` is returned.
 * @async
 */
export async function fetchEmbeddingsForSpecies(species, { download = true } = {}) {
    let found = _cache.get(species);
    if (typeof found !== "undefined") {
        return found;
    } else if (!download) {
        return null;
    }

    // could probably just use gene_download
    let res = await utils.reference_download(species + "_tsne.tsv.gz");
    if (!res.ok) {
        throw new Error("failed to fetch full tsne embeddings for species '" + species + "'");
    }

    var embed_data = utils.decompressLines(await res.arrayBuffer());
    let loaded = convertToCoordinates(embed_data);

    _cache.set(species, loaded);
    return loaded;
}

function convertToCoordinates(lines) {
    var x = [], y = [];

    for (let i = 0; i < lines.length; i++) {
        let split = lines[i].split("\t");
        x.push(Number(split[0]));
        y.push(Number(split[1]));
    }

    return {
        "x": new Float64Array(x), 
        "y": new Float64Array(y)
    }
};
