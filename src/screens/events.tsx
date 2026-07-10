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
      className="flex-1 bg-background dark:bg-background-dark"
      contentContainerClassName="gap-6 px-5 py-7"
      contentInsetAdjustmentBehavior="automatic">
      <View className="gap-2">
        <Text className="text-4xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
          Events
        </Text>
        <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
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
