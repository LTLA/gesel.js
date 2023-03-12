import * as utils from "./utils.js";
import * as gesel from "../src/index.js"

test("fetching sets for all genes works correctly", async () => {
    let full = await gesel.fetchSetsForAllGenes("10090");
    expect(full.length).toEqual((await gesel.fetchAllGenes("10090")).get("ensembl").length); 
})
