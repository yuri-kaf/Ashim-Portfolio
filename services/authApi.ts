/** Session state as reported by the server; the cookie itself is httpOnly. */
export const getSession = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/session', { cache: 'no-store' });
    if (!response.ok) return false;
    return Boolean((await response.json()).authenticated);
  } catch {
    return false;
  }
};

/** Resolves on success; throws with the server's message so the form can show it. */
export const login = async (password: string): Promise<void> => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error ?? `Sign-in failed with status ${response.status}`);
  }
};

export const logout = async (): Promise<void> => {
  await fetch('/api/auth/logout', { method: 'POST' });
};
