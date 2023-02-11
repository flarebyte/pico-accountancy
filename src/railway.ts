interface Success<a> {
  status: 'success';
  value: a;
}
interface Failure<e> {
  status: 'failure';
  error: e;
}

export type Result<a, e> = Success<a> | Failure<e>;

/**
 * Return a successful response
 */
export const succeed = <a>(a: a): Success<a> => ({
  status: 'success',
  value: a,
});

/**
 * Return a failure result
 */
export const fail = <e>(e: e): Failure<e> => ({ status: 'failure', error: e });

export const withDefault =
  <a, e>(defaultValue: a) =>
  (result: Result<a, e>): a =>
    result.status === 'success' ? result.value : defaultValue;

export const map1 =
  <a, b, e>(func: (value: a) => b) =>
  (result: Result<a, e>): Result<b, e> => {
    return result.status === 'success' ? succeed(func(result.value)) : result;
  };

export const andThen =
  <a, b, e>(func: (value: a) => Result<b, e>) =>
  (result: Result<a, e>): Result<b, e> => {
    return result.status === 'success' ? func(result.value) : result;
  };
