import { getCurrentUser } from '@/server/auth';
import { listUsers } from '@/server/db';

export function GET(request: Request) {
  return Response.json({ currentUser: getCurrentUser(request), users: listUsers() });
}
