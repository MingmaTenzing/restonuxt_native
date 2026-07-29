import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { formatMoney } from '@/utils/format-money';

import { categoryLabel } from './dashboard-stats';
import type { PopularItem } from './types';

const AUTO_ADVANCE_MS = 4200;
const SLIDE_HEIGHT = 200;
const SLIDE_GAP = 12;

interface TrendingFoodsCarouselProps {
  items: PopularItem[];
}

export function TrendingFoodsCarousel({ items }: TrendingFoodsCarouselProps) {
  const slides = items.slice(0, 5);
  const { width: windowWidth } = useWindowDimensions();
  const { contentWidth, horizontalPadding, isTablet } = useResponsiveLayout();
  const trackWidth = Math.max(
    contentWidth - horizontalPadding * 2,
    Math.min(windowWidth - horizontalPadding * 2, 320)
  );
  // Peek the next card — Uber Eats–style horizontal browse.
  const slideWidth = Math.round(trackWidth * (slides.length > 1 ? 0.86 : 1));
  const snapInterval = slideWidth + SLIDE_GAP;
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const pausedRef = useRef(false);

  const goTo = useCallback(
    (next: number, animated = true) => {
      if (slides.length === 0) return;
      const clamped = ((next % slides.length) + slides.length) % slides.length;
      indexRef.current = clamped;
      setIndex(clamped);
      scrollRef.current?.scrollTo({ x: clamped * snapInterval, animated });
    },
    [snapInterval, slides.length]
  );

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      if (pausedRef.current) return;
      goTo(indexRef.current + 1);
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(timer);
  }, [goTo, slides.length]);

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
    if (Number.isNaN(next)) return;
    indexRef.current = next;
    setIndex(next);
  };

  if (slides.length === 0) {
    return (
      <View
        className="items-center justify-center rounded-3xl border border-border bg-card px-5 py-10"
        style={{ height: SLIDE_HEIGHT, borderCurve: 'continuous' }}>
        <Text className="text-center text-base leading-6 text-muted-foreground">
          Trending dishes will appear here once customers start ordering.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <ScrollView
        ref={scrollRef}
        horizontal
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => {
          pausedRef.current = true;
        }}
        onMomentumScrollEnd={(event) => {
          pausedRef.current = false;
          onMomentumEnd(event);
        }}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={{ gap: SLIDE_GAP }}
        style={{ marginHorizontal: -horizontalPadding, paddingHorizontal: horizontalPadding }}>
        {slides.map((item, slideIndex) => (
          <Pressable
            key={item.id}
            accessibilityRole="summary"
            accessibilityLabel={`Trending #${slideIndex + 1}: ${item.name}, ${item.sold_quantity} sold`}
            onPressIn={() => {
              pausedRef.current = true;
            }}
            onPressOut={() => {
              pausedRef.current = false;
            }}
            style={{ width: slideWidth }}>
            <View
              className="overflow-hidden rounded-3xl bg-card"
              style={{
                height: isTablet ? SLIDE_HEIGHT + 24 : SLIDE_HEIGHT,
                borderCurve: 'continuous',
                boxShadow: '0 8px 28px rgba(0, 0, 0, 0.12)',
              }}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  resizeMode="cover"
                  className="absolute inset-0 h-full w-full"
                />
              ) : (
                <View className="absolute inset-0 items-center justify-center bg-muted">
                  <Text className="text-5xl font-bold text-foreground/40">
                    {item.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}

              <View
                pointerEvents="none"
                className="absolute inset-0"
                style={{
                  experimental_backgroundImage:
                    'linear-gradient(to top, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.35) 42%, rgba(0, 0, 0, 0.08) 100%)',
                }}
              />

              <View className="absolute left-4 top-4 flex-row items-center gap-2">
                <View className="rounded-full bg-white/95 px-3 py-1.5">
                  <Text className="text-xs font-bold uppercase tracking-wide text-zinc-900">
                    #{slideIndex + 1} trending
                  </Text>
                </View>
                <View className="rounded-full bg-black/45 px-3 py-1.5">
                  <Text className="text-xs font-semibold text-white">
                    {categoryLabel(item.category)}
                  </Text>
                </View>
              </View>

              <View className="absolute bottom-0 left-0 right-0 gap-1 p-5">
                <Text numberOfLines={2} className="text-2xl font-bold tracking-tight text-white">
                  {item.name}
                </Text>
                <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
                  <Text className="text-sm font-semibold text-white/90">
                    {item.sold_quantity} sold
                  </Text>
                  <Text className="text-sm font-semibold text-white/90">
                    {formatMoney(item.priceCents)}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {slides.length > 1 ? (
        <View className="flex-row items-center justify-center gap-2">
          {slides.map((item, dotIndex) => (
            <Pressable
              key={`dot-${item.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Go to ${item.name}`}
              hitSlop={8}
              onPress={() => goTo(dotIndex)}
              className={`h-2 rounded-full ${
                dotIndex === index ? 'w-6 bg-foreground' : 'w-2 bg-muted-foreground/40'
              }`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
