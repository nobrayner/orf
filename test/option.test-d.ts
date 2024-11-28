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

test("Option.andThen can return distinct types as a union", () => {
  expectTypeOf(
    Option.Some<"YES">("YES").andThen(() => {
      let a = Math.random();

      if (a > 0.5) {
        return Option.Some("HELP" as const);
      }

      if (a < 0.3) {
        return Option.Some(1 as const);
      }

      return Option.None();
    })
    // Error type gets appended to, new Ok type
  ).toMatchTypeOf<Option<1 | "YES" | "HELP">>();
});

test("Option.orElse can return distinct types as a union", () => {
  expectTypeOf(
    Option.None<"YES">().orElse(() => {
      let a = Math.random();

      if (a > 0.5) {
        return Option.Some("HELP" as const);
      }

      if (a < 0.3) {
        return Option.Some(1 as const);
      }

      return Option.None();
    })
    // Ok type gets appended to, new error type
  ).toMatchTypeOf<Option<"YES" | "HELP" | 1>>();
});

test("Option.fromJSON being used doesn't type error", () => {
  Option.fromJSON(Option.from(1).toJSON()).match({
    Some: () => {},
    None: () => {},
  });
});
