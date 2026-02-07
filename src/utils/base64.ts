export function decodeBase64Json<T>(value: unknown): T | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  try {
    const decoded = Buffer.from(value, "base64").toString("utf8");

    if (!decoded.startsWith("{") && !decoded.startsWith("[")) {
      return null;
    }

    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}
