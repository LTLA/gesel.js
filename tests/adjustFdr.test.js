import * as gesel from "../src/index.js";

test("adjustFdr works as expected", async () => {
    let adj = gesel.adjustFdr([ 0.5, 0.1, 0.01, 0.2, 0.05 ]);

    // From p.adjust(c(0.5, 0.1, 0.01, 0.2, 0.05), method="BH")
    expect(adj[0]).toBeCloseTo(0.5000000);
    expect(adj[1]).toBeCloseTo(0.1666667);
    expect(adj[2]).toBeCloseTo(0.0500000);
    expect(adj[3]).toBeCloseTo(0.2500000);
    expect(adj[4]).toBeCloseTo(0.1250000);
})

test("adjustFdr works as expected with a total number of tests", async () => {
    let adj = gesel.adjustFdr([ 0.5, 0.1, 0.01, 0.2, 0.05 ], { totalTests: 10 });

    // From p.adjust(c(0.5, 0.1, 0.01, 0.2, 0.05), method="BH", n=10)
    expect(adj[0]).toBeCloseTo(1.0000000);
    expect(adj[1]).toBeCloseTo(0.3333333);
    expect(adj[2]).toBeCloseTo(0.1000000);
    expect(adj[3]).toBeCloseTo(0.5000000);
    expect(adj[4]).toBeCloseTo(0.2500000);

    expect(() => gesel.adjustFdr([ 0.5, 0.1, 0.01, 0.2, 0.05 ], { totalTests: 1 })).toThrow("should not be less");
})

