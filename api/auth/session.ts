import { json } from '../_lib/http.js';
import { isAuthenticated } from '../_lib/session.js';

/** Lets the dashboard decide between the login form and the editor on load. */
export async function GET(request: Request): Promise<Response> {
  return json({ authenticated: isAuthenticated(request, process.env.SESSION_SECRET) }, 200, {
    'cache-control': 'no-store',
  });
}
