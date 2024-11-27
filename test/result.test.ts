import { expect, test, vi } from "vitest";
import { Result } from "../src/result";
import { Option } from "../src/option";

// Use Result.fromExecution so that the return type is a full result,
// unlike Result.Ok or Result.Error which are just the Ok or Error type.
const ok = Result.fromExecution(() => 1);
const error = Result.fromExecution(
  (): number => {
    throw new Error("");
  },
  () => "ERROR" as const
);

test("Result.fromExecution", () => {
  expect(Result.fromExecution(() => 1)).toStrictEqual(Result.Ok(1));
  expect(
    Result.fromExecution(
      () => 1,
      () => "ERROR" as const
    )
  ).toStrictEqual(Result.Ok(1));
  expect(
    Result.fromExecution((): number => {
      throw new Error("HELP");
    })
  ).toStrictEqual(Result.Error(new Error("HELP")));
  expect(
    Result.fromExecution(
      (): number => {
        throw new Error("HELP");
      },
      () => "ERROR" as const
    )
  ).toStrictEqual(Result.Error("ERROR"));
});

test("Result.fromAwaitable", async () => {
  expect(await Result.fromAwaitable(Promise.resolve(1))).toStrictEqual(
    Result.Ok(1)
  );
  expect(
    await Result.fromAwaitable(Promise.resolve(1), () => "ERROR" as const)
  ).toStrictEqual(Result.Ok(1));
  expect(
    await Result.fromAwaitable(Promise.reject(new Error("HELP")))
  ).toStrictEqual(Result.Error(new Error("HELP")));
  expect(
    await Result.fromAwaitable(
      Promise.reject(new Error("HELP")),
      () => "ERROR" as const
    )
  ).toStrictEqual(Result.Error("ERROR"));
});

test("Result.isOk", () => {
  expect(ok.isOk()).toBe(true);
  expect(error.isOk()).toBe(false);
});

test("Result.isError", () => {
  expect(ok.isError()).toBe(false);
  expect(error.isError()).toBe(true);
});

test("Result.match", () => {
  expect(
    ok.match({
      Ok: () => true,
      Error: () => false,
    })
  ).toBe(true);
  expect(
    error.match({
      Ok: () => true,
      Error: () => false,
    })
  ).toBe(false);
});

test("Result.map", () => {
  expect(ok.map((val) => `${val * 2}`)).toStrictEqual(Result.Ok("2"));
  expect(error.map((val) => `${val * 2}`)).toBe(error);
});

test("Result.mapOr", () => {
  expect(ok.mapOr(0, (val) => `${val * 2}`)).toStrictEqual("2");
  expect(error.mapOr(0, (val) => `${val * 2}`)).toStrictEqual(0);
});

test("Result.mapOrElse", () => {
  expect(
    ok.mapOrElse(
      () => 0,
      (val) => `${val * 2}`
    )
  ).toStrictEqual("2");
  expect(
    error.mapOrElse(
      () => 0,
      (val) => `${val * 2}`
    )
  ).toStrictEqual(0);
});

test("Result.mapErr", () => {
  expect(ok.mapErr(() => "NEW ERROR")).toBe(ok);
  expect(error.mapErr(() => "NEW ERROR")).toStrictEqual(
    Result.Error("NEW ERROR")
  );
});

test("Result.and", () => {
  expect(ok.and(Result.Error("NEW ERROR"))).toStrictEqual(
    Result.Error("NEW ERROR")
  );
  expect(ok.and(Result.Ok("2"))).toStrictEqual(Result.Ok("2"));
  expect(error.and(Result.Ok("2"))).toBe(error);
  expect(error.and(Result.Error("NEW ERROR"))).toBe(error);
});

test("Result.andThen", () => {
  expect(ok.andThen((val) => Result.Ok(`${val * 2}`))).toStrictEqual(
    Result.Ok("2")
  );
  expect(error.andThen((val) => Result.Ok(`${val * 2}`)).isError()).toBe(true);
});

test("Result.or", () => {
  expect(ok.or(Result.Error("NEW ERROR"))).toBe(ok);
  expect(ok.or(Result.Ok("2"))).toBe(ok);
  expect(error.or(Result.Ok("2"))).toStrictEqual(Result.Ok("2"));
  expect(error.or(Result.Error("NEW ERROR"))).toStrictEqual(
    Result.Error("NEW ERROR")
  );
});

test("Result.orElse", () => {
  expect(ok.orElse(() => Result.Error("NEW ERROR"))).toBe(ok);
  expect(ok.orElse(() => Result.Ok("2"))).toBe(ok);
  expect(error.orElse(() => Result.Ok("2"))).toStrictEqual(Result.Ok("2"));
  expect(error.orElse(() => Result.Error("NEW ERROR"))).toStrictEqual(
    Result.Error("NEW ERROR")
  );
});

test("Result.tap", () => {
  const fn = vi.fn((val) => expect(val).toBe(1));

  const ok_tap = ok.tap(fn);
  expect(fn).toHaveBeenCalledWith(1);
  expect(fn).toHaveBeenCalledTimes(1);
  expect(ok_tap).toBe(ok);

  fn.mockReset();

  const error_tap = error.tap(fn);
  expect(fn).not.toHaveBeenCalled();
  expect(error_tap).toBe(error);
});

test("Result.tapError", () => {
  const fn = vi.fn((val) => expect(val).toBe("ERROR"));

  const ok_tap = ok.tapError(fn);
  expect(fn).not.toHaveBeenCalled();
  expect(ok_tap).toBe(ok);

  fn.mockReset();

  const error_tap = error.tapError(fn);
  expect(fn).toHaveBeenCalledWith("ERROR");
  expect(fn).toHaveBeenCalledTimes(1);
  expect(error_tap).toBe(error);
});

test("Result.ok", () => {
  expect(ok.ok()).toStrictEqual(Option.Some(1));
  expect(error.ok()).toStrictEqual(Option.None());
});

test("Result.unwrap", () => {
  expect(ok.unwrap()).toBe(1);
  expect(() => error.unwrap()).toThrowError();
});

test("Result.unwrapErr", () => {
  expect(() => ok.unwrapErr()).toThrowError();
  expect(error.unwrapErr()).toBe("ERROR");
});

test("Result.unwrapOr", () => {
  expect(ok.unwrapOr(0)).toStrictEqual(1);
  expect(ok.unwrapOr("Hi")).toStrictEqual(1);
  expect(error.unwrapOr(0)).toStrictEqual(0);
  expect(error.unwrapOr("Hi")).toStrictEqual("Hi");
});

test("Result.unwrapOrElse", () => {
  expect(ok.unwrapOrElse(() => 0)).toStrictEqual(1);
  expect(ok.unwrapOrElse(() => "Hi")).toStrictEqual(1);
  expect(error.unwrapOrElse(() => 0)).toStrictEqual(0);
  expect(error.unwrapOrElse(() => "Hi")).toStrictEqual("Hi");
});

test("Result.toJSON", () => {
  expect(ok.toJSON()).toStrictEqual({
    __orf_type__: "Result",
    tag: "Ok",
    value: 1,
  });
  expect(error.toJSON()).toStrictEqual({
    __orf_type__: "Result",
    tag: "Error",
    error: "ERROR",
  });
});

test("Result.isResult", () => {
  expect(Result.isResult(ok)).toBe(true);
  expect(Result.isResult(error)).toBe(true);
  expect(Result.isResult(Option.Some(1))).toBe(false);
  expect(Result.isResult(Option.None())).toBe(false);
  expect(Result.isResult(1)).toBe(false);
  expect(Result.isResult("ERROR")).toBe(false);
  expect(Result.isResult(null)).toBe(false);
});

test("Result.fromJSON", () => {
  const ok_json = ok.toJSON();
  const error_json = error.toJSON();

  expect(Result.fromJSON(ok_json)).toStrictEqual(ok);
  expect(Result.fromJSON(error_json)).toStrictEqual(error);
});

test("Result.all", () => {
  expect(Result.all([Result.Ok(1), Result.Ok(2)])).toStrictEqual(
    Result.Ok([1, 2])
  );
  expect(Result.all([Result.Ok(1), Result.Error("ERROR")])).toStrictEqual(
    Result.Error("ERROR")
  );
  expect(Result.all([Result.Error("ERROR"), Result.Ok(1)])).toStrictEqual(
    Result.Error("ERROR")
  );
  expect(
    Result.all([Result.Error("ERROR1"), Result.Error("ERROR2")])
  ).toStrictEqual(Result.Error("ERROR1"));
});

test("Result.allFromDict", () => {
  expect(
    Result.allFromDict({
      one: Result.Ok(1),
      two: Result.Ok(2),
    })
  ).toStrictEqual(Result.Ok({ one: 1, two: 2 }));
  expect(
    Result.allFromDict({
      one: Result.Ok(1),
      two: Result.Error("ERROR"),
    })
  ).toStrictEqual(Result.Error("ERROR"));
  expect(
    Result.allFromDict({
      one: Result.Error("ERROR"),
      two: Result.Ok(2),
    })
  ).toStrictEqual(Result.Error("ERROR"));
  expect(
    Result.allFromDict({
      one: Result.Error("ERROR1"),
      two: Result.Error("ERROR2"),
    })
  ).toStrictEqual(Result.Error("ERROR1"));
});
