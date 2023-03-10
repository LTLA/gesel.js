import * as gesel from "../src/index.js";
import * as internals from "../src/testEnrichment.js";

test("factorial calculations work as expected", () => {
    // Works for small values.
    expect(internals.lfactorial(0)).toBeCloseTo(0);
    expect(internals.lfactorial(1)).toBeCloseTo(0);
    expect(internals.lfactorial(2)).toBeCloseTo(Math.log(2));
    expect(internals.lfactorial(10)).toBeCloseTo(Math.log(3628800));

    // Stirling's approximation works well enough.
    expect(internals.lfactorial(50)).toBeCloseTo(148.4778, 2); 
    expect(internals.lfactorial(100)).toBeCloseTo(363.7394, 2); 
})

test("testing for enrichment works as expected", () => {
    expect(internals.testEnrichment(11, 50, 100, 2000) / 2.060757e-05).toBeCloseTo(1, 2); // phyper(10, 100, 1900, 50, lower.tail=FALSE)
    expect(internals.testEnrichment(6, 100, 20, 2000) / 0.0002945125).toBeCloseTo(1, 2); // phyper(5, 20, 1980, 100, lower.tail=FALSE)
    expect(internals.testEnrichment(1, 10, 50, 2000) / 0.2241196).toBeCloseTo(1, 2); // phyper(0, 50, 1950, 10, lower.tail=FALSE)
    expect(internals.testEnrichment(1, 100, 50, 2000) / 0.9255374).toBeCloseTo(1, 2); // phyper(0, 50, 1950, 100, lower.tail=FALSE)
    expect(internals.testEnrichment(0, 100, 50, 2000)).toBe(1);
})

test("testing for enrichment handles the edge cases", () => {
    expect(internals.testEnrichment(100, 20, 200, 2000)).toBeNaN();
    expect(internals.testEnrichment(100, 200, 50, 2000)).toBeNaN();
    expect(internals.testEnrichment(10, 200, 10, 100)).toBeNaN();
    expect(internals.testEnrichment(10, 200, 1000, 500)).toBeNaN();

    expect(internals.testEnrichment(10, 30, 50, 51)).toBeNaN();

    expect(internals.testEnrichment(10, 50, 20, 50)).toBeNaN();
    expect(internals.testEnrichment(20, 50, 20, 50)).toBe(1);
    expect(internals.testEnrichment(10, 20, 50, 50)).toBeNaN();
    expect(internals.testEnrichment(20, 20, 50, 50)).toBe(1);
})

