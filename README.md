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

/* Seeing if the user-supplied symbols/IDs are found in the reference. */
let user_supplied_ids = await gesel.searchGenes(user_supplied, "Homo sapiens");

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
let overlaps = await gesel.findOverlappingSets(user_supplied_union, { includeSize: true });
```

Once we have a set ID, we can query the references to obtain that set's details:

```js
let set_details = await gesel.fetchSingleSet(overlaps[0].id);
```

Each set also has some associated free text in its name and description.
We can do some simple queries via **gesel**:

```js
let hits = await gesel.searchSetText("B immune");
let first_hit = await gesel.fetchSingleSet(hits[0]);

// '*' and '?' wildcards are also supported.
let hits2 = await gesel.searchSetText("B immun*");
let first_hit2 = await gesel.fetchSingleSet(hits2[0]);
```

This can be combined with the output of `findOverlappingSets` to find all gene sets that overlap the user-supplied set _and_ contain the desired keywords.

```js
let combined = gesel.intersect([ hits, overlaps.map(x => x.id) ]);
``` 

## Overriding the downloader

By default, we use the reference gene sets collated in the [feedstock repository](https://github.com/LTLA/gesel-feedstock).
However, users can point **gesel** to their own references by overriding the downloader before calling any **gesel** functions.
For example, if our prebuilt references are hosted on some other URL:

```js
const baseUrl = "https://some.company.com/prebuilt-gesel";

gesel.setDownload(async (file, start = null, end = null) => {
    const url = baseUrl + "/" + file;
    if (start == null) {
        return fetch(url, { headers: { Authorization: "Bearer XXX" } });
    } else {
        let range_text = "bytes=" + String(start) + "-" + String(end);
        return fetch(url, { headers: { Authorization: "Bearer XXX", Range: range_text } });
    }
});
```

## Implementation details

**gesel** uses HTTP range requests to efficiently extract slices of data from the pre-built references.
This allows us to obtain the identities of genes belonging to a particular gene set,
or the identities of the sets containing a particular gene,
or the details of a particular gene set or collection,
without downloading the entirety of the associated refences files.
Only the range indices need to be transferred to the client - as of time of writing, this amounts to an acceptably small payload (< 2 MB).

**gesel** will automatically cache responses in memory to reduce network traffic across the lifetime of a single session.
Note that no caching is done across sessions, though users can add their own (e.g., with IndexedDB or the Cache API) by overriding the downloader.

