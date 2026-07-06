import { ScrollView, Text, View } from 'react-native';

import { BarChart } from '@/components/bar-chart';
import { Table, TableCell, TableRow } from '@/components/table';
import { formatDate } from '@/utils/format-date';
import { pluralize } from '@/utils/pluralize';

const events = [
  { attendees: 42, date: '2026-07-08', name: 'Launch review' },
  { attendees: 28, date: '2026-07-12', name: 'Design sync' },
  { attendees: 64, date: '2026-07-18', name: 'Partner demo' },
];

export default function EventsScreen() {
  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-black"
      contentContainerClassName="gap-6 px-5 py-6"
      contentInsetAdjustmentBehavior="automatic">
      <View className="gap-2">
        <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Events</Text>
        <Text className="text-base leading-6 text-neutral-500 dark:text-neutral-400">
          {events.length} {pluralize(events.length, 'scheduled event')} in the current plan.
        </Text>
      </View>

      <BarChart values={events.map((event) => event.attendees)} />

      <Table>
        {events.map((event) => (
          <TableRow key={event.name}>
            <TableCell label="Event">{event.name}</TableCell>
            <TableCell label="Date">{formatDate(event.date)}</TableCell>
          </TableRow>
        ))}
      </Table>
    </ScrollView>
  );
}
