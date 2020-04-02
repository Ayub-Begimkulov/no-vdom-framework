export function toPath(str: string) {
  return str
    .replace(/(\[(\d)\])/g, '.$2')
    .split('.')
    .filter(s => s.length > 0);
}

export function get(
  obj: Record<string, any>,
  props: string | string[],
  defaultValue?: any
): any {
  const [nextKey, ...keys] = Array.isArray(props) ? props : toPath(props);
  const result = obj[nextKey];

  if (result && keys.length > 0) {
    return get(result, keys, defaultValue);
  }

  return result === undefined ? defaultValue : result;
}

export function set(
  obj: Record<string, any>,
  props: string | string[],
  value?: any
): any {
  const [nextKey, ...keys] = Array.isArray(props) ? props : toPath(props);

  if (keys.length > 1) {
    obj[nextKey] = obj[nextKey] || {};
    return set(obj[nextKey], keys, value);
  }

  obj[nextKey] = value;
}

export const pipe: any = (...fns: Function[]) =>
  fns.reduce((a, b) => (...n: any[]) => b(a(...n)));
