import { test, expectTypeOf } from "vitest";
import { Result } from "../src/result";

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
  expectTypeOf(Result.Ok(1).mapOr(0, (val) => `${val * 2}`)).toMatchTypeOf<
    number | string
  >();
  expectTypeOf(Result.Error(1).mapOr(0, (val) => `${val * 2}`)).toMatchTypeOf<
    number | string
  >();
});

test("Result.mapOrElse can return two distinct types as a union", () => {
  expectTypeOf(
    Result.Ok(1).mapOrElse(
      () => 0 as const,
      (val) => `${val * 2}`
    )
  ).toMatchTypeOf<0 | string>();
  expectTypeOf(
    Result.Error(1).mapOrElse(
      () => 0 as const,
      (val) => `${val * 2}`
    )
  ).toMatchTypeOf<0 | string>();
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
