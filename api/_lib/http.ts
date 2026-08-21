/** Shared response shapes, so every route answers in the same format. */
export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

export const error = (message: string, status: number, headers: Record<string, string> = {}) =>
  json({ error: message }, status, headers);

export const methodNotAllowed = (allowed: string[]) =>
  error('Method not allowed', 405, { allow: allowed.join(', ') });

/** Parses a JSON body, returning undefined rather than throwing on garbage. */
export const readJson = async (request: Request): Promise<unknown | undefined> => {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
};
