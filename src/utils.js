import * as pako from "pako";

export const baseUrl = "https://github.com/LTLA/gesel-feedstock/releases/download/indices-v1.0.0";

export function decompressLines(buffer) {
    var contents = pako.inflate(new Uint8Array(buffer));
    const txt = new TextDecoder();
    var lines = txt.decode(contents).split("\n");
    return lines.slice(0, lines.length - 1); // remove empty string at trailing newline.
}
