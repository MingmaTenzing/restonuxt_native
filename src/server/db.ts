const events = [
  { attendees: 42, date: '2026-07-08', id: 'event_001', name: 'Launch review' },
  { attendees: 28, date: '2026-07-12', id: 'event_002', name: 'Design sync' },
  { attendees: 64, date: '2026-07-18', id: 'event_003', name: 'Partner demo' },
];

const users = [
  { id: 'user_001', name: 'Demo User', role: 'admin' },
  { id: 'user_002', name: 'Event Coordinator', role: 'member' },
];

export function listEvents() {
  return events;
}

export function listUsers() {
  return users;
}
