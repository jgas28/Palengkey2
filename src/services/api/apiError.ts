/** A normalized API error. `code`/`data` carry the raw response body for
 * callers that need to branch on it (e.g. Checkout's COD verification gate);
 * most callers just read `.message`. */
export class ApiError extends Error {
  code?: string;
  data?: unknown;

  constructor(message: string, code?: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.data = data;
  }
}
