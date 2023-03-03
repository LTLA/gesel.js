import * as utils from "./utils.js";
import * as gesel from "../src/index.js"

test("fetching genes for sets works correctly, more or less", async () => {
    let N = await gesel.numberOfSets();
    for (var i = 0; i < 10; i++) {
        let opt = Math.trunc(Math.random() * N);
        var val = await gesel.fetchGenesForSet(opt);
        expect(val.length > 0).toBe(true);
    }

    let last = N - 1;
    var val = await gesel.fetchGenesForSet(last);
    expect(val.length > 0).toBe(true);
});