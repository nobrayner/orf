type InferInnerType<O> = O extends Some<infer T>
  ? T
  : O extends None<infer T>
  ? T
  : never;

interface IOption<T> {
  isSome(): this is Some<T>;
  isNone(): this is None<T>;
  match<U, V = U>(config: { Some: (t: T) => U; None: () => V }): U | V;
  map<U>(fn: (t: T) => U): Option<U>;
  mapOr<U, V = U>(or_value: U, fn: (t: T) => V): U | V;
  mapOrElse<U, V = U>(or_fn: () => U, map_fn: (t: T) => V): U | V;
  and<U>(other: Option<U>): Option<U>;
  andThen<O extends Option<any>>(fn: (t: T) => O): Option<InferInnerType<O>>;
  or(other: Option<T>): Option<T>;
  orElse(fn: () => Option<T>): Option<T>;
  tap(fn: (t: T) => void): Option<T>;
  unwrap(): T;
  unwrapOr<U = T>(or_value: U): T | U;
  unwrapOrElse<U = T>(or_fn: () => U): T | U;
  // TODO: Implement these methods after Result
  //okOr<E>(error: E): Result<T, E>;
  //orOrElse<E>(fn: () => E): Result<T, E>;
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
  export function Some<T>(t: T): Some<T> {
    const some = new __Some(t);
    Object.freeze(some);
    return some;
  }

  export function None<T = never>(): None<T> {
    return NONE;
  }

  export function isOption(thing: unknown): thing is Option<unknown> {
    return thing instanceof __Some || thing instanceof __None;
  }

  export function from<T>(thing: T | null | undefined): Option<NonNullable<T>> {
    return !thing ? None() : Some(thing);
  }

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

  andThen<O extends Option<any>>(fn: (t: T) => O): Option<InferInnerType<O>> {
    return fn(this.value);
  }

  or(_other: Option<T>): Option<T> {
    return this;
  }

  orElse(_fn: () => Option<T>): Option<T> {
    return this;
  }

  tap(fn: (t: T) => void): Option<T> {
    fn(this.value);

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
    return Option.None();
  }

  mapOr<U, V = U>(or_value: U, _fn: (t: T) => V): U | V {
    return or_value;
  }

  mapOrElse<U, V = U>(or_fn: () => U, _map_fn: (t: T) => V): U | V {
    return or_fn();
  }

  and<U>(_other: Option<U>): Option<U> {
    return Option.None();
  }

  // The type signature here is different as there is no way to infer the
  // new option type, as we will never actually get the new Option as a result.
  andThen<O extends Option<any>>(_fn: (t: T) => O): Option<never> {
    return Option.None();
  }

  or(other: Option<T>): Option<T> {
    return other;
  }

  orElse(fn: () => Option<T>): Option<T> {
    return fn();
  }

  tap(_fn: (t: T) => void): Option<T> {
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

  toJSON(): JsonOption<T> {
    return { __orf_type__: "Option", tag: "None" };
  }
}

const NONE = Object.freeze(new __None<never>());
