import * as gesel from "../src/index.js"
import "isomorphic-fetch"

beforeAll(async () => { await gesel.initialize({ includeSets: true }); }, 10000);

test("sets extraction works as expected", async () => {
    var s = gesel.sets();
    expect(s.length > 0).toBe(true);
    expect(s.length).toEqual(gesel.totalSets());

    var alt = gesel.lowerCaseSetDetails();
    expect(s.length).toBe(alt.length);

    expect(s[0].name.toLowerCase()).toBe(alt[0].name);

    // Same result as fetchSetDetails.
    let jump = Math.trunc(s.length / 10);
    for (var i = 0; i < s.length; i += jump) {
        expect(s[i]).toEqual(await gesel.fetchSetDetails(i));
    }
});

test("collections extraction works as expected", async () => {
    var c = gesel.collections();
    expect(c.length > 0).toBe(true);

    var s = gesel.sets();
    var first_set = s[0];
    expect(first_set.number).toBe(0);
    var first_col = c[first_set.collection];
    expect(first_col.start).toBe(0);
    expect(first_col.size > 0).toBe(true);

    var last_set = s[s.length - 1];
    var last_col = c[last_set.collection];
    expect(last_col.size - 1).toBe(last_set.number);
    expect(last_col.size > 0).toBe(true);

    // Same result as fetchCollectionDetails.
    let jump = Math.trunc(c.length / 10);
    for (var i = 0; i < c.length; i += jump) {
        expect(c[i]).toEqual(await gesel.fetchCollectionDetails(i));
    }
});
