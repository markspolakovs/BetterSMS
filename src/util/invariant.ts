/**
 * Taken from facebook/fbjs
 *
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule invariant
 * @flow
 */

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments to provide
 * information about what broke and what you were expecting.
 *
 * The invariant message will be stripped in production, but the invariant will
 * remain to ensure logic does not differ in production.
 */
export function invariant(
  condition: boolean | any,
  format: string,
  ...args: Array<any>
): void {
  if (!condition) {
    let error;
    if (format === undefined) {
      error = new Error(
        "Minified exception occurred; use the non-minified dev environment " +
          "for the full error message and additional helpful warnings."
      );
    } else {
      let argIndex = 0;
      error = new Error(format.replace(/%s/g, () => String(args[argIndex++])));
      error.name = "Invariant Violation";
    }

    (error as any).framesToPop = 1; // Skip invariant's own stack frame.
    throw error;
  }
}

///////////////////////////////////////////////////////////////////////////////////////
/////// The remainder of this file is pre-defined invariants for type checking. ///////
///////////////////////////////////////////////////////////////////////////////////////

interface Function {
  name: string;
}

type primitive = boolean | number | string | symbol | null | undefined;

type Classy<T> = Function & { prototype: T };

type TypeGuard<T> = (x: any) => x is T;

const TYPE_GUARDS_PRIMITIVE = [
  assertBoolean,
  assertNumber,
  assertString,
  assertSymbol,
  assertNull,
  assertUndefined
];

/**
 * Type guard for `boolean`.
 *
 * @param x
 *
 * @param msg The message to print if the check fails
 */
export function assertBoolean(x: any, msg?: string): x is boolean {
  invariant(typeof x === "boolean", msg || "Failed boolean check");
  return true;
}

/**
 * Type guard for `number`.
 *
 * @param x
 *
 * @param msg The message to print if the check fails
 */
export function assertNumber(x: any, msg?: string): x is number {
  invariant(typeof x === "number", msg || "Failed number check");
  return true;
}

/**
 * Type guard for `string`.
 *
 * @param x
 *
 * @param msg The message to print if the check fails
 */
export function assertString(x: any, msg?: string): x is string {
  invariant(typeof x === "string", msg || "Failed string check");
  return true;
}

/**
 * Type guard for `symbol`.
 *
 * @param x
 *
 * @param msg The message to print if the check fails
 */
export function assertSymbol(x: any, msg?: string): x is symbol {
  invariant(typeof x === "symbol", msg || "Failed symbol check");
  return true;
}

/**
 * Type guard for `null`.
 *
 * @param x
 *
 * @param msg The message to print if the check fails
 */
export function assertNull(x: any, msg?: string): x is null {
  invariant(x === null, msg || "Failed null check");
  return true;
}

/**
 * Type guard for `null`.
 *
 * @param x
 *
 * @param msg The message to print if the check fails
 */
export function assertNotNull<T>(
  x: T | null,
  msg?: string
): x is NonNullable<T> {
  invariant(x !== null, msg || "Failed non-null check");
  return true;
}

/**
 * Type guard for `undefined`.
 *
 * @param x
 *
 * @param message The message to print if the check fails
 */
export function assertUndefined(x: any, message?: string): x is undefined {
  invariant(x === undefined, message || "Failed undefined check");
  return true;
}

/**
 * Determines if something is a primitive.
 *
 * @param x
 *
 * @return `true` iff `x` is a `boolean`, `number`, `string`, `symbol`, `null`, or `undefined`.
 */
export function assertPrimitive(x: any, msg?: string): x is primitive {
  invariant(
    TYPE_GUARDS_PRIMITIVE.some(f => f(x)),
    msg || "Failed primitive check"
  );
  return true;
}

/**
 * Determines if something is not a primitive.
 *
 * @param x
 *
 * @param message The message to print if the check fails
 *
 * @return `true` iff `x` is not a primitive.
 */
export function assertNonPrimitive(x: any, message?: string): x is object {
  invariant(!assertPrimitive(x), message || "Failed non-primitive check");
  return true;
}

/**
 * Type guard for non-primitive types.
 *
 * @param type The class to create a type guard for.
 *
 * @param value The value to check
 *
 * @param message The message to print if the check fails
 *
 * @return `true` if `value` is `type`
 */
export function assertIs<T>(
  type: Classy<T>,
  x: any,
  message?: string
): x is T | never {
  // Useful mainly in the absence of strictNullChecks:
  if (assertPrimitive(type)) {
    throw new TypeError(
      `${String(type)} cannot be used as a type in the is() function.`
    );
  }
  invariant(
    x instanceof (type as any),
    message || "Failed type check for " + type.name
  );
  return true;
}
