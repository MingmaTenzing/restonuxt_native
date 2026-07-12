import { Text, View } from 'react-native';

import { BarChart } from '@/components/bar-chart';
import { ScreenScroll } from '@/components/screen-scroll';
import { Table, TableCell, TableRow } from '@/components/table';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { formatDate } from '@/utils/format-date';
import { pluralize } from '@/utils/pluralize';

const events = [
  { attendees: 42, date: '2026-07-08', name: 'Launch review' },
  { attendees: 28, date: '2026-07-12', name: 'Design sync' },
  { attendees: 64, date: '2026-07-18', name: 'Partner demo' },
];

export default function EventsScreen() {
  const { isTablet } = useResponsiveLayout();

  return (
    <ScreenScroll>
      <View className="gap-2">
        <Text
          className={`font-bold tracking-tight text-foreground ${
            isTablet ? 'text-3xl' : 'text-4xl'
          }`}>
          Events
        </Text>
        <Text className="text-base leading-6 text-muted-foreground">
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
    </ScreenScroll>
  );
}
