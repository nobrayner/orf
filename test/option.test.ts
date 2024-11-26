import { vi, expect, test } from "vitest";
import { Option } from "../src/option";

const some = Option.from(1);
const none = Option.from<number>(null);

test("Option.isSome", () => {
  expect(some.isSome()).toBe(true);
  expect(some.isNone()).toBe(false);
});

test("Option.isNone", () => {
  expect(none.isSome()).toBe(false);
  expect(none.isNone()).toBe(true);
});

test("Option.match", () => {
  expect(
    some.match({
      Some: (value) => value,
      None: () => 0,
    })
  ).toBe(1);
  expect(
    none.match({
      Some: (value) => value,
      None: () => 0,
    })
  ).toBe(0);
});

test("Option.map", () => {
  expect(some.map((val) => `${val * 2}`)).toStrictEqual(Option.Some("2"));
  expect(none.map((val) => `${val * 2}`)).toStrictEqual(Option.None());
});

test("Option.mapOr", () => {
  expect(some.mapOr(0, (val) => `${val * 2}`)).toStrictEqual(Option.Some("2"));
  expect(none.mapOr(0, (val) => `${val * 2}`)).toStrictEqual(Option.Some(0));
});

test("Option.mapOrElse", () => {
  expect(
    some.mapOrElse(
      () => 0 as const,
      (val) => `${val * 2}`
    )
  ).toStrictEqual(Option.Some("2"));
  expect(
    none.mapOrElse(
      () => 0 as const,
      (val) => `${val * 2}`
    )
  ).toStrictEqual(Option.Some(0));
});

test("Option.and", () => {
  expect(some.and(Option.None())).toStrictEqual(Option.None());
  expect(some.and(Option.Some("2"))).toStrictEqual(Option.Some("2"));
  expect(none.and(Option.Some("2"))).toStrictEqual(none);
  expect(none.and(Option.None())).toStrictEqual(none);
});

test("Option.andThen", () => {
  expect(some.andThen((val) => Option.Some(`${val * 2}`))).toStrictEqual(
    Option.Some("2")
  );
  expect(none.andThen(() => Option.None())).toStrictEqual(Option.None());
  expect(
    some.andThen((val) => {
      if (val > 1) {
        return Option.Some(val * 2);
      }
      if (val === 1) {
        return Option.Some("INVALID" as const);
      }

      return Option.None<null>();
    })
  ).toStrictEqual(Option.Some("INVALID"));
});

test("Option.or", () => {
  expect(some.or(Option.None())).toStrictEqual(some);
  expect(some.or(Option.Some(2))).toStrictEqual(some);
  expect(none.or(Option.Some(2))).toStrictEqual(Option.Some(2));
  expect(none.or(Option.None())).toStrictEqual(Option.None());
});

test("Option.orElse", () => {
  expect(some.orElse(() => Option.None())).toStrictEqual(some);
  expect(some.orElse(() => Option.Some(2))).toStrictEqual(some);
  expect(none.orElse(() => Option.Some(2))).toStrictEqual(Option.Some(2));
  expect(none.orElse(() => Option.None())).toStrictEqual(Option.None());
});

test("Option.tap", () => {
  const fn = vi.fn();

  some.tap(fn);
  expect(fn).toHaveBeenCalledWith(1);

  fn.mockReset();

  none.tap(fn);
  expect(fn).not.toHaveBeenCalled();
});

test("Option.unwrap", () => {
  expect(some.unwrap()).toBe(1);
  expect(() => none.unwrap()).toThrowError();
});

test("Option.unwrapOr", () => {
  expect(some.unwrapOr(0)).toBe(1);
  expect(none.unwrapOr(0)).toBe(0);
});

test("Option.unwrapOrElse", () => {
  expect(some.unwrapOrElse(() => 0)).toBe(1);
  expect(none.unwrapOrElse(() => 0)).toBe(0);
});

test("Option.toJSON", () => {
  expect(some.toJSON()).toStrictEqual({
    __orf_type__: "Option",
    tag: "Some",
    value: 1,
  });
  expect(none.toJSON()).toStrictEqual({ __orf_type__: "Option", tag: "None" });
});

test("Option.isOption", () => {
  expect(Option.isOption(some)).toBe(true);
  expect(Option.isOption(none)).toBe(true);
  expect(Option.isOption(1)).toBe(false);
  expect(Option.isOption(null)).toBe(false);
});

test("Option.fromJSON", () => {
  const some_json = some.toJSON();
  const none_json = none.toJSON();

  expect(Option.fromJSON(some_json)).toStrictEqual(some);
  expect(Option.fromJSON(none_json)).toStrictEqual(none);
});
