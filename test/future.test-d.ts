import { test, expectTypeOf } from "vitest";

test("future types stub", () => {
  expectTypeOf(1).toMatchTypeOf<string>();
});
