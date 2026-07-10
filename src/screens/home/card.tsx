import { Text, View } from 'react-native';

interface HomeCardProps {
  title: string;
  description: string;
}

export function HomeCard({ title, description }: HomeCardProps) {
  return (
    <View
      className="gap-2 rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
      style={{ borderCurve: 'continuous', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)' }}>
      <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
        {title}
      </Text>
      <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
        {description}
      </Text>
    </View>
  );
}
