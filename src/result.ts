import { Option } from "./option";

const JSError = Error;

type InferOkType<T> = T extends Result<infer U, any> ? U : never;
type InferErrorType<T> = T extends Result<any, infer U> ? U : never;

interface IResult<T, E> {
  isOk(): this is Ok<T, E>;
  isError(): this is Error<T, E>;
  match<U, V = U>(config: { Ok: (t: T) => U; Error: (e: E) => V }): U | V;
  map<U>(map_fn: (t: T) => U): Result<U, E>;
  mapOr<U, V = U>(or_value: U, map_fn: (t: T) => V): U | V;
  mapOrElse<U, V = U>(or_fn: () => U, map_fn: (t: T) => V): U | V;
  mapErr<F>(map_fn: (e: E) => F): Result<T, F>;
  and<U, F = E>(and_value: Result<U, F>): Result<U, E | F>;
  andThen<U, F = E>(and_fn: (t: T) => Result<U, F>): Result<U, E | F>;
  or<F, U = T>(or_value: Result<U, F>): Result<T | U, F>;
  orElse<F, U = T>(or_fn: (e: E) => Result<U, F>): Result<T | U, F>;
  tap(fn: (t: T) => void): Result<T, E>;
  tapError(fn: (e: E) => void): Result<T, E>;
  ok(): Option<T>;
  unwrap(): T;
  unwrapErr(): E;
  unwrapOr<U = T>(or_value: U): T | U;
  unwrapOrElse<U = T>(fn: (e: E) => U): T | U;
  toJSON(): JsonResult<T, E>;
}

export type Ok<T, E> = __Ok<T, E>;
export type Error<T, E> = __Error<T, E>;
export type Result<T, E> = Ok<T, E> | Error<T, E>;
export type JsonResult<T, E> =
  | { __orf_type__: "Result"; tag: "Ok"; value: T }
  | { __orf_type__: "Result"; tag: "Error"; error: E };

export namespace Result {
  export function Ok<T>(value: T): Ok<T, never> {
    return new __Ok(value);
  }

  export function Error<E>(value: E): Error<never, E> {
    return new __Error(value);
  }

  export function isResult<T, E>(value: unknown): value is Result<T, E> {
    return value instanceof __Ok || value instanceof __Error;
  }

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

  mapErr<F>(_map_fn: (e: E) => F): Result<T, F> {
    return this as unknown as Result<T, F>;
  }

  and<U, F = E>(and_value: Result<U, F>): Result<U, E | F> {
    return and_value;
  }

  andThen<U, F = E>(and_fn: (t: T) => Result<U, F>): Result<U, E | F> {
    return and_fn(this.value);
  }

  or<F, U = T>(_or_value: Result<U, F>): Result<T | U, F> {
    return this as unknown as Result<T | U, F>;
  }

  orElse<F, U = T>(_or_fn: (e: E) => Result<U, F>): Result<T | U, F> {
    return this as unknown as Result<T | U, F>;
  }

  tap(fn: (t: T) => void): Result<T, E> {
    fn(this.value);

    return this;
  }

  tapError(_fn: (e: E) => void): Result<T, E> {
    return this;
  }

  ok(): Option<T> {
    return Option.Some(this.value);
  }

  unwrap(): T {
    return this.value;
  }

  unwrapErr(): E {
    throw new JSError("Cannot unwrapErr an Ok");
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

  mapErr<F>(map_fn: (e: E) => F): Result<T, F> {
    return Result.Error(map_fn(this.error));
  }

  and<U, F = E>(_and_value: Result<U, F>): Result<U, E | F> {
    return this as unknown as Result<U, E | F>;
  }

  andThen<U, F = E>(_and_fn: (t: T) => Result<U, F>): Result<U, E | F> {
    return this as unknown as Result<U, E | F>;
  }

  or<F, U = T>(or_value: Result<U, F>): Result<T | U, F> {
    return or_value;
  }

  orElse<F, U = T>(or_fn: (e: E) => Result<U, F>): Result<T | U, F> {
    return or_fn(this.error);
  }

  tap(_fn: (t: T) => void): Result<T, E> {
    return this;
  }

  tapError(fn: (e: E) => void): Result<T, E> {
    fn(this.error);

    return this;
  }

  ok(): Option<T> {
    return Option.None();
  }

  unwrap(): T {
    throw new JSError("Cannot unwrap an Error");
  }

  unwrapErr(): E {
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
