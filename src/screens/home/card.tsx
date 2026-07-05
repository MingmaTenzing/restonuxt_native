import { Text, View } from 'react-native';

interface HomeCardProps {
  title: string;
  description: string;
}

export function HomeCard({ title, description }: HomeCardProps) {
  return (
    <View className="gap-2 rounded-3xl border border-zinc-200 bg-white p-5">
      <Text className="text-lg font-semibold text-zinc-950">{title}</Text>
      <Text className="text-base leading-6 text-zinc-600">{description}</Text>
    </View>
  );
}
