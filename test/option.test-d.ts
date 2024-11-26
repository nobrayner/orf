import { test, expectTypeOf } from "vitest";

test("option types stub", () => {
  expectTypeOf(1).toMatchTypeOf<string>();
});
