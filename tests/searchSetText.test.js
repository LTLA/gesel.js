import * as gesel from "../src/index.js";
import * as utils from "./utils.js";
import "isomorphic-fetch"

test("searching by text works as expected", async () => {
    let all_info = await gesel.fetchAllSets();

    // Searching the names.
    {
        let results = await gesel.searchSetText("GO 0000001", { inDescription: false });
        expect(results.length).toBeGreaterThan(0);
        expect(all_info[results[0]].name).toEqual("GO:0000001");
    }

    // Searching the descriptions.
    {
        let results = await gesel.searchSetText("metabolism", { inName: false });
        expect(results.length).toBeGreaterThan(0);
        for (var i = 0; i < Math.min(10, results.length); i++) {
            let deets = await gesel.fetchSingleSet(results[i]);
            expect(deets.description).toMatch(/metabolism/i);
        }
    }

    // Multiword search.
    {
        let results = await gesel.searchSetText("T immune", { inName: false });
        expect(results.length).toBeGreaterThan(0);
        for (var i = 0; i < Math.min(10, results.length); i++) {
            let deets = await gesel.fetchSingleSet(results[i]);
            expect(deets.description).toMatch(/T.*immune/i);
        }
    }
})

