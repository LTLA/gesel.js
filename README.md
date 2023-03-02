# Client-side gene set search

## Overview

Search for interesting gene sets, client-side.
This uses Javascript to do the queries in the browser, improving latency and avoiding the need for a back-end service.
The queries rely on prebuilt indices served with CORS, currently provided by Jay's CDN.

## Quick start

[**gesel**](https://www.npmjs.com/package/gesel) can be installed with the usual commands:

```sh
npm i gesel
```

**gesel** is implemented as an ES6 module, so importing is as simple as:

```js
import * as gesel from "gesel";
```

Before use, make sure to initialize the module first - this will download all necessary files.

```js
await gesel.initialize();
```

After that, most **gesel** functions can be called freely.

## Basic usage

Information about genes, sets and collections are immediately available by calling the relevant getters:

```js
let gene_info = gesel.genes();

// If 'includeSets = true' in initialize():
let set_info = gesel.sets();
let collection_info = gesel.collections();
```

The mapping functions will accept and return _indices_ into these arrays.

```js
# All sets involving the first gene.
let first_set = await gesel.fetchSetsForGene(0);

# All genes in the first set.
let first_set = await gesel.fetchGenesForSet(0);
```

Alternatively, given an index, we can determine the identity of the set/collection by querying the indices:

```js
let first_set_info = await gesel.fetchSetDetails(0); // first set
let first_collection_info = await gesel.fetchCollectionDetails(0); // first collection
```

Applications can use the search functions to perform more complex queries:

```js
// Find all sets that contain one or more of the supplied gene indices.
let sets_with_gene = await gesel.findOverlappingGenes([1, 10, 1000]); 

// Find all sets where the name matches a query string.
let sets_with_text = await gesel.searchSetText("KEGG immune");
``` 

See the [API documentation](http://pages.github.com/LTLA/gesel) for more details.

## For `gesel` maintainers

Indices and other assets are constructed using the `build_assets.R` script.
This pulls the latest versions of all public gene set collections from the Genomitory and constructs indices to map genes to sets.
All assets are stored in the `assets/` output directory, to be hosted on the server of choice.

On load, **gesel** will download some of these indices in full - any such files should be Gzip-compressed.
For simplicity, files used for range requests should be left uncompressed. 
We reduce the amount of data transfer by encoding the genes and sets as the diff of sorted integers,
so clients should take the cumulative sum to obtain the actual identifiers.

To build the documentation, use `npm run jsdoc` and update the `gh-pages` branch of this repository.

To test the package, use `npm run test`.
