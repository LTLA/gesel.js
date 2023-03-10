import * as utils from "./utils.js";
import * as full from "./fetchAllCollections.js";

const _cache = new Map;
const _ranges = new Map;
const _sizes = new Map;
const _starts = new Map;

async function initialize(species) {
    let res = await utils.retrieveRangesWithExtras(species + "_collections.tsv");
    _ranges.set(species, res.ranges);
    _sizes.set(species, res.extra);

    let first = 0;
    let starts = [];
    for (const s of res.extra) {
        starts.push(first);
        first += s;
    }
    _starts.set(species, starts);

    _cache.set(species, new Map);
    return;
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @return {Array} Number of sets in each collection.
 * Each value corresponds to a collection in {@linkcode fetchAllCollections}.
 * @async
 */
export async function fetchCollectionSizes(species) {
    return utils.fetchSizes(species, _sizes, full.fetchAllCollections, initialize);
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @return {number} Total number of collections for this species.
 * @async
 */
export async function numberOfCollections(species) {
    return utils.fetchNumber(species, _sizes, full.fetchAllCollections, initialize);
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {?number} collection - Collection ID, see {@linkcode fetchAllCollections} for details.
 * 
 * If `null`, no request is performed, but various internal caches are initialized for subsequent calls to this function.
 * This is useful for guaranteeing that caches are available in concurrent calls.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.forceRequest=false] - Whether to force a request to the server.
 * By default, the return value is extracted from the full collection details if {@linkcode fetchAllCollections} was called before this function.
 * Setting this to `true` is only useful for testing.
 * @param {boolean} [options.forceDownload=false] - Whether to forcibly download all collection details up-front to avoid range requests.
 * This is done by calling {@linkcode fetchAllCollections}.
 * Ignored if `forceRequest = true`.
 *
 * @return {object} Object containing the details of the collection.
 * This should be identical to the corresponding entry of the array returned by {@linkcode fetchAllCollections}.
 *
 * If `collection = null`, no return value is provided.
 * @async
 */
export async function fetchSingleCollection(species, collection, { forceRequest = false, forceDownload = false } = {}) {
    if (!forceRequest) {
        let ffound = await full.fetchAllCollections(species, { download: forceDownload });
        if (ffound !== null) {
            if (collection !== null) {
                return ffound[collection];
            } else {
                return;
            }
        }
    }

    let cached = _cache.get(species);
    if (typeof cached === "undefined") {
        await initialize(species);
        cached = _cache.get(species);
    }

    if (collection == null) {
        return;
    }

    let cfound = cached.get(collection);
    if (typeof cfound !== "undefined") {
        return cfound;
    }

    let text = await utils.retrieveBytesByIndex(species + "_collections.tsv", _ranges.get(species), collection);
    let split = text.split("\t");
    let output = {
        title: split[0],
        description: split[1],
        species: split[2],
        maintainer: split[3],
        source: split[4],
        start: _starts.get(species)[collection],
        size: _sizes.get(species)[collection]
    };

    cached.set(collection, output);
    return output;
}


