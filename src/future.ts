import { Option } from "./option";
import { Result } from "./result";

type InferOkType<T> = T extends FallibleFuture<infer U, infer _>
  ? U
  : T extends Result<infer U, infer _>
  ? U
  : never;

type InferErrorType<T> = T extends FallibleFuture<infer _, infer F>
  ? F
  : T extends Result<infer _, infer F>
  ? F
  : never;

// interface IFuture<T> {
//   map<U>(map_fn: (t: T) => U): Future<U>;
//
//   andThen<U>(then_fn: (t: T) => U): Future<U extends Future<infer V> ? V : U>;
//
//   tap(tap_fn: (t: T) => void): Future<T>;
//
//   never_error(): FallibleFuture<T, never>;
// }
//
// interface IFallibleFuture<T, E> {
//   map<U>(map_fn: (t: T) => U): FallibleFuture<U, E>;
//
//   mapError<F>(map_fn: (e: E) => F): FallibleFuture<T, F>;
//
//   andThen<R extends Result<any, any> | FallibleFuture<any, any>>(
//     then_fn: (t: T) => R
//   ): FallibleFuture<InferOkType<R>, InferErrorType<R> | E>;
//
//   orElse<R extends Result<any, any> | FallibleFuture<any, any>>(
//     or_fn: (e: E) => R
//   ): FallibleFuture<InferOkType<R> | T, InferErrorType<R>>;
//
//   tap(tap_fn: (t: T) => void): FallibleFuture<T, E>;
//
//   tapError(tap_fn: (e: E) => void): FallibleFuture<T, E>;
//
//   ok(): Future<Option<T>>;
// }

export namespace Future {
  /**
   * Creates a `Future<T>` that is already resolved with the provided value.
   */
  export function value<T>(thing: T): Future<T> {
    return new __Future({
      tag: "completed",
      value: thing,
    });
  }

  /**
   * Creates a `FallibleFuture<T, never>` that is already resolved with the
   * provided value.
   */
  export function success<T, E = never>(thing: T): FallibleFuture<T, E> {
    return new __FallibleFuture({
      tag: "completed",
      value: Result.Ok(thing),
    });
  }

  /**
   * Creates a `FallibleFuture<T, E>` that is already resolved with the
   * provided error.
   */
  export function fail<T = never, E = never>(error: E): FallibleFuture<T, E> {
    return new __FallibleFuture({
      tag: "completed",
      value: Result.Error(error),
    });
  }

  /**
   * Typeguard to theck if `thing` is a `Future`
   *
   * ## Example
   * ```ts
   * const future = Future.value(1);
   * if (Future.isFuture(future)) {
   *   // future is a Future
   * }
   * ```
   */
  export function isFuture<T = unknown>(thing: unknown): thing is Future<T> {
    return thing instanceof __Future;
  }

  /**
   * Typeguard to theck if `thing` is a `FallibleFuture`
   *
   * ## Example
   * ```ts
   * const future = Future.success(1);
   * if (Future.isFallibleFuture(future)) {
   *   // future is a FallibleFuture
   * }
   * ```
   */
  export function isFallibleFuture<T = unknown, E = unknown>(
    thing: unknown
  ): thing is FallibleFuture<T, E> {
    return thing instanceof __FallibleFuture;
  }

  /**
   * Creates a new `FallibleFuture<T, E>` from the given `Result<T, E>`, or
   * returns the given `FallibleFuture<T, E>` as is.
   */
  export function fromFallible<T, E>(
    f: Result<T, E> | FallibleFuture<T, E>
  ): FallibleFuture<T, E> {
    if (f instanceof __FallibleFuture) {
      return f;
    }

    return f.match({
      Ok: (value) => success(value),
      Error: (error) => fail(error),
    });
  }

  /**
   * Creates a new `Future<T>` with the value passed to `execute`s `resolve` function.
   * Will immediately start executing the `execute` function, unless `lazy` is set to
   * `true` in the options.
   *
   * @param `execute` - A function that takes a `resolve` function that will be called
   * with the value of the future when it is resolved. A cleanup function to call when
   * the future is cancelled can be returned.
   *
   * ## Example
   * ```ts
   * const future = Future.make<number>((resolve) => {
   *   setTimeout(() => resolve(1), 1000);
   *   return () => console.log("cancelled");
   * });
   * ```
   */
  export function make<T>(
    execute: ExecuteFutureFn<T>,
    options?: FutureOptions
  ): Future<T> {
    return new __Future(
      {
        tag: "pending",
        execute,
      },
      options
    );
  }

  /**
   * A shortcut for creating a `Future<T>` that is lazily executed.
   *
   * @param `execute` - A function that takes a `resolve` function that will be called
   * with the value of the future when it is resolved. A cleanup function to call when
   * the future is cancelled can be returned.
   *
   * ## Example
   * ```ts
   * const future = Future.lazy<number>((resolve) => {
   *   setTimeout(() => resolve(1), 1000);
   *   return () => console.log("cancelled");
   * });
   * ```
   */
  export function lazy<T>(execute: ExecuteFutureFn<T>): Future<T> {
    return new __Future(
      {
        tag: "pending",
        execute,
      },
      {
        lazy: true,
      }
    );
  }

  /**
   * Creates a new `FallibleFuture<T, E>` with the value passed to `execute`s `succeed`
   * function, or the error passed to `execute`s `fail` function. Will immediately start
   * executing the `execute` function, unless `lazy` is set to `true` in the options.
   *
   * @param `execute` - A function that takes a `succeed` function that will be called
   * with the value of the future when it is resolved, and a `fail` function that will
   * be called with the error of the future if it fails. A cleanup function to call when
   * the future is cancelled can be returned.
   *
   * ## Example
   * ```ts
   * const future = Future.makeFallible<number, string>((succeed, fail) => {
   *   setTimeout(() => Math.random() > 0.5 ? succeed(1) : fail("BOO"), 1000);
   *   return () => console.log("cancelled");
   * });
   * ```
   */
  export function makeFallible<T, E = unknown>(
    execute: ExecuteFallibleFutureFn<T, E>,
    options?: FutureOptions
  ): FallibleFuture<T, E> {
    return new __FallibleFuture(
      {
        tag: "pending",
        execute,
      },
      options
    );
  }

  /**
   * A shortcut for creating a `FallibleFuture<T, E>` that is lazily executed.
   *
   * @param `execute` - A function that takes a `succeed` function that will be called
   * with the value of the future when it is resolved, and a `fail` function that will
   * be called with the error of the future if it fails. A cleanup function to call when
   * the future is cancelled can be returned.
   *
   * ## Example
   * ```ts
   * const future = Future.lazyFallible<number, string>((succeed, fail) => {
   *   setTimeout(() => Math.random() > 0.5 ? succeed(1) : fail("BOO"), 1000);
   *   return () => console.log("cancelled");
   * });
   * ```
   */
  export function lazyFallible<T, E = unknown>(
    execute: ExecuteFallibleFutureFn<T, E>
  ): FallibleFuture<T, E> {
    return new __FallibleFuture(
      {
        tag: "pending",
        execute,
      },
      {
        lazy: true,
      }
    );
  }

  /**
   * Utility function to wait for a number of milliseconds before resolving.
   */
  export function wait(milliseconds: number): Future<void> {
    return new __Future({
      tag: "pending",
      execute: (resolve) => {
        let id = setTimeout(resolve, milliseconds);

        return () => {
          clearTimeout(id);
        };
      },
    });
  }

  export function all<T extends Array<Future<any> | FallibleFuture<any, any>>>(
    array: [...T]
  ): Future<{
    [K in keyof T]: T[K] extends Future<infer U>
      ? U
      : T[K] extends FallibleFuture<infer U, infer F>
      ? Result<U, F>
      : never;
  }> {
    const future = Future.make<any>((resolve) => {
      const results: Array<any> = new Array(array.length);

      let count = 0;

      array.forEach((f, i) => {
        f.onResolved((value) => {
          results[i] = value;
          count += 1;

          if (count === array.length) {
            resolve(results);
          }
        });
      });

      // Propagate cancel
      return () => array.forEach((f) => f.cancel());
    });

    array.forEach((f) => f.onCancelled(future.cancel.bind(future)));

    return future;
  }

  export function allFromDict<
    D extends { [K: PropertyKey]: FallibleFuture<any, any> }
  >(
    dict: D
  ): FallibleFuture<
    { [K in keyof D]: InferOkType<D[K]> },
    InferErrorType<D[keyof D]>
  >;
  export function allFromDict<D extends { [K: PropertyKey]: Future<any> }>(
    dict: D
  ): Future<{
    [K in keyof D]: D[K] extends Future<infer U> ? U : never;
  }>;
  export function allFromDict<
    D extends { [K: PropertyKey]: Future<any> | FallibleFuture<any, any> }
  >(
    dict: D
  ): FallibleFuture<
    {
      [K in keyof D]: D[K] extends FallibleFuture<infer U, infer _>
        ? U
        : D[K] extends Future<infer U>
        ? U
        : never;
    },
    InferErrorType<D[keyof D]>
  >;
  export function allFromDict(
    dict: Record<PropertyKey, Future<any> | FallibleFuture<any, any>>
  ): any {
    const vals = Object.values(dict);
    const item_count = vals.length;
    const has_fallible = vals.some(Future.isFallibleFuture);

    if (!has_fallible) {
      const future = Future.make<any>((resolve) => {
        const results: Record<PropertyKey, any> = {};

        let count = 0;

        for (const key in dict) {
          const f = dict[key]! as Future<any>;

          f.onResolved((value) => {
            results[key] = value;
            count += 1;

            if (count === item_count) {
              resolve(results);
            }
          });
        }

        // Propagate cancel
        return () => {
          for (const f of vals) {
            f.cancel();
          }
        };
      });

      for (const f of vals) {
        f.onCancelled(future.cancel.bind(future));
      }

      return future;
    }

    const future = Future.makeFallible<any, any>((success, fail) => {
      const results: Record<PropertyKey, Result<any, any>> = {};

      let count = 0;

      for (const key in dict) {
        let f = dict[key]!;

        if (Future.isFuture(f)) {
          f = f.neverError();
        }

        f.onResolved((result) => {
          results[key] = result;
          count += 1;

          if (count === item_count) {
            Result.allFromDict(results).match({
              Ok: success,
              Error: fail,
            });
          }
        });
      }

      // Propagate cancel
      return () => {
        for (const f of vals) {
          f.cancel();
        }
      };
    });

    for (const f of vals) {
      f.onCancelled(future.cancel.bind(future));
    }

    return future;
  }
}

export type Future<T> = __Future<T>;
export type FallibleFuture<T, E> = __FallibleFuture<T, E>;
export type UnwrappedFuture<T> = __UnwrappedFuture<T>;

type FutureOptions = {
  lazy?: boolean;
};

type ExecuteFutureFn<T> = (resolve: (t: T) => void) => (() => void) | void;
type FutureState<T> =
  | {
      tag: "pending";
      execute: ExecuteFutureFn<T> | null;
      // Use any here, as if we make it too strict the compiler gets mad in usages
      // Since there are type contraints on the usages, it doesn't appear to leak
      resolve_callbacks?: Array<(value: any) => void>;
      cancel?: () => void;
      cancel_callbacks?: Array<() => void>;
    }
  | {
      tag: "completed";
      value: T;
    }
  | { tag: "cancelled" };

class __Future<T> {
  #state: FutureState<T>;

  constructor(state: FutureState<T>, options?: FutureOptions) {
    this.#state = state;

    // If it's not lazy, then start execution immediately
    if (!options?.lazy) {
      this.then();
    }
  }

  #resolve(value: T) {
    if (this.#state.tag === "pending") {
      const { resolve_callbacks } = this.#state;
      this.#state = { tag: "completed", value };
      resolve_callbacks?.forEach((cb) => cb(value));
    }
  }

  onResolved(cb: (t: T) => void) {
    if (this.#state.tag === "pending") {
      this.#state.resolve_callbacks = this.#state.resolve_callbacks ?? [];
      this.#state.resolve_callbacks.push(cb);
    } else if (this.#state.tag === "completed") {
      cb(this.#state.value);
    }
  }

  onCancelled(cb: () => void) {
    if (this.#state.tag === "pending") {
      this.#state.cancel_callbacks = this.#state.cancel_callbacks ?? [];
      this.#state.cancel_callbacks.push(cb);
    } else if (this.#state.tag === "cancelled") {
      cb();
    }
  }

  /**
   * Cancels the future if it is still pending.
   */
  cancel() {
    if (this.#state.tag === "pending") {
      const { cancel, cancel_callbacks } = this.#state;
      this.#state = { tag: "cancelled" };
      cancel?.();
      cancel_callbacks?.forEach((cb) => cb());
    }
  }

  /**
   * **Only to be used internally**
   *
   * Calls `onResolved` with `Some<T>` if the future resolved, or `None` if
   * it was cancelled.
   */
  private then(onResolved?: (value: Option<T>) => void): Future<T> {
    if (this.#state.tag === "pending" && this.#state.execute) {
      const cancel = this.#state.execute(this.#resolve.bind(this));
      this.#state.execute = null;

      if (cancel) {
        this.#state.cancel = cancel;
      }
    }

    if (onResolved) {
      this.onResolved((value) => onResolved(Option.Some(value)));
      this.onCancelled(() => onResolved(Option.None()));
    }

    return this;
  }

  /**
   * Map this future’s output to a different type, returning a new future of
   * the resulting type.
   *
   * ## Example
   * ```ts
   * const result = await Future.value(1).map((val) => `${val * 2}`);
   * // result === Option.Some("2")
   * ```
   */
  map<U>(map_fn: (t: T) => U): Future<U> {
    const future = Future.make<U>((resolve) => {
      this.onResolved((value) => {
        resolve(map_fn(value));
      });

      // Propagate cancel
      return this.cancel.bind(this);
    });

    this.onCancelled(future.cancel.bind(future));

    return future;
  }

  /**
   * Runs the provided function with the resolved value of the future, returning
   * the existing future.
   *
   * ## Example
   * ```ts
   * const future = await Future.value(1).tap((val) => console.log(val));
   * // future === Option.Some(1)
   */
  tap(tap_fn: (t: T) => void): Future<T> {
    this.onResolved(tap_fn);

    return this;
  }

  /**
   * Turns this `Future<T>` into a `FallibleFutuer<T, never>`
   *
   * ## Example
   * ```ts
   * const future = await Future.value(1).never_error();
   * // future === Option.Some(Result.Ok(1))
   * ```
   */
  neverError(): FallibleFuture<T, never> {
    const future = Future.makeFallible<T, never>((succeed, _fail) => {
      this.onResolved(succeed);

      return this.cancel.bind(this);
    });

    this.onCancelled(future.cancel.bind(future));

    return future;
  }

  /**
   * Returns the resolved `T` from this future, or throws an exception if the
   * future was cancelled.
   *
   * **Prefer `unwrapOr` or `unwrapOrElse` over this method**
   *
   * ## Example
   * ```ts
   * const value = await Future.value(1).unwrap();
   * // value === 1
   *
   * const future = Future.value(1).unwrap();
   * future.cancel();
   * const value = await future;
   * // Throws an exception
   * ```
   */
  unwrap(): UnwrappedFuture<T> {
    const future = new __UnwrappedFuture<T>({
      tag: "pending",
      execute: (resolve) => {
        this.onResolved(resolve);
      },
    });

    this.onCancelled(future.cancel.bind(future));

    return future;
  }

  /**
   * Returns the resolved `T` from this future, or returns the provided `or_value`
   * if the future was cancelled.
   *
   * ## Example
   * ```ts
   * const value = await Future.value(1).unwrapOr(0);
   * // value === 1
   *
   * const future = Future.value(1).unwrapOr(0);
   * future.cancel();
   * const value = await future;
   * // value === 0
   */
  unwrapOr<U = T>(or_value: U): UnwrappedFuture<T | U> {
    const future = new __UnwrappedFuture<T | U>({
      tag: "pending",
      execute: (resolve) => {
        this.onResolved((t) => {
          resolve(t);
        });
        this.onCancelled(() => {
          resolve(or_value);
        });

        return () => {
          resolve(or_value);
        };
      },
    });

    return future;
  }

  /**
   * Returns the resolved `T` from this future, or returns the result
   * of running `or_fn` if the future was cancelled.
   *
   * ## Example
   * ```ts
   * const value = await Future.value(1).unwrapOrElse(() => 0);
   * // value === 1
   *
   * const future = Future.value(1).unwrapOrElse(() => 0);
   * future.cancel();
   * const value = await future;
   * // value === 0
   * ```
   */
  unwrapOrElse<U = T>(or_fn: () => U): UnwrappedFuture<T | U> {
    const future = new __UnwrappedFuture<T | U>({
      tag: "pending",
      execute: (resolve) => {
        this.onResolved((t) => {
          resolve(t);
        });
        this.onCancelled(() => {
          resolve(or_fn());
        });

        return () => {
          resolve(or_fn());
        };
      },
    });

    return future;
  }
}

type ExecuteFallibleFutureFn<T, E> = (
  succeed: (t: T) => void,
  fail: (e: E) => void
) => (() => void) | void;
type FallibleFutureState<T, E> =
  | {
      tag: "pending";
      execute: ExecuteFallibleFutureFn<T, E> | null;
      // Use any here, as if we make it too strict the compiler gets mad in usages
      // Since there are type contraints on the usages, it doesn't appear to leak
      resolve_callbacks?: Array<(t: any) => void>;
      cancel?: () => void;
      cancel_callbacks?: Array<() => void>;
    }
  | {
      tag: "completed";
      value: Result<T, E>;
    }
  | { tag: "cancelled" };

class __FallibleFuture<T, E> {
  #state: FallibleFutureState<T, E>;

  constructor(state: FallibleFutureState<T, E>, options?: FutureOptions) {
    this.#state = state;

    // If it's not lazy, then execute immediately
    if (!options?.lazy) {
      this.then();
    }
  }

  #succeed(value: T) {
    if (this.#state.tag === "pending") {
      const { resolve_callbacks } = this.#state;
      const result = Result.Ok(value);
      this.#state = { tag: "completed", value: result };
      resolve_callbacks?.forEach((cb) => cb(result));
    }
  }

  #fail(error: E) {
    if (this.#state.tag === "pending") {
      const { resolve_callbacks } = this.#state;
      const result = Result.Error(error);
      this.#state = { tag: "completed", value: result };
      resolve_callbacks?.forEach((cb) => cb(result));
    }
  }

  onResolved(cb: (result: Result<T, E>) => void) {
    if (this.#state.tag === "pending") {
      this.#state.resolve_callbacks = this.#state.resolve_callbacks ?? [];
      this.#state.resolve_callbacks.push(cb);
    } else if (this.#state.tag === "completed") {
      cb(this.#state.value);
    }
  }

  onSucceeded(cb: (value: T) => void) {
    this.onResolved((result) => {
      result.match({
        Ok: cb,
        Error: () => {},
      });
    });
  }

  onFailed(cb: (error: E) => void) {
    this.onResolved((result) => {
      result.match({
        Ok: () => {},
        Error: cb,
      });
    });
  }

  onCancelled(cb: () => void) {
    if (this.#state.tag === "pending") {
      this.#state.cancel_callbacks = this.#state.cancel_callbacks ?? [];
      this.#state.cancel_callbacks.push(cb);
    } else if (this.#state.tag === "cancelled") {
      cb();
    }
  }

  cancel() {
    if (this.#state.tag === "pending") {
      const { cancel, cancel_callbacks } = this.#state;
      this.#state = { tag: "cancelled" };
      cancel?.();
      cancel_callbacks?.forEach((cb) => cb());
    }
  }

  /**
   * **Only to be used internally**
   *
   * Calls `onResolved` with `Some<Result<T, E>>` if the future resolved, or `None` if
   * it was cancelled.
   */
  private then(
    onResolved?: (value: Option<Result<T, E>>) => void
  ): FallibleFuture<T, E> {
    if (this.#state.tag === "pending" && this.#state.execute) {
      const cancel = this.#state.execute(
        this.#succeed.bind(this),
        this.#fail.bind(this)
      );
      this.#state.execute = null;

      if (cancel) {
        this.#state.cancel = cancel;
      }
    }

    if (onResolved) {
      this.onResolved((value) => onResolved(Option.Some(value)));
      this.onCancelled(() => onResolved(Option.None()));
    }

    return this;
  }

  /**
   * Map this future’s success value `T` to a different type:
   * `FallibleFuture<T, E>` to `FallibleFuture<U, E>`
   *
   * ## Example
   * ```ts
   * const result = await Future.success(1).map((val) => `${val * 2}`);
   * // result === Option.Some(Result.Ok("2"))
   * ```
   */
  map<U>(map_fn: (t: T) => U): FallibleFuture<U, E> {
    const future = Future.makeFallible<U, E>((succeed, fail) => {
      this.onResolved((result) => {
        result.match({
          Ok: (t) => {
            succeed(map_fn(t));
          },
          Error: fail,
        });
      });

      // Propagate cancel
      return this.cancel.bind(this);
    });

    this.onCancelled(future.cancel.bind(future));

    return future;
  }

  /**
   * Map this future’s error value `E` to a different type:
   * `FallibleFuture<T, E>` to `FallibleFuture<T, F>`
   *
   * ## Example
   * ```ts
   * const result = await Future.fail(1).map((val) => `${val * 2}`);
   * // result === Option.Some(Result.Error("2"))
   * ```
   */
  mapError<F>(map_fn: (e: E) => F): FallibleFuture<T, F> {
    const future = Future.makeFallible<T, F>((succeed, fail) => {
      this.onResolved((result) => {
        result.match({
          Ok: succeed,
          Error: (e) => {
            fail(map_fn(e));
          },
        });
      });

      // Propagate cancel
      return this.cancel.bind(this);
    });

    this.onCancelled(future.cancel.bind(future));

    return future;
  }

  /**
   * Executes another FallibleFuture after this one resolves successfully.
   * The success value `T` is passed to `then_fn` to create this subsequent
   * FallibleFuture.
   *
   * ## Example
   * ```ts
   * const future = await Future.success(1).andThen((val) => Future.success(`${val * 2}`));
   * // future === Option.Some(Result.Ok("2"))
   *
   * const future = await Future.fail("ERROR").andThen((val) => Future.success(`${val * 2}`));
   * // future === Option.Some(Result.Error("ERROR"))
   * ```
   */
  andThen<F extends Result<any, any> | FallibleFuture<any, any>>(
    then_fn: (t: T) => F
  ): FallibleFuture<InferOkType<F>, InferErrorType<F> | E> {
    const future = Future.makeFallible<any, any>((success, fail) => {
      this.onResolved((result) => {
        result.match({
          Ok: (value) => {
            const next = Future.fromFallible(then_fn(value));
            next.onSucceeded(success);
            next.onFailed(fail);
          },
          Error: fail,
        });
      });

      // Propagate cancel
      return this.cancel.bind(this);
    });

    this.onCancelled(future.cancel.bind(future));

    return future;
  }

  orElse<R extends Result<any, any> | FallibleFuture<any, any>>(
    or_fn: (e: E) => R
  ): FallibleFuture<InferOkType<R> | T, InferErrorType<R>> {
    const future = Future.makeFallible<any, any>((success, fail) => {
      this.onResolved((result) => {
        result.match({
          Ok: success,
          Error: (error) => {
            const next = Future.fromFallible(or_fn(error));
            next.onSucceeded(success);
            next.onFailed(fail);
          },
        });
      });

      // Propagate cancel
      return this.cancel.bind(this);
    });

    this.onCancelled(future.cancel.bind(future));

    return future;
  }

  tap(tap_fn: (t: T) => void): FallibleFuture<T, E> {
    this.onSucceeded(tap_fn);

    return this;
  }

  tapError(tap_fn: (e: E) => void): FallibleFuture<T, E> {
    this.onFailed(tap_fn);

    return this;
  }

  ok(): Future<Option<T>> {
    const future = Future.make<Option<T>>((resolve) => {
      this.onSucceeded((t) => resolve(Option.Some(t)));
      this.onFailed(() => resolve(Option.None()));

      return this.cancel.bind(this);
    });

    this.onCancelled(future.cancel.bind(future));

    return future;
  }

  /**
   * Returns the resolved `T` from this future, or throws an exception if the
   * future was cancelled or failed.
   *
   * **Prefer `unwrapOr` or `unwrapOrElse` over this method**
   *
   * ## Example
   * ```ts
   * const value = await Future.success(1).unwrap();
   * // value === 1
   *
   * const future = Future.success(1).unwrap();
   * future.cancel();
   * const value = await future;
   * // Throws an exception
   *
   * const future = await Future.fail("ERROR").unwrap();
   * // Throws an exception
   * ```
   */
  unwrap(): UnwrappedFuture<T> {
    const future = new __UnwrappedFuture<T>({
      tag: "pending",
      execute: (resolve) => {
        this.onResolved((result) => resolve(result.unwrap()));
      },
    });

    this.onCancelled(future.cancel.bind(future));

    return future;
  }

  /**
   * Returns the resolved `E` from this future, or throws an exception if the
   * future was cancelled or succeeded.
   *
   * ## Example
   * ```ts
   * const value = await Future.fail("ERROR").unwrapError();
   * // value === "ERROR"
   *
   * const future = Future.fail("ERROR").unwrapError();
   * future.cancel();
   * const value = await future;
   * // Throws an exception
   *
   * const future = await Future.success(1).unwrapError();
   * // Throws an exception
   * ```
   */
  unwrapError(): UnwrappedFuture<E> {
    const future = new __UnwrappedFuture<E>({
      tag: "pending",
      execute: (resolve) => {
        this.onResolved((result) => resolve(result.unwrapError()));
      },
    });

    this.onCancelled(future.cancel.bind(future));

    return future;
  }

  /**
   * Returns the resolved `T` from this future, or returns the provided `or_value`
   * if the future was cancelled, or failed.
   *
   * ## Example
   * ```ts
   * const value = await Future.success(1).unwrapOr(0);
   * // value === 1
   *
   * const future = Future.success(1).unwrapOr(0);
   * future.cancel();
   * const value = await future;
   * // Throws an exception
   *
   * const future = await Future.fail("ERROR").unwrapOr(0);
   * // value === 0
   * ```
   */
  unwrapOr<U = T>(or_value: U): UnwrappedFuture<T | U> {
    const future = new __UnwrappedFuture<T | U>({
      tag: "pending",
      execute: (resolve) => {
        this.onResolved((result) => {
          resolve(result.unwrapOr(or_value));
        });
        this.onCancelled(() => {
          resolve(or_value);
        });

        return () => {
          resolve(or_value);
        };
      },
    });

    return future;
  }

  /**
   * Returns the resolved `T` from this future, or returns the result
   * of running `or_fn` if the future was cancelled or failed.
   *
   * ## Example
   * ```ts
   * const value = await Future.success(1).unwrapOrElse(() => 0);
   * // value === 1
   *
   * const future = Future.success(1).unwrapOrElse(() => 0);
   * future.cancel();
   * const value = await future;
   * // Throws an exception
   *
   * const future = await Future.fail("ERROR").unwrapOrElse(() => 0);
   * // value === 0
   * ```
   */
  unwrapOrElse<U = T>(or_fn: () => U): UnwrappedFuture<T | U> {
    const future = new __UnwrappedFuture<T | U>({
      tag: "pending",
      execute: (resolve) => {
        this.onResolved((result) => {
          resolve(result.unwrapOrElse(or_fn));
        });
        this.onCancelled(() => {
          resolve(or_fn());
        });

        return () => {
          resolve(or_fn());
        };
      },
    });

    return future;
  }

  match<U, V = U>(config: {
    Ok: (t: T) => U;
    Error: (e: E) => V;
  }): UnwrappedFuture<U | V> {
    const future = new __UnwrappedFuture<U | V>({
      tag: "pending",
      execute: (resolve) => {
        this.onResolved((result) => {
          resolve(result.match(config));
        });
      },
    });

    this.onCancelled(future.cancel.bind(future));

    return future;
  }
}

type ExecuteUnwrappedFutureFn<T> = (
  resolve: (t: T) => void
) => (() => void) | void;
type UnwrappedFutureState<T> =
  | {
      tag: "pending";
      execute: ExecuteUnwrappedFutureFn<T> | null;
      // Use any here, as if we make it too strict the compiler gets mad in usages
      // Since there are type contraints on the usages, it doesn't appear to leak
      resolve_callbacks?: Array<(value: any) => void>;
    }
  | {
      tag: "completed";
      value: T;
    }
  | { tag: "cancelled" };

class __UnwrappedFuture<T> {
  #state: UnwrappedFutureState<T>;
  #cancel?: (error: any) => void;

  constructor(state: UnwrappedFutureState<T>) {
    this.#state = state;

    if (this.#state.tag === "pending" && this.#state.execute) {
      const cancel = this.#state.execute(this.#resolve.bind(this));
      this.#state.execute = null;

      if (cancel && !this.#cancel) {
        this.#cancel = cancel;
      }
    }
  }

  #resolve(value: T) {
    if (this.#state.tag === "pending") {
      const { resolve_callbacks } = this.#state;
      this.#state = { tag: "completed", value };
      resolve_callbacks?.forEach((cb) => cb(value));
    }
  }

  onResolved(cb: (t: T) => void) {
    if (this.#state.tag === "pending") {
      this.#state.resolve_callbacks = this.#state.resolve_callbacks ?? [];
      this.#state.resolve_callbacks.push(cb);
    } else if (this.#state.tag === "completed") {
      cb(this.#state.value);
    }
  }

  onCancelled(cb: (error: any) => void) {
    if (this.#state.tag === "pending" && !this.#cancel) {
      this.#cancel = cb;
    } else if (this.#state.tag === "cancelled" && !this.#cancel) {
      cb(new Error("Cannot cancel UnwrappedFuture"));
    }
  }

  /**
   * Cancels the future if it is still pending.
   */
  cancel() {
    if (this.#state.tag === "pending") {
      if (!this.#cancel) {
        this.#state = { tag: "cancelled" };
      } else {
        this.#cancel(new Error("Cannot cancel UnwrappedFuture"));

        if (this.#state.tag === "pending") {
          this.#state = { tag: "cancelled" };
        }
      }
    }
  }

  /**
   * **Only to be used internally**
   *
   * Calls `onResolved` with `Some<T>` if the future resolved, or `None` if
   * it was cancelled.
   */
  private then(
    onResolved?: (value: T) => void,
    onCancelled?: (error: any) => void
  ): UnwrappedFuture<T> {
    if (onResolved) {
      this.onResolved(onResolved);
    }
    if (onCancelled) {
      this.onCancelled(onCancelled);
    }

    return this;
  }
}
