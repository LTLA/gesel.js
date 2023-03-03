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
 * Applications may specify a different function, e.g., to point to another set of indices; this should be done before calling any {@linkcode initialize} functions.
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
