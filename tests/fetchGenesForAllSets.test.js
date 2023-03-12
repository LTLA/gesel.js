import * as utils from "./utils.js";
import * as gesel from "../src/index.js"

test("fetching genes for all sets works correctly", async () => {
    let full = await gesel.fetchGenesForAllSets("9606");
    expect(full.length).toEqual(await gesel.numberOfSets("9606")); 

    let all_sizes = await gesel.fetchSetSizes("9606");
    let okay = 0;
    for (var i = 0; i < all_sizes.length; i++) {
        okay += all_sizes[i] == full[i].length;
    }
    expect(okay).toEqual(full.length);
})
