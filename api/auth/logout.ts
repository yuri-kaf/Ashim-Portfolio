import { json } from '../_lib/http.js';
import { clearCookie } from '../_lib/session.js';

export async function POST(): Promise<Response> {
  return json({ ok: true }, 200, { 'set-cookie': clearCookie() });
}
