import { downloader, decompressLines } from "./utils.js";

var init = false;
var gene2set_ranges;
var set2gene_ranges;
var tokens_names_ranges;
var tokens_descriptions_ranges;
var sets_ranges;
var collections_ranges;

const gene2set_cache = new Map;
const set2gene_cache = new Map;
const tokens_names_cache = new Map;
const tokens_descriptions_cache = new Map;
const sets_cache = new Map;
const collections_cache = new Map;

export var sets_sizes;
var sets_parents;
var sets_internal_number;
var collections_sizes;
var collections_starts;

/***************************************************
 ***************************************************/

async function retrieveRanges(resource) {
    var res = await downloader(resource + ".ranges.gz");
    if (!res.ok) {
        throw "failed to fetch ranges for '" + resource + "'";
    }

    var buffer = await res.arrayBuffer();
    var lengths = decompressLines(buffer);

    var ranges = [0];
    for (var i = 0; i < lengths.length; i++) { 
        ranges.push(ranges[i] + Number(lengths[i]) + 1);
    }
    return ranges;
}

async function retrieveNamedRanges(resource) {
    var res = await downloader(resource + ".ranges.gz");
    if (!res.ok) {
        throw "failed to fetch ranges for '" + resource + "'";
    }

    var buffer = await res.arrayBuffer();
    var lines = decompressLines(buffer);

    var last = 0;
    var output = new Map; 
    for (var i = 0; i < lines.length; i++) { 
        let split = lines[i].split("\t");
        let next = last + Number(split[1]) + 1; // +1 for the newline.
        output.set(split[0], [last, next]);
        last = next;
    }

    return output;
}

async function retrieveRangesWithExtras(resource) {
    var res = await downloader(resource + ".ranges.gz");
    if (!res.ok) {
        throw "failed to fetch ranges for '" + resource + "'";
    }

    var buffer = await res.arrayBuffer();
    var lines = decompressLines(buffer);

    var ranges = [0];
    var extra = [];
    for (var i = 0; i < lines.length; i++) {
        let split = lines[i].split("\t");
        ranges.push(ranges[i] + Number(split[0]) + 1); // +1 for the newline.
        extra.push(Number(split[1]));
    }

    return { ranges, extra };
}

/***************************************************
 ***************************************************/

function retrieveBytesByIndex(resource, ranges, index) {
    var start = ranges[index];
    var end = ranges[index + 1];
    return retrieveBytes(resource, start, end);
}

async function retrieveBytes(resource, start, end) {
    end--; // ignore the newline.

    var res = await downloader(resource, start, end);
    if (!res.ok) {
        throw "failed to fetch ranges for '" + resource + "'";
    }

    var txt = await res.text();
    return txt.slice(0, end - start); // make sure we limit it to the requested length.
}

// Building back the indices from the diffs.
function convertToUint32Array(txt) {
    var output = [];
    var last = 0;
    txt.split("\t").forEach(x => {
        var y = Number(x) + last;
        output.push(y);
        last = y;
    });
    return new Uint32Array(output);
}

/***************************************************
 ***************************************************/

/**
 * Initialize all **gesel** mapping assets.
 *
 * @return {boolean} `true` when mapping assets are downloaded and initialized.
 * If the assets were already downloaded, `false` is returned instead.
 *
 * @async
 */
export async function initializeMappings() {
    if (init) {
        return false;
    }

    await Promise.all([
        retrieveRanges("set2gene.tsv")
            .then(res => {
                set2gene_ranges = res;
                return true;
            }),

        retrieveRanges("gene2set.tsv")
            .then(res => { 
                gene2set_ranges = res;
                return true;
            }),

        retrieveRangesWithExtras("sets.tsv")
            .then(res => {
                sets_ranges = res.ranges;
                sets_sizes = res.extra;
                return true;
            }),

        retrieveRangesWithExtras("collections.tsv")
            .then(res => {
                collections_ranges = res.ranges;
                collections_sizes = res.extra;
                return true;
            }),

        retrieveNamedRanges("tokens-names.tsv")
            .then(res => {
                tokens_names_ranges = res;
                return true;
            }),

        retrieveNamedRanges("tokens-descriptions.tsv")
            .then(res => {
                tokens_descriptions_ranges = res;
                return true;
            })
    ]);

    sets_parents = [];
    sets_internal_number = [];
    collections_starts = [];
    var first_set = 0;

    for (var i = 0; i < collections_sizes.length; i++) {
        let colsize = collections_sizes[i];
        for (var j = 0; j < colsize; j++) {
            sets_parents.push(i);
            sets_internal_number.push(j);
        }
        collections_starts.push(first_set);
        first_set += colsize;
    }

    if (first_set != sets_sizes.length) {
        throw new Error("discrepancy between number of sets and sum of collection sizes");
    }

    init = true;
    return true;
}

/**
 * Get all sets containing a gene.
 * This assumes that the promise returned by {@linkcode initializeMappings} has been resolved.
 *
 * @param {number} gene - Index of a gene, referencing an element in {@linkcode genes}.
 *
 * @return {Array} An array of integers containing the indices for all sets containing the gene.
 * Indices refer to elements in {@linkcode sets}.
 * 
 * @async
 */
export async function fetchSetsForGene(gene) {
    let cached = gene2set_cache.get(gene);
    if (typeof cached !== "undefined") {
        return cached;
    }

    let text = await retrieveBytesByIndex("gene2set.tsv", gene2set_ranges, gene);
    let output = convertToUint32Array(text);
    gene2set_cache.set(gene, output);
    return output;
}

/**
 * Get all genes within a set.
 * This assumes that the promise returned by {@linkcode initializeMappings} has been resolved.
 *
 * @param {number} set - Index of a set, referencing an element in {@linkcode sets}.
 *
 * @return {Array} An array of integers containing the indices for all genes within the set.
 * Indices refer to elements in {@linkcode genes}.
 *
 * @async
 */
export async function fetchGenesForSet(set) {
    let cached = set2gene_cache.get(set);
    if (typeof cached !== "undefined") {
        return cached;
    }

    let text = await retrieveBytesByIndex("set2gene.tsv", set2gene_ranges, set);
    let output = convertToUint32Array(text);
    set2gene_cache.set(set, output);
    return output;
}

/**
 * @return {number} Total number of sets.
 */
export function totalSets() {
    return sets_sizes.length;
}

/**
 * @return {number} Total number of collections.
 */
export function totalCollections() {
    return collections_sizes.length;
}

/**
 * Obtain the details for a set.
 * This assumes that the promise returned by {@linkcode initializeMappings} has been resolved.
 *
 * @param {number} set - Index of a set.
 *
 * @return {object} Object containing the details of the set, with the following properties:
 *
 * - `name`, the name of the set.
 * - `description`, the description of the set.
 * - `size`, the number of genes in the set.
 * - `collection`, the index of the collection containing the set.
 * - `number`, the number of the set within the collection.
 *
 * @async
 */
export async function fetchSetDetails(set) {
    let cached = sets_cache.get(set);
    if (typeof cached !== "undefined") {
        return cached;
    }

    let text = await retrieveBytesByIndex("sets.tsv", sets_ranges, set);
    let split = text.split("\t");
    let output = {
        name: split[0],
        description: split[1],
        size: sets_sizes[set],
        collection: sets_parents[set],
        number: sets_internal_number[set]
    };

    sets_cache.set(set, output);
    return output;
}

/**
 * Obtain the details for a collection.
 * This assumes that the promise returned by {@linkcode initializeMappings} has been resolved.
 *
 * @param {number} set - Index of a set.
 *
 * @return {object} Object containing the details of the collection, with the following properties:
 *
 * - `title`, the title for the collection.
 * - `description`, the description for the collection.
 * - `species`, the species for all gene identifiers in the collection.
 *   This should contain the full scientific name, e.g., `"Homo sapiens"`, `"Mus musculus"`.
 * - `maintainer`, the maintainer of this collection.
 * - `source`, the source of this set, usually a link to some external resource.
 * - `start`, the index for the first set in the collection in the output of {@linkcode sets}.
 *   All sets from the same collection are stored contiguously.
 * - `size`, the number of sets in the collection.
 *
 * @async
 */
export async function fetchCollectionDetails(collection) {
    let cached = collections_cache.get(collection);
    if (typeof cached !== "undefined") {
        return cached;
    }

    let text = await retrieveBytesByIndex("collections.tsv", collections_ranges, collection);
    let split = text.split("\t");
    let output = {
        title: split[0],
        description: split[1],
        species: split[2],
        maintainer: split[3],
        source: split[4],
        start: collections_starts[collection],
        size: collections_sizes[collection]
    };

    collections_cache.set(collection, output);
    return output;
}

export async function fetchSetsByNameToken(token) {
    let cached = tokens_names_cache.get(token);
    if (typeof cached !== "undefined") {
        return cached;
    }

    let pos = tokens_names_ranges.get(token);
    if (typeof pos === "undefined") {
        return new Uint8Array;
    }

    let text = await retrieveBytes("tokens-names.tsv", pos[0], pos[1]);
    let output = convertToUint32Array(text);
    tokens_names_cache.set(token, output);
    return output;
}

export async function fetchSetsByDescriptionToken(token) {
    let cached = tokens_descriptions_cache.get(token);
    if (typeof cached !== "undefined") {
        return cached;
    }

    let pos = tokens_descriptions_ranges.get(token);
    if (typeof pos === "undefined") {
        return new Uint8Array;
    }

    let text = await retrieveBytes("tokens-descriptions.tsv", pos[0], pos[1]);
    let output = convertToUint32Array(text);
    tokens_descriptions_cache.set(token, output);
    return output;
}
