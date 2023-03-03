import * as pako from "pako";

export const baseUrl = "https://github.com/LTLA/gesel-feedstock/releases/download/indices-v0.1.0";

export var downloader = (file, start = null, end = null) => {
    let url = baseUrl + "/" + file;
    if (start == null || end == null) {
        return fetch(url);
    } else {
        return fetch(url, { headers: { Range: "bytes=" + String(start) + "-" + String(end) } }); 
    }
};

/**
 * Set the global download function to fetch pre-built indices.
 * By default, it uses the indices from [the feedstock repository](https://github.com/LTLA/gesel-feedstock).
 * Applications may specify a different function, e.g., to point to another set of indices; this should be done before calling any other **gesel** functions.
 *
 * @param {function} fun - Function that performs a GET request to an index file, returning a Response object containing the file contents.
 * This accepts three arguments:
 *
 * - The base name of the pre-built index file of interest (e.g., `"collections.tsv.gz"`).
 * - The starting byte of the request.
 * - The ending byte of the request.
 *
 * If all three arguments are specified, the function should perform a HTTP range request to obtain the specified range of bytes.
 * If only the first argument is supplied, the function should download the entire file.
 *
 * @return {function} The previous global value of the function.
 */
export function setDownload(fun) {
    let prev = downloader;
    downloader = fun;
    return prev;
}

export function decompressLines(buffer) {
    var contents = pako.inflate(new Uint8Array(buffer));
    const txt = new TextDecoder();
    var lines = txt.decode(contents).split("\n");

    if (lines[lines.length - 1] == "") {
        return lines.slice(0, lines.length - 1); // remove empty string at trailing newline.
    } else {
        return lines;
    }
}

export async function retrieveRanges(resource) {
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

export async function retrieveNamedRanges(resource) {
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

export async function retrieveRangesWithExtras(resource) {
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

export function retrieveBytesByIndex(resource, ranges, index) {
    var start = ranges[index];
    var end = ranges[index + 1];
    return retrieveBytes(resource, start, end);
}

export async function retrieveBytes(resource, start, end) {
    end--; // ignore the newline.

    var res = await downloader(resource, start, end);
    if (!res.ok) {
        throw "failed to fetch ranges for '" + resource + "'";
    }

    var txt = await res.text();
    return txt.slice(0, end - start); // make sure we limit it to the requested length.
}

export function convertToUint32Array(txt) { // Building back the indices from the diffs.
    var output = [];
    var last = 0;
    txt.split("\t").forEach(x => {
        var y = Number(x) + last;
        output.push(y);
        last = y;
    });
    return new Uint32Array(output);
}

/**
 * @param {Array} arrays - Array of arrays over which to compute the intersection.
 * @return {Array} Intersection of all arrays in `arrays`.
 */
export function intersect(arrays) {
    if (arrays.length == 0) {
        return [];
    } else if (arrays.length == 1) {
        return arrays[0];
    }

    let ref = new Set(arrays[0]);
    for (var i = 1; i < arrays.length; i++) {
        let running = new Set;
        for (const x of arrays[i]) {
            if (ref.has(x)) {
                running.add(x);
            }
        }
        ref = running;
    }

    return Array.from(ref);
}


