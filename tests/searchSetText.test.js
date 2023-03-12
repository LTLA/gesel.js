import * as gesel from "../src/index.js";
import * as search from "../src/searchSetText.js";
import * as utils from "./utils.js";
import "isomorphic-fetch"

test("searching by text works as expected", async () => {
    let all_info = await gesel.fetchAllSets("10090");

    // Searching the names only.
    {
        let results = await gesel.searchSetText("10090", "GO 0000002", { inDescription: false });
        expect(results.length).toBeGreaterThan(0);
        expect(all_info[results[0]].name).toEqual("GO:0000002");
    }

    // Searching the descriptions only.
    {
        let results = await gesel.searchSetText("10090", "metabolism", { inName: false });
        expect(results.length).toBeGreaterThan(0);
        for (var i = 0; i < Math.min(10, results.length); i++) {
            let deets = await gesel.fetchSingleSet("10090", results[i]);
            expect(deets.description).toMatch(/metabolism/i);
        }
    }

    // Multiword search.
    {
        let results = await gesel.searchSetText("10090", "T immune");
        expect(results.length).toBeGreaterThan(0);
        for (var i = 0; i < Math.min(10, results.length); i++) {
            let deets = await gesel.fetchSingleSet("10090", results[i]);
            expect(deets.description).toMatch(/T.*immune/i);
        }
    }
})

test("binary search works as expected", async () => {
    let ref = [ "A", "B", "C", "D", "E" ];
    expect(search.binarySearch("A", ref)).toEqual(0);
    expect(search.binarySearch("0", ref)).toEqual(0);
    expect(search.binarySearch("AB", ref)).toEqual(1);
    expect(search.binarySearch("C", ref)).toEqual(2);
    expect(search.binarySearch("CD", ref)).toEqual(3);
    expect(search.binarySearch("E", ref)).toEqual(4);
    expect(search.binarySearch("E0", ref)).toEqual(5);
    expect(search.binarySearch("F", ref)).toEqual(5);
})

test("searching by text works with wildcards", async () => {
    let everything = await gesel.fetchAllSets("10090");

    // Single word search.
    {
        let results = await gesel.searchSetText("10090", "immun*");
        expect(results.length).toBeGreaterThan(0);

        let has_immunity = 0;
        let has_immune = 0;
        let is_okay = 0;
        for (var i = 0; i < results.length; i++) {
            let deets = await gesel.fetchSingleSet("10090", results[i]);
            has_immune += deets.description.match("immune") !== null;
            has_immunity += deets.description.match("immunity") !== null;
            is_okay += deets.description.match("immun") !== null;
        }

        expect(has_immune).toBeGreaterThan(0);
        expect(has_immunity).toBeGreaterThan(0);
        expect(is_okay).toBe(results.length);
    }

    // Multiword search.
    {
        let results = await gesel.searchSetText("10090", "B immun*");
        expect(results.length).toBeGreaterThan(0);

        let has_immunity = 0;
        let has_immune = 0;
        let is_okay = 0;
        for (var i = 0; i < results.length; i++) {
            let deets = await gesel.fetchSingleSet("10090", results[i]);
            has_immune += deets.description.match(/B.*immune/) !== null;
            has_immunity += deets.description.match(/B.*immunity/) !== null;
            is_okay += deets.description.match(/B/) !== null && deets.description.match(/immun.*/) !== null;
        }

        expect(has_immune).toBeGreaterThan(0);
        expect(has_immunity).toBeGreaterThan(0);
        expect(is_okay).toBe(results.length);
    }
})

test("searching by text works with preloading", async () => {
    let all_info = await gesel.fetchAllSets("10090");
    await gesel.preloadSearchSetText("10090");
    let results = await gesel.searchSetText("10090", "GO 0000009");
    expect(all_info[results[0]].name).toEqual("GO:0000009");
})
