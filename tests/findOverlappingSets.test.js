import * as gesel from "../src/index.js";
import * as utils from "./utils.js";

test("finding overlapping sets works as expected", async () => {
    var found = await gesel.findOverlappingSets("9606", [0, 1, 2, 3, 4, 100, 101, 102, 103], { includeSize: true });
    expect(found.length > 0).toBe(true);

    let okay = 0;
    for (const x of found) {
        okay += x.count >= 1 && x.count <= x.size;
    }
    expect(okay).toEqual(found.length);
})
