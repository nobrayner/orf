# orf

## 0.0.10

### Patch Changes

- 8f50277: Fix Future.fromFallible to handle PromiseLikes as well as Promises
- 8f50277: Future.fromFallible can now be called on async functions, to turn them into a FallibleFuture

## 0.0.9

### Patch Changes

- 099bcc1: Actually fix the type helpers

## 0.0.8

### Patch Changes

- 5291a8a: Fix inferrence type helpers to handle JsonResult and JsonOption

## 0.0.7

### Patch Changes

- ad67271: Adds Future.allResolved to get an tuple of resolved FallibleFutures

## 0.0.6

### Patch Changes

- 0b6e02d: Fixes fromJSON crashing when no value/error field found

## 0.0.5

### Patch Changes

- 4fbe589: Fixes a potential version mismatch issue where slightly different typescript versions would cause orf types to be incompatible with each other
- 4fbe589: Fixes generics in the `unwrapOr` and `unwrapOrElse` methods in FallibleFuture. These now allow different error values as the "or"

## 0.0.4

### Patch Changes

- 427bd5b: Fix then method declarations for futures

## 0.0.3

### Patch Changes

- a715eb3: Export Json\* types, and export helper types

## 0.0.2

### Patch Changes

- 19b039c: Future.fromFallible now accepts promises as an argument, and returns a FallibleFuture based on the promise

## 0.0.1

### Patch Changes

- 0275547: Add Result
- 0275547: Add Future
- 0275547: Add Option
