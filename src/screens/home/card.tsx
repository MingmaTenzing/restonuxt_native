import { Text, View } from 'react-native';

interface HomeCardProps {
  title: string;
  description: string;
}

export function HomeCard({ title, description }: HomeCardProps) {
  return (
    <View
      className="gap-2 rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      style={{ borderCurve: 'continuous' }}>
      <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{title}</Text>
      <Text className="text-base leading-6 text-neutral-500 dark:text-neutral-400">
        {description}
      </Text>
    </View>
  );
}
