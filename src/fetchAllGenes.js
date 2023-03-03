import { downloader, decompressLines } from "./utils.js";

var gene_symbol_init = false;
var gene_entrez_init = false;
var _genes = null;

function add_mapping(gene_data, key) {
    if (_genes == null) {
        _genes = [];
        for (const x of gene_data) {
            let details = x.split("\t");
            let obj = { ensembl: details[0] };
            obj[key] = details.slice(1);
            _genes.push(obj);
        }
    } else {
        if (gene_data.length !== _genes.length) {
            throw new Error("discrepancy between length of symbol and entrez mappings");
        }

        for (var i = 0; i < gene_data.length; i++) {
            let x = gene_data[i];
            let existing = _genes[i];

            let details = x.split("\t");
            if (details[0] !== existing.ensembl) {
                throw new Error("discrepancy between symbol and entrez mappings for " + details[0]);
            }
 
            existing[key] = details.slice(1);
        }
    }
}

/**
 * @param {object} [options={}] - Optional parameters.
 * @param {string} [options.mapping="symbol"] - Which mappings from Ensembl IDs should be retrived.
 * This may be `"symbol"`, `"entrez"` or `"both"`.
 *
 * @return {Array} Array of objects where each object corresponds to a gene and contains the following properties:
 *
 * - `ensembl`: string containing the Ensembl ID for the gene.
 * - `symbol`: array containing strings with the gene symbols.
 *   This is only guaranteed to exist if `mapping = "symbol"` or `mapping = "both"`.
 * - `entrez`: array containing strings with the Entrez IDs.
 *   This is only guaranteed to exist if `mapping = "entrez"` or `mapping = "both"`.
 *
 * In the context of **gesel**, the identifier for each gene (i.e., the "gene ID") is encoded as its index in this output array.
 *
 * @async
 */
export async function fetchAllGenes({ mapping = "symbol" } = {}) {
    let symbol = (mapping == "symbol" || mapping == "both");
    if (symbol && !gene_symbol_init) {
        var res = await downloader("symbol2gene.tsv.gz")
        if (!res.ok) {
            throw "failed to fetch symbol information for genes";
        }
        var buffer = await res.arrayBuffer();
        let gene_data = decompressLines(buffer);
        add_mapping(gene_data, "symbol");
        gene_symbol_init = true;
    }

    let entrez = (mapping == "entrez" || mapping == "both");
    if (entrez && !gene_entrez_init) {
        var res = await downloader("entrez2gene.tsv.gz")
        if (!res.ok) {
            throw "failed to fetch Entrez information for genes";
        }
        var buffer = await res.arrayBuffer();
        let gene_data = decompressLines(buffer);
        add_mapping(gene_data, "entrez");
        gene_entrez_init = true;
    }

    return _genes;
}
