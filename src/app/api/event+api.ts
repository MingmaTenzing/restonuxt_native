import { listEvents } from '@/server/db';

export function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? listEvents().length);

  return Response.json({ events: listEvents().slice(0, limit) });
}
