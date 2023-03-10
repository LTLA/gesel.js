const factorials = [1];

// Only exported for testing.
export function lfactorial(x) {
    // Trying to compute it exactly for low-ish numbers.
    if (x <= 44) {
        while (factorials.length <= x) {
            let current = factorials.length;
            factorials.push(factorials[current - 1] * current);
        }
        return Math.log(factorials[x]);
    } else {
        return x * Math.log(x) - x + 0.5 * Math.log(2 * x * 3.14159265358979323846);
    }
}

/**
 * Hypergeometric test for gene set enrichment, based on the overlap between a user-supplied list and the gene set.
 *
 * @param {number} overlap - Number of overlapping genes between the user's list and the gene set.
 * @param {number} listSize - Size of the user's list.
 * @param {number} setSize - Size of the gene set.
 * @param {number} universe - Size of the gene universe (i.e., the total number of genes for this species).
 *
 * @return {number} P-value for the enrichment of the user's list in the gene set.
 */
export function testEnrichment(overlap, listSize, setSize, universeSize) {
    // This code is pretty much paraphrased from R's dhyper.c.
    let notInSet = universeSize - setSize;
    let inSet = setSize;
    let flip = false;

    // Mark out impossible or obvious things.
    if (overlap > listSize || overlap > inSet || listSize > universeSize || notInSet < 0) {
        return 0;
    }

    if (overlap < listSize - notInSet) {
        return 0;
    }

    if (listSize == universeSize) {
        return Number(inSet == overlap);
    }

    if (notInSet == 0) {
        return Number(listSize == overlap)
    }

    // Swapping if the probabilities are too high, to avoid excessive
    // cumulative sums and associated inaccuracies as it approaches unity.
    if (inSet > 0 && universeSize > 0 && overlap / inSet > listSize / universeSize) {
        overlap = listSize - overlap - 1;
        let tmp = inSet;
        inSet = notInSet;
        notInSet = tmp;
        flip = true;
    }

    // Computing the cumulative part of the cumulative probability.
    // This is equivalent to the ratio of the cumulative probability
    // with the probability mass of the hypergeometric distribution.
    let counter = overlap;
    let psum = 0;
    let running = 1;
    while (counter > 0 && running > 0) {
        running *= counter * (notInSet - listSize + counter) / (listSize + 1 - counter) / (inSet + 1 - counter);
        psum += running;
        counter--;
    }
    psum += 1;

    // Now computing the scaling part, i.e., the probability mass.
    let dmass = (lfactorial(inSet) - lfactorial(overlap) - lfactorial(inSet - overlap)) + // choose(inSet, overlap)
        (lfactorial(notInSet) - lfactorial(listSize - overlap) - lfactorial(notInSet - listSize + overlap)) - // choose(notInSet, listSize - overlap)
        (lfactorial(universeSize) - lfactorial(listSize) - lfactorial(universeSize - listSize)); // choose(universeSize, listSize)

    let finalp = psum * Math.exp(dmass);
    return (flip ? finalp : 1 - finalp);
}
