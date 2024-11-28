import { Result } from "./result";

/**
 * Infer the inner type of an Option
 */
type InferInnerType<O> = O extends Some<infer T>
  ? T
  : O extends None<infer T>
  ? T
  : never;

interface IOption<T> {
  /**
   * Used to check if the Option is a `Some`, and if it is, narrows the
   * `Option<T>` to `Some<T>`
   *
   * Intended to be used as a type guard
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.isSome();
   * // result === true
   *
   * const opt = Option.None<number>();
   * const result = opt.isSome();
   * // result === false
   * ```
   */
  isSome(): this is Some<T>;

  /**
   * Used to check if the Option is `None`, and if it is, narrows the
   * `Option<T>` to `None<T>`
   *
   * Intended to be used as a type guard
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.isNone();
   * // result === false
   *
   * const opt = Option.None<number>();
   * const result = opt.isNone();
   * // result === true
   * ```
   */
  isNone(): this is None<T>;

  /**
   * Runs the function provided in the `Some` or `None` branch, passing the
   * value or nothing respectivly
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.match({
   *   Some: (value) => value,
   *   None: () => 0,
   * });
   * // result === 1
   *
   *
   * const opt = Option.None();
   * const result = opt.match({
   *   Some: (value) => value,
   *   None: () => 0,
   * });
   * // result === 0
   * ```
   */
  match<U, V = U>(config: { Some: (t: T) => U; None: () => V }): U | V;

  /**
   * Maps `Some<T>` to `Some<U>`, or returns the existing `None`
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.map((val) => `${val * 2}`);
   * // result === Option.Some("2")
   *
   * const opt = Option.None<number>();
   * const result = opt.map((val) => `${val * 2}`);
   * // result === Option.None()
   * ```
   */
  map<U>(fn: (t: T) => U): Option<U>;

  /**
   * Maps `Some<T>` to `V`, or returns the given `or_value`
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.mapOr(0, (val) => `${val * 2}`);
   * // result === "2"
   *
   * const opt = Option.None<number>();
   * const result = opt.mapOr(0, (val) => `${val * 2}`);
   * // result === 0
   * ```
   */
  mapOr<U, V = U>(or_value: U, fn: (t: T) => V): U | V;

  /**
   * Maps `Some<T>` to `V`, or returns the result of running `or_fn`
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.mapOrElse(() => 0, (val) => `${val * 2}`);
   * // result === "2"
   *
   * const opt = Option.None<number>();
   * const result = opt.mapOrElse(() => 0, (val) => `${val * 2}`);
   * // result === 0
   * ```
   */
  mapOrElse<U, V = U>(or_fn: () => U, map_fn: (t: T) => V): U | V;

  /**
   * Returns the existing `None` if the option is `None`, otherwise returns `other`
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.and(Option.Some("2"));
   * // result === Option.Some("2")
   *
   * const opt = Option.None<number>();
   * const result = opt.and(Option.Some("2"));
   * // result === Option.None()
   * ```
   */
  and<U>(other: Option<U>): Option<U>;

  /**
   * Returns the existing `None` if the option is `None`, otherwise returns the
   * result of running `fn` with the value held in `Some`
   *
   * ## Examle
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.andThen((val) => Option.Some(`${val * 2}`));
   * // result === Option.Some("2")
   *
   * const opt = Option.None<number>();
   * const result = opt.andThen(() => Option.Some("Hi"));
   * // result === Option.None()
   * ```
   */
  andThen<O extends Option<any | never>>(
    fn: (t: T) => O
  ): Option<InferInnerType<O> | T>;

  /**
   * Returns `other` if the option is `None`, otherwise returns the existing `Some<T>`
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.or(Option.Some(2));
   * // result === Option.Some(1)
   *
   * const opt = Option.None<number>();
   * const result = opt.or(Option.Some(2));
   * // result === Option.Some(2)
   * ```
   */
  or(other: Option<T>): Option<T>;

  /**
   * Returns the existing `Some<T>` if the option is `Some`, otherwise returns the
   * result of running `fn`
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.orElse(() => Option.Some(2));
   * // result === Option.Some(1)
   *
   * const opt = Option.None<number>();
   * const result = opt.orElse(() => Option.Some(2));
   * // result === Option.Some(2)
   * ```
   */
  orElse<O extends Option<any | never>>(
    fn: () => O
  ): Option<InferInnerType<O> | T>;

  /**
   * Runs the provided function with `Readonly<T>` if the option is `Some`, and then
   * returns the existing `Some<T>`; otherwise does nothing and returns the existing
   * `None`
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.tap((val) => {
   *   console.log("original:", val);
   *   console.log("doubled:", val * 2);
   * });
   * // Logs "original: 1"
   * // Logs "doubled: 2"
   * // result === Option.Some(1)
   *
   * const opt = Option.None<number>();
   * const result = opt.tap((val) => {
   *   console.log("original:", val);
   *   console.log("doubled:", val * 2);
   * });
   * // Does not log anything
   * // result === Option.None()
   * ```
   */
  tap(fn: (t: Readonly<T>) => void): Option<T>;

  /**
   * Returns the `T` of a `Some<T>`, or throws an exception if the option is `None`
   *
   * **Prefer `unwrapOr` or `unwrapOrElse` over this method**
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.unwrap();
   * // result === 1
   *
   * const opt = Option.None<number>();
   * const result = opt.unwrap();
   * // Throws an exception
   */
  unwrap(): T;

  /**
   * Returns the `T` of a `Some<T>`, or returns the provided `or_value` if the
   * option is `None`
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.unwrapOr(0);
   * // result === 1
   *
   * const opt = Option.None<number>();
   * const result = opt.unwrapOr(0);
   * // result === 0
   * ```
   */
  unwrapOr<U = T>(or_value: U): T | U;

  /**
   * Returns the `T` of a `Some<T>`, or returns the result of running `or_fn` if
   * the option is `None`
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.unwrapOrElse(() => 0);
   * // result === 1
   *
   * const opt = Option.None<number>();
   * const result = opt.unwrapOrElse(() => 0);
   * // result === 0
   * ```
   */
  unwrapOrElse<U = T>(or_fn: () => U): T | U;

  /**
   * Converts the `Option<T>` to a `Result<T, E>`, using the provided `error` as
   * the error value if the option is `None`
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.okOr("error");
   * // result === Result.Ok(1)
   *
   * const opt = Option.None<number>();
   * const result = opt.okOr("error");
   * // result === Result.Error("error")
   * ```
   */
  okOr<E>(error: E): Result<T, E>;

  /**
   * Converts the `Option<T>` to a `Result<T, E>`, using the result of running `fn`
   * as the error value if the option is `None`
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.okOrElse(() => "error");
   * // result === Result.Ok(1)
   *
   * const opt = Option.None<number>();
   * const result = opt.okOrElse(() => "error");
   * // result === Result.Error("error")
   * ```
   */
  okOrElse<E>(fn: () => E): Result<T, E>;

  /**
   * Converts the `Option<T>` to a JSON representation
   *
   * This is used when calling `JSON.stringify` on an `Option`, but is also
   * useful for serialization across network boundaries - e.g. to be returned
   * from a React server-action
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * const result = opt.toJSON();
   * // result === { __orf_type__: "Option", tag: "Some", value: 1 }
   *
   * const opt = Option.None<number>();
   * const result = opt.toJSON();
   * // result === { __orf_type__: "Option", tag: "None" }
   * ```
   */
  toJSON(): JsonOption<T>;
}

export type Some<T> = __Some<T>;
export type None<T> = __None<T>;
export type Option<T> = Some<T> | None<T>;
export type JsonOption<T> = { __orf_type__: "Option" } & (
  | { tag: "Some"; value: T }
  | { tag: "None" }
);

export namespace Option {
  /**
   * Creates a `Some<T>` with the provided value
   */
  export function Some<T>(t: T): Some<T> {
    return Object.freeze(new __Some(t));
  }

  /**
   * Creates a `None<T>`
   */
  export function None<T = never>(): None<T> {
    return NONE as unknown as None<T>;
  }

  /**
   * Typeguard to check if `thing` is an `Option`
   *
   * ## Example
   * ```ts
   * const opt = Option.Some(1);
   * if (Option.isOption(opt)) {
   *   // opt is an Option<unknown>
   * }
   * ```
   */
  export function isOption(thing: unknown): thing is Option<unknown> {
    return thing instanceof __Some || thing instanceof __None;
  }

  /**
   * Converts a `T | null | undefined` to an `Option<T>`, where `null` and `undefined`
   * become `None`, and any other value becomes `Some`
   *
   * ## Example
   * ```ts
   * const opt = Option.from(1);
   * // opt === Option.Some(1)
   *
   * const opt = Option.from(null);
   * // opt === Option.None()
   * ```
   */
  export function from<T>(thing: T | null | undefined): Option<NonNullable<T>> {
    return !thing ? None() : Some(thing);
  }

  /**
   * Converts a JSON representation of an `Option<T>` (`JsonOption<T>`) to an `Option<T>`,
   * or throws an exception if it isn't a valid `JsonOption`
   *
   * ## Example
   * ```ts
   * const json: JsonOption<number> = { __orf_type__: "Option", tag: "Some", value: 1 };
   * const opt = Option.fromJSON(json);
   * // opt === Option.Some(1)
   * ```
   */
  export function fromJSON<T>(json: JsonOption<T>): Option<T> {
    if (json.__orf_type__ !== "Option" && !("tag" in json)) {
      throw new Error("Invalid Option JSON");
    }

    if (json.tag === "Some" && "value" in json) {
      return Some(json.value);
    }

    if (json.tag === "None") {
      return None();
    }

    throw new Error("Invalid Option JSON");
  }
}

class __Some<T> implements IOption<T> {
  constructor(readonly value: T) {}

  isSome(): this is Some<T> {
    return true;
  }

  isNone(): this is None<T> {
    return !this.isSome();
  }

  match<U, V = U>(config: { Some: (t: T) => U; None: () => V }): U | V {
    return config.Some(this.value);
  }

  map<U>(fn: (t: T) => U): Option<U> {
    return Option.Some(fn(this.value));
  }

  mapOr<U, V = U>(_or_value: U, fn: (t: T) => V): U | V {
    return fn(this.value);
  }

  mapOrElse<U, V = U>(_or_fn: () => U, map_fn: (t: T) => V): U | V {
    return map_fn(this.value);
  }

  and<U>(other: Option<U>): Option<U> {
    return other;
  }

  andThen<O extends Option<any | never>>(
    fn: (t: T) => O
  ): Option<InferInnerType<O> | T> {
    return fn(this.value);
  }

  or(_other: Option<T>): Option<T> {
    return this;
  }

  orElse<O extends Option<any | never>>(
    _fn: () => O
  ): Option<InferInnerType<O> | T> {
    return this;
  }

  tap(fn: (t: Readonly<T>) => void): Option<T> {
    // TODO: Find out if this is a problem at all
    fn(Object.freeze(structuredClone(this.value)));

    return this;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr<U = T>(_or_value: U): T {
    return this.value;
  }

  unwrapOrElse<U = T>(_or_fn: () => U): T {
    return this.value;
  }

  okOr<E>(_error: E): Result<T, E> {
    return Result.Ok(this.value);
  }

  okOrElse<E>(_fn: () => E): Result<T, E> {
    return Result.Ok(this.value);
  }

  toJSON(): JsonOption<T> {
    return { __orf_type__: "Option", tag: "Some", value: this.value };
  }
}

class __None<T> implements IOption<T> {
  isSome(): this is Some<T> {
    return false;
  }

  isNone(): this is None<T> {
    return !this.isSome();
  }

  match<U, V = U>(config: { Some: (t: T) => U; None: () => V }): U | V {
    return config.None();
  }

  map<U>(_fn: (t: T) => U): Option<U> {
    return this as unknown as Option<U>;
  }

  mapOr<U, V = U>(or_value: U, _fn: (t: T) => V): U | V {
    return or_value;
  }

  mapOrElse<U, V = U>(or_fn: () => U, _map_fn: (t: T) => V): U | V {
    return or_fn();
  }

  and<U>(_other: Option<U>): Option<U> {
    return this as unknown as Option<U>;
  }

  andThen<O extends Option<any | never>>(
    _fn: (t: T) => O
  ): Option<InferInnerType<O> | T> {
    return this;
  }

  or(other: Option<T>): Option<T> {
    return other;
  }

  orElse<O extends Option<any | never>>(
    fn: () => O
  ): Option<InferInnerType<O> | T> {
    return fn();
  }

  tap(_fn: (t: Readonly<T>) => void): Option<T> {
    return this;
  }

  unwrap(): T {
    throw new Error("Cannot unwrap None");
  }

  unwrapOr<U = T>(or_value: U): U {
    return or_value;
  }

  unwrapOrElse<U = T>(or_fn: () => U): U {
    return or_fn();
  }

  okOr<E>(error: E): Result<T, E> {
    return Result.Error(error);
  }

  okOrElse<E>(fn: () => E): Result<T, E> {
    return Result.Error(fn());
  }

  toJSON(): JsonOption<T> {
    return { __orf_type__: "Option", tag: "None" };
  }
}

const NONE = Object.freeze(new __None<never>());
