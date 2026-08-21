import { json } from '../_lib/http';
import { clearCookie } from '../_lib/session';

export async function POST(): Promise<Response> {
  return json({ ok: true }, 200, { 'set-cookie': clearCookie() });
}
