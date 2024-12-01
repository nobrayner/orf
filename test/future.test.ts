import { expect, test, vi } from "vitest";
import { Future, Result, Option } from "../src/orf";

test("Future.value", async () => {
  const future = Future.value(1);
  future.onResolved((value) => {
    expect(value).toBe(1);
  });

  await expect(future).resolves.toStrictEqual(Option.Some(1));
});

test("Future.success", async () => {
  const future = Future.success(1);
  future.onSucceeded((value) => {
    expect(value).toBe(1);
  });

  await expect(future).resolves.toStrictEqual(Option.Some(Result.Ok(1)));
});

test("Future.fail", async () => {
  const future = Future.fail(1);
  future.onFailed((error) => {
    expect(error).toBe(1);
  });

  await expect(future).resolves.toStrictEqual(Option.Some(Result.Error(1)));
});

test("Future.make", async () => {
  const can_fn = vi.fn();

  const future = Future.make((resolve) => {
    setTimeout(() => resolve(100), 100);
  });
  future.onResolved((value) => {
    expect(value).toBe(100);
  });
  future.onCancelled(can_fn);

  await expect(future).resolves.toStrictEqual(Option.Some(100));
  expect(can_fn).not.toHaveBeenCalled();
});

test("Future.makeFallible", async () => {
  const can_fn = vi.fn();

  const f1 = Future.makeFallible((succeed, _) => {
    setTimeout(() => succeed(100), 100);
  });
  f1.onSucceeded((error) => {
    expect(error).toBe(100);
  });
  f1.onCancelled(can_fn);

  await expect(f1).resolves.toStrictEqual(Option.Some(Result.Ok(100)));
  expect(can_fn).not.toHaveBeenCalled();

  can_fn.mockClear();

  const f2 = Future.makeFallible((_, fail) => {
    setTimeout(() => fail(100), 100);
  });
  f2.onSucceeded((error) => {
    expect(error).toBe(100);
  });
  f2.onCancelled(can_fn);

  await expect(f2).resolves.toStrictEqual(Option.Some(Result.Error(100)));
  expect(can_fn).not.toHaveBeenCalled();
});

test("Future.fromFallible", async () => {
  const f1 = Future.fromFallible(Result.Ok(100));
  expect(Future.isFallibleFuture(f1)).toBe(true);
  await expect(f1).resolves.toStrictEqual(Option.Some(Result.Ok(100)));

  const base_fallible_future = Future.success(true);
  const f2 = Future.fromFallible(base_fallible_future);
  expect(Future.isFallibleFuture(f2)).toBe(true);
  expect(f2).toBe(base_fallible_future);
  await expect(f2).resolves.toStrictEqual(Option.Some(Result.Ok(true)));

  const f3 = Future.fromFallible(Promise.resolve("Hello"));
  expect(Future.isFallibleFuture(f3)).toBe(true);
  await expect(f3).resolves.toStrictEqual(Option.Some(Result.Ok("Hello")));

  const async_fn = async () => {
    return { code: "TEST" };
  };
  const f4 = Future.fromFallible(async_fn());
  expect(Future.isFallibleFuture(f4)).toBe(true);
  await expect(f4).resolves.toStrictEqual(
    Option.Some(Result.Ok({ code: "TEST" }))
  );
});

test("Future.cancel", async () => {
  const can_fn = vi.fn();

  const future = Future.make((resolve) => {
    setTimeout(() => resolve(100), 2000);
  });
  future.onResolved((value) => {
    expect(value).toBe(100);
  });
  future.onCancelled(can_fn);

  future.cancel();

  await expect(future).resolves.toBe(Option.None());
  expect(can_fn).toHaveBeenCalled();
});

test("FallibleFuture.cancel", async () => {
  const can_fn = vi.fn();

  const future = Future.makeFallible((success) => {
    setTimeout(() => success(100), 2000);
  });
  future.onSucceeded((value) => {
    expect(value).toBe(100);
  });
  future.onCancelled(can_fn);

  future.cancel();

  await expect(future).resolves.toBe(Option.None());
  expect(can_fn).toHaveBeenCalled();
});

test("Future.map", async () => {
  await expect(Future.value(1).map((x) => x * 2)).resolves.toStrictEqual(
    Option.Some(2)
  );

  const map_fn = vi.fn((x) => x * 2);
  const future = Future.make<number>((r) => r(1), { lazy: true });
  future.cancel();

  await expect(future.map(map_fn)).resolves.toBe(Option.None());
  expect(map_fn).not.toHaveBeenCalled();
});

test("Future.tap", async () => {
  const fn = vi.fn();

  await expect(Future.value(1).tap(fn)).resolves.toStrictEqual(Option.Some(1));
  expect(fn).toHaveBeenCalledWith(1);
  expect(fn).toHaveBeenCalledTimes(1);

  fn.mockClear();

  const future = Future.make<number>((r) => r(1), { lazy: true }).tap(fn);
  future.cancel();
  await expect(future).resolves.toBe(Option.None());
  expect(fn).not.toHaveBeenCalled();
});

test("Future.neverError", async () => {
  const future = Future.value(1).neverError();

  expect(Future.isFallibleFuture(future)).toBe(true);

  await expect(future).resolves.toStrictEqual(Option.Some(Result.Ok(1)));
});

test("Future.unwrap", async () => {
  await expect(Future.value(1).unwrap()).resolves.toBe(1);

  const future = Future.make((r) => r(1), { lazy: true });
  future.cancel();
  await expect(async () => future.unwrap()).rejects.toThrowError();
});

test("Future.unwrapOr", async () => {
  expect(await Future.value(1).unwrapOr(0)).toBe(1);

  const future = Future.make((r) => r(1), { lazy: true }).unwrapOr(0);
  future.cancel();
  await expect(future).resolves.toBe(0);
});

test("Future.unwrapOrElse", async () => {
  await expect(Future.value(1).unwrapOrElse(() => 0)).resolves.toBe(1);

  const future = Future.make((r) => r(1), { lazy: true });
  future.cancel();
  await expect(future.unwrapOrElse(() => 0)).resolves.toBe(0);
});

test("FallibleFuture.map", async () => {
  const map_fn = vi.fn((x: number) => `${x * 2}`);

  await expect(Future.fail(1).map(map_fn)).resolves.toStrictEqual(
    Option.Some(Result.Error(1))
  );
  expect(map_fn).not.toHaveBeenCalled();

  map_fn.mockClear();

  await expect(Future.success(1).map(map_fn)).resolves.toStrictEqual(
    Option.Some(Result.Ok("2"))
  );
  expect(map_fn).toHaveBeenCalledTimes(1);

  map_fn.mockClear();

  const future = Future.makeFallible<number>((s) => s(1), { lazy: true });
  future.cancel();
  await expect(future.map(map_fn)).resolves.toBe(Option.None());
  expect(map_fn).not.toHaveBeenCalled();
});

test("FallibleFuture.mapError", async () => {
  const map_fn = vi.fn((x: number) => `${x * 2}`);

  await expect(Future.success(1).mapError(map_fn)).resolves.toStrictEqual(
    Option.Some(Result.Ok(1))
  );
  expect(map_fn).not.toHaveBeenCalled();

  map_fn.mockClear();

  await expect(Future.fail(1).mapError(map_fn)).resolves.toStrictEqual(
    Option.Some(Result.Error("2"))
  );
  expect(map_fn).toHaveBeenCalledTimes(1);

  map_fn.mockClear();

  const future = Future.makeFallible<never, number>((_, f) => f(1), {
    lazy: true,
  });
  future.cancel();
  await expect(future.mapError(map_fn)).resolves.toBe(Option.None());
  expect(map_fn).not.toHaveBeenCalled();
});

test("FallibleFuture.andThen", async () => {
  const and_then_fn = vi.fn((x: number) => Future.success(`${x * 2}`));

  await expect(Future.fail(1).andThen(and_then_fn)).resolves.toStrictEqual(
    Option.Some(Result.Error(1))
  );
  expect(and_then_fn).not.toHaveBeenCalled();

  and_then_fn.mockClear();

  await expect(Future.success(1).andThen(and_then_fn)).resolves.toStrictEqual(
    Option.Some(Result.Ok("2"))
  );
  expect(and_then_fn).toHaveBeenCalledTimes(1);

  and_then_fn.mockClear();

  const future = Future.makeFallible<number>((s) => s(1), { lazy: true });
  future.cancel();
  await expect(future.andThen(and_then_fn)).resolves.toBe(Option.None());
  expect(and_then_fn).not.toHaveBeenCalled();
});

test("FallibleFuture.orElse", async () => {
  const or_else_fn = vi.fn((x: number) => Future.success(`${x * 2}`));

  await expect(Future.fail(1).orElse(or_else_fn)).resolves.toStrictEqual(
    Option.Some(Result.Ok("2"))
  );
  expect(or_else_fn).toHaveBeenCalledTimes(1);

  or_else_fn.mockClear();

  await expect(Future.success(1).orElse(or_else_fn)).resolves.toStrictEqual(
    Option.Some(Result.Ok(1))
  );
  expect(or_else_fn).not.toHaveBeenCalled();

  or_else_fn.mockClear();

  const future = Future.makeFallible<never, number>((_, f) => f(1), {
    lazy: true,
  });
  future.cancel();
  await expect(future.orElse(or_else_fn)).resolves.toBe(Option.None());
  expect(or_else_fn).not.toHaveBeenCalled();
});

test("FallibleFuture.tap", async () => {
  const fn = vi.fn();

  await expect(Future.success(1).tap(fn)).resolves.toStrictEqual(
    Option.Some(Result.Ok(1))
  );
  expect(fn).toHaveBeenCalledWith(1);
  expect(fn).toHaveBeenCalledTimes(1);

  fn.mockClear();

  await expect(Future.fail(1).tap(fn)).resolves.toStrictEqual(
    Option.Some(Result.Error(1))
  );
  expect(fn).not.toHaveBeenCalled();

  fn.mockClear();

  const future = Future.makeFallible<number>((s) => s(1), { lazy: true });
  future.cancel();
  await expect(future.tap(fn)).resolves.toBe(Option.None());
  expect(fn).not.toHaveBeenCalled();
});

test("FallibleFuture.tapError", async () => {
  const fn = vi.fn();

  await expect(Future.fail(1).tapError(fn)).resolves.toStrictEqual(
    Option.Some(Result.Error(1))
  );
  expect(fn).toHaveBeenCalledWith(1);
  expect(fn).toHaveBeenCalledTimes(1);

  fn.mockClear();

  await expect(Future.success(1).tapError(fn)).resolves.toStrictEqual(
    Option.Some(Result.Ok(1))
  );
  expect(fn).not.toHaveBeenCalled();

  fn.mockClear();

  const future = Future.makeFallible<number>((_, f) => f(1), { lazy: true });
  future.cancel();
  await expect(future.tapError(fn)).resolves.toBe(Option.None());
  expect(fn).not.toHaveBeenCalled();
});

test("FallibleFuture.ok", async () => {
  await expect(Future.success(1).ok()).resolves.toStrictEqual(
    Option.Some(Option.Some(1))
  );
  await expect(Future.fail(1).ok()).resolves.toStrictEqual(
    Option.Some(Option.None())
  );
});

test("FallibleFuture.unwrap", async () => {
  await expect(Future.success(1).unwrap()).resolves.toBe(1);

  await expect(async () => Future.fail(1).unwrap()).rejects.toThrowError();

  const future = Future.makeFallible((s) => s(1), { lazy: true });
  future.cancel();
  await expect(async () => future.unwrap()).rejects.toThrowError();
});

test("FallibleFuture.unwrapError", async () => {
  await expect(Future.fail(1).unwrapError()).resolves.toBe(1);

  await expect(async () =>
    Future.success(1).unwrapError()
  ).rejects.toThrowError();

  const future = Future.makeFallible<number>((_, f) => f(1), { lazy: true });
  future.cancel();
  await expect(async () => future.unwrapError()).rejects.toThrowError();
});

test("FallibleFuture.unwrapOr", async () => {
  await expect(Future.success(1).unwrapOr(0)).resolves.toBe(1);

  await expect(Future.fail(1).unwrapOr(0)).resolves.toBe(0);

  const f1 = Future.makeFallible((s) => s(1), { lazy: true });
  f1.cancel();
  await expect(f1.unwrapOr(0)).resolves.toBe(0);

  const f2 = Future.makeFallible((s) => s(1), { lazy: true }).unwrapOr(0);
  f2.cancel();
  await expect(f2).resolves.toBe(0);
});

test("FallibleFuture.unwrapOrElse", async () => {
  await expect(Future.success(1).unwrapOrElse(() => 0)).resolves.toBe(1);

  await expect(Future.fail(1).unwrapOrElse(() => 0)).resolves.toBe(0);

  const future = Future.makeFallible((s) => s(1), { lazy: true });
  future.cancel();
  await expect(future.unwrapOrElse(() => 0)).resolves.toBe(0);
});

test("FallibleFuture.match", async () => {
  const match_cfg = {
    Ok: (x: number) => x * 2,
    Error: () => "OH NO" as const,
  };

  await expect(Future.success(1).match(match_cfg)).resolves.toBe(2);
  await expect(Future.fail("HA").match(match_cfg)).resolves.toBe("OH NO");

  const future = Future.lazyFallible<number>((s) => s(1)).match(match_cfg);
  future.cancel();
  await expect(async () => future).rejects.toThrowError();
});

test("Future.fromFallible", async () => {
  await expect(Future.fromFallible(Result.Ok(1))).resolves.toStrictEqual(
    Option.Some(Result.Ok(1))
  );

  const f1 = Future.success(1);
  const f2 = Future.fromFallible(f1);
  expect(f2).toBe(f1);

  const result = await f2;
  expect(result).toStrictEqual(Option.Some(Result.Ok(1)));
});

test("Future.all", async () => {
  await expect(
    Future.all([
      Future.value(1),
      Future.success(2),
      Future.fail(3),
      Future.value(4),
    ])
  ).resolves.toStrictEqual(Option.Some([1, Result.Ok(2), Result.Error(3), 4]));
});

test("Future.allFromDict", async () => {
  await expect(
    Future.allFromDict({
      a: Future.value(1),
      b: Future.value("Hi"),
    })
  ).resolves.toStrictEqual(
    Option.Some({
      a: 1,
      b: "Hi",
    })
  );

  await expect(
    Future.allFromDict({
      a: Future.success(1),
      b: Future.fail("OH NO"),
    })
  ).resolves.toStrictEqual(Option.Some(Result.Error("OH NO")));
  await expect(
    Future.allFromDict({
      a: Future.success(1),
      b: Future.success("Hi"),
    })
  ).resolves.toStrictEqual(
    Option.Some(
      Result.Ok({
        a: 1,
        b: "Hi",
      })
    )
  );

  await expect(
    Future.allFromDict({
      a: Future.success(1),
      b: Future.value("Hi"),
    })
  ).resolves.toStrictEqual(
    Option.Some(
      Result.Ok({
        a: 1,
        b: "Hi",
      })
    )
  );
  await expect(
    Future.allFromDict({
      a: Future.value(1),
      b: Future.fail("OH NO"),
      c: Future.success(2),
      d: Future.value("Hi"),
    })
  ).resolves.toStrictEqual(Option.Some(Result.Error("OH NO")));
});
