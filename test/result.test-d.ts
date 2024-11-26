import { test, expectTypeOf } from "vitest";

test("result types stub", () => {
  expectTypeOf(1).toMatchTypeOf<string>();
});
