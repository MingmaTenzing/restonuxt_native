import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { formatDate } from '@/utils/format-date';

import { staffDisplayName } from './roster-stats';
import type { LeaveRequest, LeaveStatus } from './types';

const STATUS_STYLES: Record<
  LeaveStatus,
  { label: string; badge: string; text: string }
> = {
  pending: {
    label: 'Pending',
    badge: 'bg-amber-100 dark:bg-amber-500/15',
    text: 'text-amber-800 dark:text-amber-200',
  },
  approved: {
    label: 'Approved',
    badge: 'bg-emerald-100 dark:bg-emerald-500/15',
    text: 'text-emerald-800 dark:text-emerald-200',
  },
  rejected: {
    label: 'Rejected',
    badge: 'bg-red-100 dark:bg-red-500/15',
    text: 'text-red-800 dark:text-red-200',
  },
};

interface RosterLeaveCardProps {
  request: LeaveRequest;
  onApprove: () => void;
  onReject: () => void;
  isUpdating: boolean;
}

export function RosterLeaveCard({
  request,
  onApprove,
  onReject,
  isUpdating,
}: RosterLeaveCardProps) {
  const statusStyle = STATUS_STYLES[request.status];

  return (
    <View
      className="gap-4 rounded-3xl border border-border bg-card p-5"
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-lg font-semibold text-foreground">
            {staffDisplayName(request.staff)}
          </Text>
          <Text className="text-sm text-muted-foreground">
            Submitted {formatDate(request.submittedAt)}
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${statusStyle.badge}`}>
          <Text className={`text-xs font-semibold ${statusStyle.text}`}>{statusStyle.label}</Text>
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-muted-foreground">Dates</Text>
        <Text className="text-base text-foreground">
          {formatDate(request.startDate)} – {formatDate(request.endDate)}
        </Text>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-muted-foreground">Reason</Text>
        <Text className="text-base leading-6 text-foreground">{request.reason}</Text>
      </View>

      {request.status === 'pending' ? (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button onPress={onApprove}>{isUpdating ? 'Saving...' : 'Approve'}</Button>
          </View>
          <Pressable
            onPress={onReject}
            disabled={isUpdating}
            className="flex-1 items-center justify-center rounded-full border border-border bg-card px-5 py-3.5 active:opacity-80"
            style={{ borderCurve: 'continuous' }}>
            <Text className="text-center text-base font-semibold text-foreground">Reject</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
