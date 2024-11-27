import { test, expectTypeOf } from "vitest";
import { Option } from "../src/option";

test("Option.match can return two distinct types as a union", () => {
  expectTypeOf(
    Option.Some(0 as const).match({
      Some: (value) => value,
      None: () => "INVALID" as const,
    })
  ).toMatchTypeOf<0 | "INVALID">();
  expectTypeOf(
    Option.None().match({
      Some: () => "INVALID" as const,
      None: () => 0 as const,
    })
  ).toMatchTypeOf<0 | "INVALID">();
});

test("Option.mapOr can return two distinct types as a union", () => {
  expectTypeOf(Option.Some(1).mapOr(0, (val) => `${val * 2}`)).toMatchTypeOf<
    number | string
  >();
  expectTypeOf(Option.None<1>().mapOr(0, (val) => `${val * 2}`)).toMatchTypeOf<
    number | string
  >();
});

test("Option.mapOrElse can return two distinct types as a union", () => {
  expectTypeOf(
    Option.Some(1).mapOrElse(
      () => 0 as const,
      (val) => `${val * 2}`
    )
  ).toMatchTypeOf<0 | string>();
  expectTypeOf(
    Option.None<1>().mapOrElse(
      () => 0 as const,
      (val) => `${val * 2}`
    )
  ).toMatchTypeOf<0 | string>();
});

test("Option.fromJSON being used doesn't type error", () => {
  Option.fromJSON(Option.from(1).toJSON()).match({
    Some: () => {},
    None: () => {},
  });
});
