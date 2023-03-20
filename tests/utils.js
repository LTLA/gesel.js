import * as gesel from "../src/index.js";
import * as fs from "fs";
import * as path from "path";
import "isomorphic-fetch";

const old_ref_download = gesel.referenceDownload();
const old_gene_download = gesel.geneDownload();

async function dump(file, old) {
    const cache = "files";
    if (!fs.existsSync(cache)) {
        fs.mkdirSync(cache);
    }

    let cache_path = path.join(cache, file);
    if (!fs.existsSync(cache_path)) {
        let res = await old(file);
        fs.writeFileSync(cache_path, new Uint8Array(await res.arrayBuffer()));
    }

    let contents = fs.readFileSync(cache_path);
    let buffer = (new Uint8Array(contents)).buffer;
    return { ok: true, arrayBuffer: () => buffer }; // mimic Response object.
}

gesel.referenceDownload((file, start = null, end = null) => {
    if (start !== null) {
        return old_ref_download(file, start, end);
    } else {
        return dump(file, old_ref_download);
    }
});

gesel.geneDownload(file => dump(file, old_gene_download));
