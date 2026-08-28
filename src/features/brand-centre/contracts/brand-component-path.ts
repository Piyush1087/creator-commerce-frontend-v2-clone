/** W1.0 typed component-path encoding, not a semantic identity generator. */
export function encodeComponentSegment(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/gu,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function isCanonicalComponentPath(path: string): boolean {
  if (path === "$") return true;
  if (!path.startsWith("$/")) return false;
  const parts = path.slice(2).split("/");
  if (parts.length % 2 !== 0) return false;
  try {
    for (let index = 0; index < parts.length; index += 2) {
      const marker = parts[index];
      const value = decodeURIComponent(parts[index + 1]);
      if (
        !["f", "i"].includes(marker) ||
        !value ||
        value === "." ||
        value === ".." ||
        [...value].some(
          (character) =>
            character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
        )
      )
        return false;
      if (marker === "i" && /^(0|[1-9]\d*)$/u.test(value)) return false;
      if (encodeComponentSegment(value) !== parts[index + 1]) return false;
    }
    return true;
  } catch {
    return false;
  }
}
