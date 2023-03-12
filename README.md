# Client-side gene set search

## Overview

Search for interesting gene sets, client-side.
This uses Javascript to do the queries in the browser, improving latency and avoiding the need for a back-end service.
The queries rely on prebuilt references for gene sets of interest, e.g., [here](https://github.com/LTLA/gesel-feedstock).

## Installation

[**gesel**](https://www.npmjs.com/package/gesel) can be installed with the usual commands:

```sh
npm i gesel
```

**gesel** is implemented as an ES6 module, so importing is as simple as:

```js
import * as gesel from "gesel";
```

See the [API documentation](https://ltla.github.io/gesel.js) for all functions.

## Example usage

Given a user-supplied set of genes, what are the overlapping gene sets in our references?
First, we need to map our user-supplied genes to **gesel**'s internal identifiers.

```js
let user_supplied = [ "SNAP25", "NEUROD6", "ENSG00000123307", "TSPAN6" ];

/* Seeing if the user-supplied symbols/IDs are found in the human reference. */
let user_supplied_ids = await gesel.searchGenes("9606", user_supplied);

/* Taking the first matching ID for each user-supplied gene name. Applications
 * may prefer to print warnings/errors if there are multiple matches.
 */
let user_supplied_union = [];
for (const x of user_supplied_ids) {
    if (x.length >= 1) {
        user_supplied_union.push(x[0]);
    }
}
```

Then, we can search for the overlapping sets.
This returns an array of objects with the set IDs as well as the number of overlapping genes (and optionally the size of each set).

```js
let overlaps = await gesel.findOverlappingSets("9606", user_supplied_union);
```

Once we have a set ID, we can query the references to obtain that set's details:

```js
let set_details = await gesel.fetchSingleSet("9606", overlaps[0].id);
```

We can even perform a simple hypothesis test for enrichment based on the hypergeometric distribution:

```js
let all_genes = await gesel.fetchAllGenes("9606");
let pvalue = gesel.testEnrichment(
    overlaps[0].count, 
    user_supplied_union.length,
    set_details.size,
    gesel.effectiveNumberOfGenes("9606") // ignore genes that belong to no sets.
);
```

Each set also has some associated free text in its name and description.
We can do some simple queries via **gesel**:

```js
let hits = await gesel.searchSetText("9606", "B immune");
let first_hit = await gesel.fetchSingleSet(hits[0]);

// '*' and '?' wildcards are also supported.
let hits2 = await gesel.searchSetText("9606", "B immun*");
let first_hit2 = await gesel.fetchSingleSet(hits2[0]);
```

This can be combined with the output of `findOverlappingSets` to find all gene sets that overlap the user-supplied set _and_ contain the desired keywords.

```js
let combined = gesel.intersect([ hits, overlaps.map(x => x.id) ]);
``` 

## Overriding the downloader

By default, we use the reference gene sets collated in the [feedstock repository](https://github.com/LTLA/gesel-feedstock).
However, users can point **gesel** to their own references by overriding the downloaders before calling any **gesel** functions.
For example, if our prebuilt references are hosted on some other URL:

```js
const baseUrl = "https://some.company.com/prebuilt-gesel";

// To set the downloader for the reference files.
gesel.setReferenceDownload(async (file, start = null, end = null) => {
    const url = baseUrl + "/" + file;
    if (start == null) {
        return fetch(url, { headers: { Authorization: "Bearer XXX" } });
    } else {
        let range_text = "bytes=" + String(start) + "-" + String(end);
        return fetch(url, { headers: { Authorization: "Bearer XXX", Range: range_text } });
    }
});

// To set the downloader for gene information.
gesel.setGeneDownload(file => {
    const url = baseUrl + "/" + file;
    return fetch(url, { headers: { Authorization: "Bearer XXX" } });
});
```

## Implementation details

**gesel** uses HTTP range requests to efficiently extract slices of data from the pre-built references.
This allows us to obtain the identities of genes belonging to a particular gene set,
or the identities of the sets containing a particular gene,
or the details of a particular gene set or collection,
without downloading the entirety of the associated refences files.
Only the range indices need to be transferred to the client - as of time of writing, this amounts to an acceptably small payload (< 2 MB).

That said, some applications may prefer to download all the data up-front rather than performing range requests for each query.
This may be more performant for batch processing where repeated range requests would unnecessarily increase network activity.
In those cases, we provide functions like `fetchGenesForAllSets()` and options like `forceDownload = true` to trigger a full download of the relevant asset on first use.
Subsequent calls to related functions like `fetchGenesForSet()` will then re-use this data and skip range requests.

**gesel** will automatically cache responses in memory to reduce network traffic across the lifetime of a single session.
Note that no caching is done across sessions, though users can add their own (e.g., with IndexedDB or the Cache API) by overriding the downloader.
