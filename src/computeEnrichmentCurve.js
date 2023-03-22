/**
 * Compute an enrichment curve from a gene ranking.
 * At each position in the ranking, the value of the curve is defined as the proportion of genes with the same or higher rank that are present in the gene set.
 * This can be used to visualize the change in enrichment as the ranking changes, typically with respect to some kind of decreasing importance.
 *
 * @param {Array|TypedArray} ranking - Ranking of genes, where earlier entries are considered to be more highly ranked.
 * Each entry may either be an integer representing a gene (typically a **gesel** gene ID),
 * or an array of such integers, e.g., as produced by {@linkcode searchGenes}.
 * @param {Set|Array|TypedArray} setMembers - Array of integers specifying the genes (typically **gesel** gene IDs) belonging to the gene set.
 * A preconstructed Set may also be supplied.
 * @param {object} [options={}] - Optional parameters.
 * @param {number} [options.pseudoCount=5] - Count to add to the total number of genes when computing the proportion.
 * This avoids large fluctuations at the start of the curve at the cost of biasing the reported proportions.
 * 
 * @return {object} Object containing the following properties:
 * 
 * - `proportions`: a Float64Array of length equal to `ranking`.
 *   Each entry contains the proportion of genes with equal or higher ranks that belong to the set.
 * - `found`: a Uint32Array containing the indices of `ranking` corresponding to the genes that were found in the set.
 */
export function computeEnrichmentCurve(ranking, setMembers, { pseudoCount = 5 } = {}) {
    if (!(setMembers instanceof Set)) {
        setMembers = new Set(setMembers);
    }

    let output = new Float64Array(ranking.length);
    let hits = [];
    let found = 0;
    let total = pseudoCount;

    for (var i = 0; i < ranking.length; i++) {
        let x = ranking[i];
        let hit = false;
        if (typeof x == "number") {
            hit = setMembers.has(x);
        } else {
            for (const y of x) {
                if (setMembers.has(y)) {
                    hit = true;
                    break;
                }
            }
        }

        if (hit) {
            hits.push(i);
            found++;
        }
        total++;

        output[i] = found / total;
    }

    return {
        proportions: output,
        found: new Uint32Array(hits)
    };
}
