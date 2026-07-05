export function getCurrentUser(request: Request) {
  const authorization = request.headers.get('authorization');

  return {
    authenticated: Boolean(authorization),
    id: authorization ? 'user_001' : null,
    name: authorization ? 'Demo User' : 'Guest',
  };
}
