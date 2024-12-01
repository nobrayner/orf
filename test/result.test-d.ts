import { test, expectTypeOf } from "vitest";
import { Result, Ok, Error } from "../src/result";
import type { orf } from "../src/types";

test("InferOkType", () => {
  type Expectation = orf.InferOkType<
    | Result<0, string>
    | Result<1, string>
    | Ok<"Hi", number>
    | Error<false, boolean>
    | Ok<{ a: 1; b: 2 }, string>
    | Ok<{ a: 3; b: 4 }, string>
  >;

  const x: Expectation = null as unknown as Expectation;

  expectTypeOf(x).toMatchTypeOf<
    0 | 1 | "Hi" | false | { a: 1; b: 2 } | { a: 3; b: 4 }
  >();
});

test("InferErrorType", () => {
  type Expectation = orf.InferErrorType<
    | Result<number, 0>
    | Result<number, 1>
    | Ok<string, "Hi">
    | Error<boolean, false>
    | Ok<string, { code: "ERROR" }>
    | Ok<string, { code: "HELP" }>
  >;

  const x: Expectation = null as unknown as Expectation;
  expectTypeOf(x).toMatchTypeOf<
    0 | 1 | "Hi" | false | { code: "ERROR" } | { code: "HELP" }
  >();
});

test("Result.match can return two distinct types as a union", () => {
  expectTypeOf(
    Result.Ok(0 as const).match({
      Ok: (value) => value,
      Error: () => "INVALID" as const,
    })
  ).toMatchTypeOf<0 | "INVALID">();
  expectTypeOf(
    Result.Error(1).match({
      Ok: () => "INVALID" as const,
      Error: () => 0 as const,
    })
  ).toMatchTypeOf<0 | "INVALID">();
});

test("Result.mapOr can return two distinct types as a union", () => {
  expectTypeOf(
    Result.Ok(1 as const).mapOr(0 as const, () => "TEST" as const)
  ).toMatchTypeOf<0 | 1 | "TEST">();
  expectTypeOf(
    Result.Error(1 as const).mapOr(0 as const, () => "TEST" as const)
  ).toMatchTypeOf<0 | 1 | "TEST">();
});

test("Result.mapOrElse can return two distinct types as a union", () => {
  expectTypeOf(
    Result.Ok(1).mapOrElse(
      () => 0 as const,
      () => "TEST" as const
    )
  ).toMatchTypeOf<0 | "TEST">();
  expectTypeOf(
    Result.Error(1 as const).mapOrElse(
      () => 0 as const,
      () => "TEST" as const
    )
  ).toMatchTypeOf<0 | "TEST">();
});

test("Result.andThen can return two distinct types as a union", () => {
  expectTypeOf(
    Result.Ok<"YES", "ERROR">("YES").andThen(() => {
      let a = Math.random();

      if (a > 0.5) {
        return Result.Error("HELP" as const);
      }

      if (a < 0.3) {
        return Result.Error(1 as const);
      }

      return Result.Ok(0 as const);
    })
    // Error type gets appended to, new Ok type
  ).toMatchTypeOf<Result<0, "HELP" | 1 | "ERROR">>();
});

test("Result.orElse can return two distinct types as a union", () => {
  expectTypeOf(
    Result.Error<"YES", "ERROR">("ERROR").orElse(() => {
      let a = Math.random();

      if (a > 0.5) {
        return Result.Error("HELP" as const);
      }

      if (a < 0.3) {
        return Result.Error(1 as const);
      }

      return Result.Ok(0 as const);
    })
    // Ok type gets appended to, new error type
  ).toMatchTypeOf<Result<0 | "YES", "HELP" | 1>>();
});

test("Result.fromJSON being used doesn't type error", () => {
  Result.fromJSON(Result.Ok(1).toJSON()).match({
    Ok: () => {},
    Error: () => {},
  });
});

test("Result.all returns the correct type", () => {
  const ok1 = Result.fromExecution(
    () => 1 as const,
    () => "ERROR" as const
  );
  const ok2 = Result.fromExecution(
    () => "hi" as const,
    () => "ERROR" as const
  );
  const error1 = Result.fromExecution(
    (): 2 => {
      throw null;
    },
    () => "ERROR" as const
  );
  const error2 = Result.fromExecution(
    (): "bye" => {
      throw null;
    },
    () => "HELP" as const
  );

  expectTypeOf(Result.all([ok1, ok2])).toMatchTypeOf<
    Result<[1, "hi"], "ERROR">
  >();
  expectTypeOf(Result.all([ok1, error1])).toMatchTypeOf<
    Result<[1, 2], "ERROR">
  >();
  expectTypeOf(Result.all([error1, error2])).toMatchTypeOf<
    Result<[2, "bye"], "ERROR" | "HELP">
  >();
  expectTypeOf(Result.all([ok1, ok2, error1, error2])).toMatchTypeOf<
    Result<[1, "hi", 2, "bye"], "ERROR" | "HELP">
  >();
});

test("Result.allFromDict returns the correct type", () => {
  const ok1 = Result.fromExecution(
    () => 1 as const,
    () => "ERROR" as const
  );
  const ok2 = Result.fromExecution(
    () => "hi" as const,
    () => "ERROR" as const
  );
  const error1 = Result.fromExecution(
    (): 2 => {
      throw null;
    },
    () => "ERROR" as const
  );
  const error2 = Result.fromExecution(
    (): "bye" => {
      throw null;
    },
    () => "HELP" as const
  );

  expectTypeOf(Result.allFromDict({ ok1, ok2 })).toMatchTypeOf<
    Result<{ ok1: 1; ok2: "hi" }, "ERROR">
  >();
  expectTypeOf(Result.allFromDict({ ok1, error1 })).toMatchTypeOf<
    Result<{ ok1: 1; error1: 2 }, "ERROR">
  >();
  expectTypeOf(Result.allFromDict({ error1, error2 })).toMatchTypeOf<
    Result<{ error1: 2; error2: "bye" }, "ERROR" | "HELP">
  >();
  expectTypeOf(Result.allFromDict({ ok1, ok2, error1, error2 })).toMatchTypeOf<
    Result<{ ok1: 1; ok2: "hi"; error1: 2; error2: "bye" }, "ERROR" | "HELP">
  >();
});
