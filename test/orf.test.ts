import { test, expect } from "vitest";
import { Result, Future } from "../src/orf";

test("Make a database call and return the results", async () => {
  const payload = {
    user_id: 1,
    thing: "some thing",
  };

  const result = await checkSession()
    .andThen((session) => {
      return validate({
        schema: {},
        payload,
        context: {
          session,
        },
      });
    })
    .andThen(({ session, payload }) => {
      return getUserById(session.user.id).map((user) => ({ payload, user }));
    })
    .andThen(({ payload, user }) => {
      if (user.age < 18) {
        return Result.Error({
          code: "USER_TOO_YOUNG" as const,
          message: "User is too young",
        });
      }

      return updateThing({
        user_id: user.id,
        thing: payload.thing,
      });
    })
    .mapError((error) => {
      console.error(error);
      return { code: error.code };
    })
    .unwrap();

  expect(result).toStrictEqual({ user_id: 1, thing: "some thing" });
});

type User = {
  id: number;
  name: string;
  age: number;
  pets: string[];
};
function getUserById(id: number) {
  return dbRequest(async (): Promise<User | null> => {
    if (id === 1) {
      return {
        id,
        name: "John Doe",
        age: 30,
        pets: ["dog", "cat"],
      };
    }

    return null;
  }, dbError("Failed to get user")).andThen((user) => {
    if (!user) {
      return Result.Error({
        code: "USER_NOT_FOUND" as const,
        message: `Couldn't find user with id: ${id}`,
      });
    }

    return Result.Ok(user);
  });
}

function updateThing<T>(input: T) {
  return dbRequest(async () => {
    return input;
  }, dbError("Failed to update thing"));
}

function dbRequest<T, E>(
  request: () => Promise<T>,
  errorHandler: (error: unknown) => E
) {
  return Future.makeFallible<T, E>((succeed, fail) => {
    request()
      .then(succeed)
      .catch((error) => {
        fail(errorHandler(error));
      });
  });
}

function dbError(message: string) {
  return (error: unknown) => {
    return { code: "DB_ERROR" as const, message, error };
  };
}

function validate<T, C extends Record<any, any> = never>({
  schema: _,
  payload,
  context,
}: {
  schema: any;
  payload: T;
  context?: C;
}): Result<{ payload: T } & C, { code: "INVALID_PAYLOAD"; errors: unknown[] }> {
  return Result.Ok<
    { payload: T } & C,
    { code: "INVALID_PAYLOAD"; errors: unknown[] }
  >({
    ...context,
    payload,
  } as { payload: T } & C);
}

function checkSession() {
  return Future.success<
    { user: { id: number } },
    { code: "UNATHENTICATED" | "UNKNOWN_ERROR" }
  >({
    user: {
      id: 1,
    },
  });
}
