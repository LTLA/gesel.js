import * as utils from "./utils.js";
import * as full from "./fetchAllCollections.js";

var init = false;
const cache = new Map;

var ranges;
var sizes;
var starts;

async function initialize() {
    let res = await utils.retrieveRangesWithExtras("collections.tsv");
    ranges = res.ranges;
    sizes = res.extra;

    let first = 0;
    starts = [];
    for (const s of sizes) {
        starts.push(first);
        first += s;
    }

    init = true;
    return;
}

export async function fetchCollectionSizes() {
    if (!init) {
        if (full.init) {
            // Pulling it from the full info instead, if we already got it.
            let tmp_sizes = [];
            let meta = await full.fetchAllCollections();
            for (const x of meta) {
                tmp_sizes.push(x.size);
            }
            return tmp_sizes;
        }

        await initialize();
    }

    return sizes;
}

/**
 * @return {number} Total number of collections.
 */
export async function numberOfCollections() {
    if (!init) {
        if (full.init) {
            return (await full.fetchAllCollections()).length;
        }
        await initialize();
    }
    return sizes.length;
}

/**
 * @param {number} collection - Collection ID, see {@linkcode fetchAllCollections} for details.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.forceRequest=false] - Whether to force a request to the server.
 * By default, the cached collection information is used if {@linkcode fetchAllCollections} has previously been called.
 * Setting this to `true` is only useful for testing.
 *
 * @return {object} Object containing the details of the collection.
 * This should be identical to the corresponding entry of the array returned by {@linkcode fetchAllCollections}.
 *
 * @async
 */
export async function fetchSingleCollection(collection, { forceRequest = false } = {}) {
    if (full.init && !forceRequest) {
        return (await full.fetchAllCollections())[collection];
    }

    let cached = cache.get(collection);
    if (typeof cached !== "undefined") {
        return cached;
    }

    if (!init) {
        await initialize();
    }

    let text = await utils.retrieveBytesByIndex("collections.tsv", ranges, collection);
    let split = text.split("\t");
    let output = {
        title: split[0],
        description: split[1],
        species: split[2],
        maintainer: split[3],
        source: split[4],
        start: starts[collection],
        size: sizes[collection]
    };

    cache.set(collection, output);
    return output;
}


