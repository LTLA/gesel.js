import * as gesel from "../src/index.js";
import * as internals from "../src/utils.js";
import * as fs from "fs";
import * as path from "path";
import "isomorphic-fetch";

const old_download = internals.downloader;
gesel.setDownload(async (file, start = null, end = null) => {
    if (start !== null) {
        return old_download(file, start, end);
    } else {
        const cache = "files";
        if (!fs.existsSync(cache)) {
            fs.mkdirSync(cache);
        }

        let cache_path = path.join(cache, file);
        if (!fs.existsSync(cache_path)) {
            let res = await old_download(file);
            fs.writeFileSync(cache_path, new Uint8Array(await res.arrayBuffer()));
        }

        let contents = fs.readFileSync(cache_path);
        let buffer = (new Uint8Array(contents)).buffer;
        return { ok: true, arrayBuffer: () => buffer }; // mimic Response object.
    }
});
