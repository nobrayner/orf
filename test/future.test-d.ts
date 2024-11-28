import { test, expectTypeOf } from "vitest";
import { Future, FallibleFuture, Result } from "../src/orf";

test("FallibleFuture.andThen can return union of types", () => {
  type CustomError = null & { __brand__: "CUSTOM_ERROR" };

  const future = Future.success<number, CustomError>(1).andThen((x) => {
    if (x < 1) {
      return Result.Error("TOO_LOW");
    }
    if (x > 1) {
      return Result.Error(new Error("TOO_HIGH"));
    }
    if (x === 0) {
      return Result.Error({
        code: "ZERO" as const,
      });
    }

    return Future.success(true as const);
  });

  expectTypeOf(future).toMatchTypeOf<
    FallibleFuture<true, CustomError | string | Error | { code: "ZERO" }>
  >();
});

test("FallibleFuture.orElse can return union of types", () => {
  type CustomValue = null & { __brand__: "CUSTOM_VALUE" };

  const future = Future.fail<CustomValue, number>(1).orElse((x) => {
    if (x < 1) {
      return Result.Error("TOO_LOW");
    }
    if (x > 1) {
      return Result.Error(new Error("TOO_HIGH"));
    }
    if (x === 0) {
      return Result.Error({
        code: "ZERO" as const,
      });
    }

    return Future.success("ALL_IS_WELL" as const);
  });

  expectTypeOf(future).toMatchTypeOf<
    FallibleFuture<"ALL_IS_WELL", string | Error | { code: "ZERO" }>
  >();
});

test("Future.all can return union of types", () => {
  expectTypeOf(Future.all([Future.value(1), Future.value("2")])).toMatchTypeOf<
    Future<[number, string]>
  >();

  expectTypeOf(Future.all([Future.value(1), Future.fail("2")])).toMatchTypeOf<
    Future<[number, Result<never, string>]>
  >();

  expectTypeOf(
    Future.all([
      Future.value(1),
      Future.value("2"),
      Future.success(1),
      Future.fail("BOO"),
    ])
  ).toMatchTypeOf<
    Future<[number, string, Result<number, never>, Result<never, string>]>
  >();
});

test("Future.allFromDict can return union of types", () => {
  const a = Future.make<1>((r) => r(1));
  const b = Future.make<"Hi">((r) => r("Hi"));
  const c = Future.makeFallible<2, "ERROR1">((s) => s(2));
  const d = Future.makeFallible<"BOO", "ERROR2">((_, f) => f("ERROR2"));

  expectTypeOf(Future.allFromDict({ a, b })).toMatchTypeOf<
    Future<{ a: 1; b: "Hi" }>
  >();

  expectTypeOf(Future.allFromDict({ a, b: c })).toMatchTypeOf<
    FallibleFuture<{ a: 1; b: 2 }, "ERROR1">
  >();

  expectTypeOf(Future.allFromDict({ c, d })).toMatchTypeOf<
    FallibleFuture<{ c: 2; d: "BOO" }, "ERROR1" | "ERROR2">
  >();
});
