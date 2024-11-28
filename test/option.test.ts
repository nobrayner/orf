import { vi, expect, test } from "vitest";
import { Option } from "../src/option";
import { Result } from "../src/result";

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
  expect(none.map((val) => `${val * 2}`)).toBe(none);
  expect(
    Option.Some({ test: 0 }).map((val) => {
      val.test++;
      return val;
    })
  ).toStrictEqual(
    Option.Some({
      test: 1,
    })
  );
});

test("Option.mapOr", () => {
  expect(some.mapOr(0, (val) => `${val * 2}`)).toStrictEqual("2");
  expect(none.mapOr(0, (val) => `${val * 2}`)).toStrictEqual(0);
});

test("Option.mapOrElse", () => {
  expect(
    some.mapOrElse(
      () => 0 as const,
      (val) => `${val * 2}`
    )
  ).toStrictEqual("2");
  expect(
    none.mapOrElse(
      () => 0 as const,
      (val) => `${val * 2}`
    )
  ).toStrictEqual(0);
});

test("Option.and", () => {
  expect(some.and(Option.None())).toStrictEqual(Option.None());
  expect(some.and(Option.Some("2"))).toStrictEqual(Option.Some("2"));
  expect(none.and(Option.Some("2"))).toBe(none);
  expect(none.and(Option.None())).toBe(none);
});

test("Option.andThen", () => {
  expect(some.andThen((val) => Option.Some(`${val * 2}`))).toStrictEqual(
    Option.Some("2")
  );
  expect(none.andThen(() => Option.None())).toStrictEqual(Option.None());
});

test("Option.or", () => {
  expect(some.or(Option.None())).toBe(some);
  expect(some.or(Option.Some(2))).toBe(some);
  expect(none.or(Option.Some(2))).toStrictEqual(Option.Some(2));
  expect(none.or(Option.None())).toStrictEqual(Option.None());
});

test("Option.orElse", () => {
  expect(some.orElse(() => Option.None())).toBe(some);
  expect(some.orElse(() => Option.Some(2))).toBe(some);
  expect(none.orElse(() => Option.Some(2))).toStrictEqual(Option.Some(2));
  expect(none.orElse(() => Option.None())).toStrictEqual(Option.None());
});

test("Option.tap", () => {
  const fn = vi.fn((val) => expect(val).toBe(1));

  const some_tap = some.tap(fn);
  expect(fn).toHaveBeenCalledWith(1);
  expect(fn).toHaveBeenCalledTimes(1);
  expect(some_tap).toBe(some);

  fn.mockClear();

  const none_tap = none.tap(fn);
  expect(fn).not.toHaveBeenCalled();
  expect(none_tap).toBe(none);
});

test("Option.tap doesn't modify the value", () => {
  const some = Option.from({
    test: 1,
  });

  expect(() => {
    // @ts-expect-error
    some.tap((val) => val.test++);
  }).toThrowError();

  expect(some).toStrictEqual(
    Option.Some({
      test: 1,
    })
  );
});

test("Option.unwrap", () => {
  expect(some.unwrap()).toBe(1);
  expect(() => none.unwrap()).toThrowError();
});

test("Option.unwrapOr", () => {
  expect(some.unwrapOr(0)).toStrictEqual(1);
  expect(some.unwrapOr("Hi")).toStrictEqual(1);
  expect(none.unwrapOr(0)).toStrictEqual(0);
  expect(none.unwrapOr("Hi")).toStrictEqual("Hi");
});

test("Option.unwrapOrElse", () => {
  expect(some.unwrapOrElse(() => 0)).toBe(1);
  expect(some.unwrapOrElse(() => "Hi")).toBe(1);
  expect(none.unwrapOrElse(() => 0)).toBe(0);
  expect(none.unwrapOrElse(() => "Hi")).toBe("Hi");
});

test("Option.okOr", () => {
  expect(some.okOr("error")).toStrictEqual(Result.Ok(1));
  expect(none.okOr("error")).toStrictEqual(Result.Error("error"));
});

test("Option.okOrElse", () => {
  expect(some.okOrElse(() => "error")).toStrictEqual(Result.Ok(1));
  expect(none.okOrElse(() => "error")).toStrictEqual(Result.Error("error"));
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
