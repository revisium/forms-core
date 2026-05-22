export type PathPart = string | number;

export function getPathValue(root: unknown, path: string): unknown {
  return parsePath(path).reduce<unknown>((value, part) => {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value !== 'object') {
      return undefined;
    }

    return (value as Record<string | number, unknown>)[part];
  }, root);
}

export function parsePath(path: string): readonly PathPart[] {
  const parts: PathPart[] = [];
  const pattern = /([^.[\]]+)|\[(\d+)\]/g;

  for (const match of path.matchAll(pattern)) {
    const objectKey = match[1];
    const arrayIndex = match[2];

    if (objectKey !== undefined) {
      parts.push(objectKey);
      continue;
    }

    if (arrayIndex !== undefined) {
      parts.push(Number(arrayIndex));
    }
  }

  return parts;
}

export function formatArrayItemPath(
  arrayPath: string,
  index: number,
  suffix: string,
): string {
  return `${arrayPath}[${index}]${suffix}`;
}

export function parseArrayItemPath(
  path: string,
  arrayPath: string,
): { readonly index: number; readonly suffix: string } | undefined {
  const prefix = `${arrayPath}[`;

  if (!path.startsWith(prefix)) {
    return undefined;
  }

  const indexEnd = path.indexOf(']', prefix.length);

  if (indexEnd === -1) {
    return undefined;
  }

  const rawIndex = path.slice(prefix.length, indexEnd);
  const index = Number(rawIndex);

  if (!Number.isInteger(index) || index < 0) {
    return undefined;
  }

  return {
    index,
    suffix: path.slice(indexEnd + 1),
  };
}
