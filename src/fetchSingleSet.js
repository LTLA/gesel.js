import * as utils from "./utils.js";
import * as full from "./fetchAllSets.js";
import { fetchCollectionSizes } from "./fetchSingleCollection.js";

const _cache = new Map;
const _ranges = new Map;
const _sizes = new Map;
const _starts = new Map;
const _parents = new Map;
const _internal_number = new Map;

async function initialize(species) {
    const [ sres, csizes ] = await Promise.all([ 
        utils.retrieveRangesWithExtras(species + "_sets.tsv"), 
        fetchCollectionSizes(species) 
    ]);
    _ranges.set(species, sres.ranges);
    _sizes.set(species, sres.extra);

    let parents = [];
    let internal_number = [];
    var totals = 0;
    for (var i = 0; i < csizes.length; i++) {
        let colsize = csizes[i];
        for (var j = 0; j < colsize; j++) {
            parents.push(i);
            internal_number.push(j);
        }
        totals += colsize;
    }

    if (totals != sres.extra.length) {
        throw new Error("discrepancy between number of sets and sum of collection sizes");
    }

    _parents.set(species, parents);
    _internal_number.set(species, internal_number);
    _cache.set(species, new Map);
    return;
}

export async function fetchSetSizes(species) {
    return utils.fetchSizes(species, _sizes, full, initialize);
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @return {number} Total number of sets for this species.
 */
export async function numberOfSets(species) {
    return utils.fetchNumber(species, _sizes, full, initialize);
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {number} set - Set ID, see {@linkcode fetchAllSets} for details.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.forceRequest=false] - Whether to force a request to the server.
 * By default, the cached collection information is used if {@linkcode fetchAllSets} has previously been called.
 * Setting this to `true` is only useful for testing.
 *
 * @return {object} Object containing the details of the set.
 * This should be identical to the corresponding entry of the array returned by {@linkcode fetchAllSets}.
 *
 * @async
 */
export async function fetchSingleSet(species, set, { forceRequest = false } = {}) {
    let ffound = full.already_initialized(species);
    if (ffound !== null && !forceRequest) {
        return ffound[set];
    }

    let cached = _cache.get(species);
    if (typeof cached === "undefined") {
        await initialize(species);
        cached = _cache.get(species);
    }

    let sfound = cached.get(set);
    if (typeof sfound !== "undefined") {
        return sfound;
    }

    let text = await utils.retrieveBytesByIndex(species + "_sets.tsv", _ranges.get(species), set);
    let split = text.split("\t");
    let output = {
        name: split[0],
        description: split[1],
        size: _sizes.get(species)[set],
        collection: _parents.get(species)[set],
        number: _internal_number.get(species)[set]
    };

    cached.set(set, output);
    return output;
}


