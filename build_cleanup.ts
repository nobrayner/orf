import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";
import { readFileSync, writeFileSync } from "node:fs";

/*

This is to resolve a weird issue with type declaration file generation.

A stripped down example:

class Thing {
  #name: string = "Thing";

  private then(onResolved?: (value: string) => void): Thing {
    // ...
  }
}

Would get the declaration of:

class Thing {
  private then;
}

This has two issues:
1. Cannot be awaited because "it wouldn't do anything for this expression"
2. Does not get the correct return type - in the above example, the variable
would be `Thing` instead of `string`

The following is some babel parsing/traversing/replacing to ensure the correct
declaration signatures are in the built type declaration file.
 
 */

const dts_filename = "./lib/orf.d.ts";

let future_call_count = 0;
let falliblefuture_call_count = 0;
let unwrappedfuture_call_count = 0;

const ast = parse(readFileSync(dts_filename, "utf8"), {
  sourceType: "module",
  plugins: [["typescript", { dts: true }]],
});
traverse(ast, {
  ClassDeclaration(path) {
    if (path.node.id.name === "__Future") {
      path.traverse({
        ClassProperty(path) {
          if (path.node.key.name === "then") {
            path.replaceWith(createFuture__then(path));
          }
        },
      });
    }
    if (path.node.id.name === "__FallibleFuture") {
      path.traverse({
        ClassProperty(path) {
          if (path.node.key.name === "then") {
            path.replaceWith(createFallibleFuture__then(path));
          }
        },
      });
    }
    if (path.node.id.name === "__UnwrappedFuture") {
      path.traverse({
        ClassProperty(path) {
          if (path.node.key.name === "then") {
            path.replaceWith(createUnwrappedFuture__then(path));
          }
        },
      });
    }
  },
});

function createFuture__then(path: any) {
  const node = t.tsDeclareMethod(
    null,
    t.identifier("then"),
    null,
    [
      (() => {
        const param = t.identifier("onResolved");

        const arg = t.identifier("value");
        arg.typeAnnotation = t.tsTypeAnnotation(
          t.tsTypeReference(
            t.identifier("Option"),
            t.tsTypeParameterInstantiation([
              t.tsTypeReference(t.identifier("T")),
            ])
          )
        );

        param.typeAnnotation = t.tsTypeAnnotation(
          t.tsFunctionType(null, [arg], t.tsTypeAnnotation(t.tsVoidKeyword()))
        );
        param.optional = true;

        return param;
      })(),
    ],
    t.tsTypeAnnotation(
      t.tsTypeReference(
        t.identifier("Future"),
        t.tsTypeParameterInstantiation([t.tsTypeReference(t.identifier("T"))])
      )
    )
  );
  node.accessibility = "private";
  node.leadingComments = path.node.leadingComments;

  future_call_count += 1;

  return node;
}

function createFallibleFuture__then(path: any) {
  const node = t.tsDeclareMethod(
    null,
    t.identifier("then"),
    null,
    [
      (() => {
        const param = t.identifier("onResolved");

        const arg = t.identifier("value");
        arg.typeAnnotation = t.tsTypeAnnotation(
          t.tsTypeReference(
            t.identifier("Option"),
            t.tsTypeParameterInstantiation([
              t.tsTypeReference(
                t.identifier("Result"),
                t.tsTypeParameterInstantiation([
                  t.tsTypeReference(t.identifier("T")),
                  t.tsTypeReference(t.identifier("E")),
                ])
              ),
            ])
          )
        );

        param.typeAnnotation = t.tsTypeAnnotation(
          t.tsFunctionType(null, [arg], t.tsTypeAnnotation(t.tsVoidKeyword()))
        );
        param.optional = true;

        return param;
      })(),
    ],
    t.tsTypeAnnotation(
      t.tsTypeReference(
        t.identifier("FallibleFuture"),
        t.tsTypeParameterInstantiation([
          t.tsTypeReference(t.identifier("T")),
          t.tsTypeReference(t.identifier("E")),
        ])
      )
    )
  );
  node.accessibility = "private";
  node.leadingComments = path.node.leadingComments;

  falliblefuture_call_count += 1;

  return node;
}

function createUnwrappedFuture__then(path: any) {
  const node = t.tsDeclareMethod(
    null,
    t.identifier("then"),
    null,
    [
      (() => {
        const param = t.identifier("onResolved");

        const arg = t.identifier("value");
        arg.typeAnnotation = t.tsTypeAnnotation(
          t.tsTypeReference(t.identifier("T"))
        );

        param.typeAnnotation = t.tsTypeAnnotation(
          t.tsFunctionType(null, [arg], t.tsTypeAnnotation(t.tsVoidKeyword()))
        );
        param.optional = true;

        return param;
      })(),
      (() => {
        const param = t.identifier("onCancelled");

        const arg = t.identifier("error");
        arg.typeAnnotation = t.tsTypeAnnotation(t.tsAnyKeyword());

        param.typeAnnotation = t.tsTypeAnnotation(
          t.tsFunctionType(null, [arg], t.tsTypeAnnotation(t.tsVoidKeyword()))
        );
        param.optional = true;

        return param;
      })(),
    ],
    t.tsTypeAnnotation(
      t.tsTypeReference(
        t.identifier("UnwrappedFuture"),
        t.tsTypeParameterInstantiation([t.tsTypeReference(t.identifier("T"))])
      )
    )
  );
  node.accessibility = "private";
  node.leadingComments = path.node.leadingComments;

  unwrappedfuture_call_count += 1;

  return node;
}

if (
  future_call_count !== 1 ||
  falliblefuture_call_count !== 1 ||
  unwrappedfuture_call_count !== 1
) {
  throw new Error(
    `Expected to find exactly one instance of each of __Future, __FallibleFuture, and __UnwrappedFuture\n\nInstead found:\n__Future: ${future_call_count}\n__FallibleFuture: ${falliblefuture_call_count}\n__UnwrappedFuture: ${unwrappedfuture_call_count}`
  );
}

const result = generate(ast);

writeFileSync(dts_filename, result.code, {
  encoding: "utf8",
});
