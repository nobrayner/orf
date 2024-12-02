# orf

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
