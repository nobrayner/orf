import { Option } from "./option";

const JSError = Error;

export type InferOkType<T> = T extends Result<infer U, any> ? U : never;
export type InferErrorType<T> = T extends Result<any, infer U> ? U : never;

interface IResult<T, E> {
  /**
   * Used to check if the Result is an `Ok`, and if it is, narrows the
   * `Result<T, E>` to `Ok<T, E>`
   *
   * Intended to be used as a type guard
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.isOk();
   * // result === true
   *
   * const res = Result.Error("error");
   * const result = res.isOk();
   * // result === false
   * ```
   */
  isOk(): this is Ok<T, E>;

  /**
   * Used to check if the Result is an `Error`, and if it is, narrows the
   * `Result<T, E>` to `Error<T, E>`
   *
   * Intended to be used as a type guard
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.isError();
   * // result === false
   *
   * const res = Result.Error("error");
   * const result = res.isError();
   * // result === true
   * ```
   */
  isError(): this is Error<T, E>;

  /**
   * Runs the function provided in the `Ok` or `Error` branch, passing the value
   * or error respectively
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.match({
   *   Ok: (value) => value,
   *   Error: (error) => error,
   * });
   * // result === 1
   *
   * const res = Result.Error("error");
   * const result = res.match({
   *   Ok: (value) => value,
   *   Error: (error) => error,
   * });
   * // result === "error"
   *  ```
   */
  match<U, V = U>(config: { Ok: (t: T) => U; Error: (e: E) => V }): U | V;

  /**
   * Maps `Ok<T, E>` to `Ok<U, E>`, or returns the existing `Error`
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.map((value) => value * 2);
   * // result === Result.Ok(2)
   *
   * const res = Result.Error("error");
   * const result = res.map((value) => value * 2);
   * // result === Result.Error("error")
   * ```
   */
  map<U>(map_fn: (t: T) => U): Result<U, E>;

  /**
   * Maps `Ok<T, E>` to `U`, or returns the given `or_value`
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.mapOr(0, (value) => value * 2);
   * // result === 2
   *
   * const res = Result.Error("error");
   * const result = res.mapOr(0, (value) => value * 2);
   * // result === 0
   * ```
   */
  mapOr<U, V = U>(or_value: U, map_fn: (t: T) => V): U | V;

  /**
   * Maps `Ok<T, E>` to `U`, or returns the result of running `or_fn`
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.mapOrElse(() => 0, (value) => value * 2);
   * // result === 2
   *
   * const res = Result.Error("error");
   * const result = res.mapOrElse(() => 0, (value) => value * 2);
   * // result === 0
   * ```
   */
  mapOrElse<U, V = U>(or_fn: () => U, map_fn: (t: T) => V): U | V;

  /**
   * Maps `Error<T, E>` to `Error<T, F>`, or returns the existing `Ok`
   *
   * ## Example
   * ```ts
   * const res = Result.Error("error");
   * const result = res.mapErr((error) => new Error(error));
   * // result === Result.Error(new Error("error"))
   *
   * const res = Result.Ok(1);
   * const result = res.mapErr((error) => new Error(error));
   * // result === Result.Ok(1)
   * ```
   */
  mapError<F>(map_fn: (e: E) => F): Result<T, F>;

  /**
   * Returns the existing `Error` if the result is an `Error`, otherwise
   * returns `and_value`
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.and(Result.Error("new error"));
   * // result === Result.Error("new error")
   *
   * const res = Result.Error("error");
   * const result = res.and(Result.Ok(2));
   * // result === Result.Error("error")
   * ```
   */
  and<U, F = E>(and_value: Result<U, F>): Result<U, E | F>;

  /**
   * Returns the existing `Error` if the result is an `Error`, otherwise
   * returns the result of running `and_fn` with the value held in `Ok`
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.andThen((value) => Result.Ok(`${value * 2}`));
   * // result === Result.Ok("2")
   *
   * const res = Result.Error("error");
   * const result = res.andThen((value) => Result.Ok(2));
   * // result === Result.Error("error")
   * ```
   */
  andThen<R extends Result<any, any>>(
    and_fn: (t: T) => R
  ): Result<InferOkType<R>, InferErrorType<R> | E>;

  /**
   * Returns `or_value` if the result is an `Error`, otherwise returns
   * the existing `Ok`
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.or(Result.Ok(2));
   * // result === Result.Ok(1)
   *
   * const res = Result.Error("error");
   * const result = res.or(Result.Ok(2));
   * // result === Result.Ok(2)
   * ```
   */
  or<F, U = T>(or_value: Result<U, F>): Result<T | U, F>;

  /**
   * Returns the existing `Ok<T>` if the result is an `Ok`, otherwise
   * returns the result of running `or_fn` with the error held in `Error`
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.orElse((error) => Result.Ok(`Not okay: ${error}`));
   * // result === Result.Ok(1)
   *
   * const res = Result.Error("error");
   * const result = res.orElse((error) => Result.Ok(`Not okay: ${error}`));
   * // result === Result.Ok("Not okay: error")
   * ```
   */
  orElse<R extends Result<unknown, unknown>>(
    or_fn: (e: E) => R
  ): Result<InferOkType<R> | T, InferErrorType<R>>;

  /**
   * Runs `fn` with `Readonly<T>` if the result is `Ok`, and then returns
   * the existing `Ok`; otherwise does nothing and returns the existing
   * `Error`
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.tap((value) => console.log(value));
   * // Logs: 1
   * // result === Result.Ok(1)
   *
   * const res = Result.Error("error");
   * const result = res.tap((value) => console.log(value));
   * // Does not log anything
   * // result === Result.Error("error")
   * ```
   */
  tap(fn: (t: Readonly<T>) => void): Result<T, E>;

  /**
   * Runs `fn` with `Readonly<E>` if the result is `Error`, and then returns
   * the existing `Error`; otherwise does nothing and returns the existing
   * `Ok`
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.tapError((error) => console.error(error));
   * // Does not log anything
   * // result === Result.Ok(1)
   *
   * const res = Result.Error("error");
   * const result = res.tapError((error) => console.error(error));
   * // Logs: "error"
   * // result === Result.Error("error")
   * ```
   */
  tapError(fn: (e: Readonly<E>) => void): Result<T, E>;

  /**
   * Returns the `T` of an `Ok<T, E>`, or throws an exception if the result
   * is an `Error`
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.unwrap();
   * // result === 1
   *
   * const res = Result.Error("error");
   * const result = res.unwrap();
   * // Throws an exception
   * ```
   */
  unwrap(): T;

  /**
   * Returns the `E` of an `Error<T, E>`, or throws an exception if the result
   * is an `Ok`
   *
   * ## Example
   * ```ts
   * const res = Result.Error("error");
   * const result = res.unwrapErr();
   * // result === "error"
   *
   * const res = Result.Ok(1);
   * const result = res.unwrapErr();
   * // Throws an exception
   * ```
   */
  unwrapError(): E;

  /**
   * Returns the `T` of an `Ok<T, E>`, or the `or_value` if the result is
   * an `Error`
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.unwrapOr(0);
   * // result === 1
   *
   * const res = Result.Error("error");
   * const result = res.unwrapOr(0);
   * // result === 0
   * ```
   */
  unwrapOr<U = T>(or_value: U): T | U;

  /**
   * Returns the `T` of an `Ok<T, E>`, or the result of running `or_fn` if
   * the result is an `Error`
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.unwrapOrElse(() => 0);
   * // result === 1
   *
   * const res = Result.Error("error");
   * const result = res.unwrapOrElse(() => 0);
   * // result === 0
   * ```
   */
  unwrapOrElse<U = T>(or_fn: (e: E) => U): T | U;

  /**
   * Converts the `Result<T, E>` to an `Option<T>`, discarding the `Error`
   * if the result is an `Error`
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.ok();
   * // result === Option.Some(1)
   *
   * const res = Result.Error("error");
   * const result = res.ok();
   * // result === Option.None()
   * ```
   */
  ok(): Option<T>;

  /*
   * Converts the `Result<T, E>` to a JSON representation
   *
   * This is used when calling `JSON.stringify` on a `Result`, but is also
   * useful for serialization across network boundaries - e.g. to be
   * returned from a React server-action
   *
   * ## Example
   * ```ts
   * const res = Result.Ok(1);
   * const result = res.toJSON();
   * // result === { __orf_type__: "Result", tag: "Ok", value: 1 }
   *
   * const res = Result.Error("error");
   * const result = res.toJSON();
   * // result === { __orf_type__: "Result", tag: "Error", error: "error" }
   * ```
   */
  toJSON(): JsonResult<T, E>;
}

export type Ok<T, E> = __Ok<T, E>;
export type Error<T, E> = __Error<T, E>;
export type Result<T, E> = Ok<T, E> | Error<T, E>;
export type JsonResult<T, E> =
  | { __orf_type__: "Result"; tag: "Ok"; value: T }
  | { __orf_type__: "Result"; tag: "Error"; error: E };

export namespace Result {
  /**
   * Creates an `Ok<T, never>` with the provided value
   */
  export function Ok<T, E = never>(value: T): Result<T, E> {
    return Object.freeze(new __Ok<T, E>(value));
  }

  /**
   * Creates an `Error<never, E>` with the provided error
   */
  export function Error<T = never, E = never>(value: E): Result<T, E> {
    return Object.freeze(new __Error<T, E>(value));
  }

  /**
   * Typeguard to check if `thing` is a `Result`
   *
   * ## Example
   * ```ts
   * const result = Result.Ok(1);
   * if (Result.isResult(result)) {
   *   // result is a Result
   * }
   * ```
   */
  export function isResult<T, E>(thing: unknown): thing is Result<T, E> {
    return thing instanceof __Ok || thing instanceof __Error;
  }

  /**
   * Creates a `Result` from an execution function, catching any errors
   *
   * Optionally, an error function can be provided to transform the error
   *
   * ## Example
   * ```ts
   * const result = Result.fromExecution(() => 1);
   * // result === Result.Ok(1)
   *
   * const result = Result.fromExecution(
   *   () => {
   *     return JSON.parse("bobmarley") as number;
   *   },
   *   (error) => {
   *     return { code: "INVALID_JSON", message: error.message }
   *   }
   * );
   * // result === Result.Error({ code: "INVALID_JSON", message: "..." })
   * ```
   *
   */
  export function fromExecution<T, E = unknown>(
    exec_fn: () => T,
    err_fn?: (error: unknown) => E
  ): Result<T, E> {
    try {
      return Ok(exec_fn());
    } catch (error) {
      return Error(err_fn?.(error) ?? (error as E));
    }
  }

  /**
   * Creates a `Result` from an awaitable, catching any errors
   *
   * Optionally, an error function can be provided to transform the error
   *
   * ## Example
   * ```ts
   * const result = await Result.fromAwaitable(Promise.resolve(1));
   * // result === Result.Ok(1)
   *
   * const result = await Result.fromAwaitable(Promise.reject("NOPE"));
   * // result === Result.Error("NOPE")
   * ```
   */
  export async function fromAwaitable<T, E = unknown>(
    promise: Promise<T>,
    err_fn?: (error: unknown) => E
  ) {
    try {
      return Ok(await promise);
    } catch (error) {
      return Error(err_fn?.(error) ?? (error as E));
    }
  }

  /**
   * Creates a `Result<[A, B, ...], E | F | ...>` from an array of `Result`s
   *
   * If any of the `Result`s are an `Error`, the first `Error` found is returned
   * Otherwise, an `Ok` is returned with an array of the values
   *
   * ## Example
   * ```ts
   * const result = Result.all([Result.Ok(1), Result.Ok("hi")]);
   * // result === Result.Ok([1, "hi"])
   *
   * const result = Result.all([Result.Ok(1), Result.Error("error1"), Result.Error("error2")]);
   * // result === Result.Error("error1")
   *```
   */
  export function all<T extends Array<Result<any, any>>>(
    array: [...T]
  ): Result<
    {
      [I in keyof T]: InferOkType<T[I]>;
    },
    InferErrorType<T[number]>
  > {
    let values: any = [];

    for (const result of array) {
      if (result.isError()) {
        return result;
      }

      values.push(result.unwrap());
    }

    return Ok(values);
  }

  /**
   * Creates a `Result<{ a: A, b: B, ... }, E | F | ...>` from a dictionary of `Result`s
   *
   * If any of the `Result`s are an `Error`, the first `Error` found is returned
   * Otherwise, an `Ok` is returned with an object of the values
   *
   * ## Example
   * ```ts
   * const result = Result.allFromDict({
   *   a: Result.Ok(1),
   *   b: Result.Ok("hi"),
   * });
   * // result === Result.Ok({ a: 1, b: "hi" })
   *
   * const result = Result.allFromDict({
   *   a: Result.Ok(1),
   *   b: Result.Error("error1"),
   *   c: Result.Error("error2"),
   * });
   * // result === Result.Error("error1")
   * ```
   */
  export function allFromDict<D extends { [K: PropertyKey]: Result<any, any> }>(
    dict: D
  ): Result<{ [K in keyof D]: InferOkType<D[K]> }, InferErrorType<D[keyof D]>> {
    let return_dict: any = {};

    for (const key in dict) {
      const value = dict[key]!;

      if (value.isError()) {
        return value;
      }

      return_dict[key] = value.unwrap();
    }

    return Ok(return_dict);
  }

  /**
   * Converts a JSON representation of a `Result<T, E>` (`JsonResult<T, E>`) back into
   * a `Result` or throws an exception if it isn't a valid `JsonResult`
   *
   * ## Example
   * ```ts
   * const json = { __orf_type__: "Result", tag: "Ok", value: 1 };
   * const result = Result.fromJSON(json);
   * // result === Result.Ok(1)
   * ```
   */
  export function fromJSON<T, E>(json: JsonResult<T, E>): Result<T, E> {
    if (json.__orf_type__ !== "Result" && !("tag" in json)) {
      throw new JSError("Invalid Result JSON");
    }

    if (json.tag === "Ok" && "value" in json) {
      return Ok(json.value);
    }

    if (json.tag === "Error" && "error" in json) {
      return Error(json.error);
    }

    throw new JSError("Invalid Result JSON");
  }
}

class __Ok<T, E> implements IResult<T, E> {
  constructor(readonly value: T) {}

  isOk(): this is Ok<T, E> {
    return true;
  }

  isError(): this is Error<T, E> {
    return !this.isOk();
  }

  match<U, V = U>(config: { Ok: (t: T) => U; Error: (e: E) => V }): U | V {
    return config.Ok(this.value);
  }

  map<U>(map_fn: (t: T) => U): Result<U, E> {
    return Result.Ok(map_fn(this.value));
  }

  mapOr<U, V = U>(_or_value: U, map_fn: (t: T) => V): U | V {
    return map_fn(this.value);
  }

  mapOrElse<U, V = U>(_or_fn: () => U, map_fn: (t: T) => V): U | V {
    return map_fn(this.value);
  }

  mapError<F>(_map_fn: (e: E) => F): Result<T, F> {
    return this as unknown as Result<T, F>;
  }

  and<U, F = E>(and_value: Result<U, F>): Result<U, E | F> {
    return and_value as Result<U, E | F>;
  }

  andThen<R extends Result<any, any>>(
    and_fn: (t: T) => R
  ): Result<InferOkType<R>, InferErrorType<R> | E> {
    return and_fn(this.value) as Result<InferOkType<R>, InferErrorType<R> | E>;
  }

  or<F, U = T>(_or_value: Result<U, F>): Result<T | U, F> {
    return this as unknown as Result<T | U, F>;
  }

  orElse<R extends Result<any, any>>(
    _or_fn: (e: E) => R
  ): Result<InferOkType<R> | T, InferErrorType<R>> {
    return this as Result<T, InferErrorType<R>>;
  }

  tap(fn: (t: Readonly<T>) => void): Result<T, E> {
    // TODO: Find out if this is a problem at all
    fn(Object.freeze(structuredClone(this.value)));

    return this;
  }

  tapError(_fn: (e: Readonly<E>) => void): Result<T, E> {
    return this;
  }

  ok(): Option<T> {
    return Option.Some(this.value);
  }

  unwrap(): T {
    return this.value;
  }

  unwrapError(): E {
    throw new JSError("Cannot unwrapError an Ok");
  }

  unwrapOr<U = T>(_or_value: U): T {
    return this.value;
  }

  unwrapOrElse<U = T>(_or_fn: (e: E) => U): T {
    return this.value;
  }

  toJSON(): JsonResult<T, E> {
    return { __orf_type__: "Result", tag: "Ok", value: this.value };
  }
}

class __Error<T, E> implements IResult<T, E> {
  constructor(readonly error: E) {}

  isOk(): this is Ok<T, E> {
    return false;
  }

  isError(): this is Error<T, E> {
    return !this.isOk();
  }

  match<U, V = U>(config: { Ok: (t: T) => U; Error: (e: E) => V }): U | V {
    return config.Error(this.error);
  }

  map<U>(_map_fn: (t: T) => U): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  mapOr<U, V = U>(or_value: U, _map_fn: (t: T) => V): U | V {
    return or_value;
  }

  mapOrElse<U, V = U>(or_fn: () => U, _map_fn: (t: T) => V): U | V {
    return or_fn();
  }

  mapError<F>(map_fn: (e: E) => F): Result<T, F> {
    return Result.Error(map_fn(this.error));
  }

  and<U, F = E>(_and_value: Result<U, F>): Result<U, E | F> {
    return this as unknown as Result<U, E | F>;
  }

  andThen<R extends Result<any, any>>(
    _and_fn: (t: T) => R
  ): Result<InferOkType<R>, InferErrorType<R> | E> {
    return this as Result<InferOkType<R>, E>;
  }

  or<F, U = T>(or_value: Result<U, F>): Result<T | U, F> {
    return or_value as Result<T | U, F>;
  }

  orElse<R extends Result<any, any>>(
    or_fn: (e: E) => R
  ): Result<InferOkType<R> | T, InferErrorType<R>> {
    return or_fn(this.error);
  }

  tap(_fn: (t: Readonly<T>) => void): Result<T, E> {
    return this;
  }

  tapError(fn: (e: Readonly<E>) => void): Result<T, E> {
    // TODO: Find out if this is a problem at all
    fn(Object.freeze(structuredClone(this.error)));

    return this;
  }

  ok(): Option<T> {
    return Option.None();
  }

  unwrap(): T {
    throw this.error;
  }

  unwrapError(): E {
    return this.error;
  }

  unwrapOr<U = T>(or_value: U): U {
    return or_value;
  }

  unwrapOrElse<U = T>(or_fn: (e: E) => U): U {
    return or_fn(this.error);
  }

  toJSON(): JsonResult<T, E> {
    return { __orf_type__: "Result", tag: "Error", error: this.error };
  }
}
