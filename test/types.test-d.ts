import { expectTypeOf, test } from "vitest";
import {
  FallibleFuture,
  Future,
  JsonOption,
  JsonResult,
  Option,
  orf,
  Result,
} from "../src/orf";
import { UnwrappedFuture } from "../src/future";

test("InferInnerType", () => {
  expectTypeOf<orf.InferInnerType<Future<number>>>().toMatchTypeOf<number>();
  expectTypeOf<
    orf.InferInnerType<FallibleFuture<string, number>>
  >().toMatchTypeOf<Result<string, number>>();
  expectTypeOf<
    orf.InferInnerType<UnwrappedFuture<string>>
  >().toMatchTypeOf<string>();
  expectTypeOf<orf.InferInnerType<Option<string>>>().toMatchTypeOf<string>();
  expectTypeOf<
    orf.InferInnerType<JsonOption<string>>
  >().toMatchTypeOf<string>();
});

test("InferOkType", () => {
  expectTypeOf<
    orf.InferOkType<FallibleFuture<string, number>>
  >().toMatchTypeOf<string>();
  expectTypeOf<
    orf.InferOkType<Result<string, number>>
  >().toMatchTypeOf<string>();
  expectTypeOf<
    orf.InferOkType<JsonResult<string, number>>
  >().toMatchTypeOf<string>();
});

test("InferErrorType", () => {
  expectTypeOf<
    orf.InferErrorType<FallibleFuture<string, number>>
  >().toMatchTypeOf<number>();
  expectTypeOf<
    orf.InferErrorType<Result<string, number>>
  >().toMatchTypeOf<number>();
  expectTypeOf<
    orf.InferErrorType<JsonResult<string, number>>
  >().toMatchTypeOf<number>();
});
