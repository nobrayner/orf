import type { Future, FallibleFuture, UnwrappedFuture } from "./future";
import type { Result, JsonResult } from "./result";
import type { Option, JsonOption } from "./option";

/**
 * Type utilities for orf Option, Result, and Future types
 */
export namespace orf {
  /**
   * Infers the inner type of a Future, FallibleFuture, UnwrappedFuture, or Option
   */
  export type InferInnerType<T> = T extends Future<infer U>
    ? U
    : T extends FallibleFuture<infer U, infer F>
    ? Result<U, F>
    : T extends UnwrappedFuture<infer U>
    ? U
    : T extends Option<infer U>
    ? U
    : T extends JsonOption<infer U>
    ? U
    : never;

  /**
   * Infers the `Ok` type of a "fallible"
   * - FallibleFuture
   * - Result
   */
  export type InferOkType<T> = T extends FallibleFuture<infer U, infer _>
    ? U
    : T extends Result<infer U, infer _>
    ? U
    : T extends JsonResult<infer U, infer _>
    ? U
    : never;

  /**
   * Infers the `Error` type of a "fallible"
   * - FallibleFuture
   * - Result
   */
  export type InferErrorType<T> = T extends FallibleFuture<infer _, infer F>
    ? F
    : T extends Result<infer _, infer F>
    ? F
    : T extends JsonResult<infer _, infer F>
    ? F
    : never;
}
