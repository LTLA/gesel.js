/**
 * Adjust p-values to control the false discovery rate using the Benjamini-Hochberg method.
 * This is primarily intended for use with p-values from {@linkcode testEnrichment},
 * typically using the total number of sets from {@linkcode numberOfSets} as `totalTests`.
 *
 * @param {Float64Array} pvalues - Array of p-values.
 * @param {object} [options={}] - Optional parameters.
 * @param {?number} [options.totalTests=null] - Total number of tests.
 * If `null`, defaults to the length of `pvalues`.
 * If greater than `pvalues`, all tests not in `pvalues` are assumed to have p-values of 1.
 *
 * @return {Float64Array} Array of length equal to `pvalues`, containing the BH-adjusted p-values.
 */
export function adjustFdr(pvalues, { totalTests = null } = {}) {
    if (totalTests == null) {
        totalTests = pvalues.length;
    } else if (totalTests < pvalues.length) {
        throw new Error("'totalTests' should not be less than the length of 'pvalues'");
    }

    let indices = new Int32Array(pvalues.length);
    indices.forEach((x, i) => { indices[i] = i; });
    indices.sort((a, b) => pvalues[a] - pvalues[b]);

    let adjusted = new Float64Array(pvalues.length);
    indices.forEach((x, i) => {
        adjusted[i] = pvalues[x] * totalTests / (i + 1);
    });

    let cummin = 1;
    for (var i = adjusted.length - 1; i >= 0; i--) {
        if (cummin < adjusted[i]) {
            adjusted[i] = cummin;
        } else {
            cummin = adjusted[i];
        }
    }

    let output = new Float64Array(pvalues.length);
    indices.forEach((x, i) => {
        output[x] = adjusted[i];
    });

    return output;
}
