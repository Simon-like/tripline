import { memo, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { darkJourneyPalettes, Icon, lightJourneyPalettes, type JourneyPalette } from '@tripline/ui';
import { deriveJourneyStatus, type Journey } from '@tripline/shared';
import { TripText } from './TripText';

const CARD_GAP = 12;
const PAGE_PADDING = 22;
const NEXT_CARD_PEEK = 32;

function CardScene({ palette }: { palette: JourneyPalette }) {
  return (
    <Svg width="100%" height="124" viewBox="0 0 340 170" preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.56 }}>
      <Circle cx="315" cy="28" r="18" fill={palette.detail} />
      <Path d="M0 142L62 72L92 103L159 24L240 132L282 82L340 143V170H0Z" fill={palette.detail} opacity={0.38} />
      <Path d="M0 161L76 103L122 145L200 68L292 157L340 118V170H0Z" fill={palette.onCard} opacity={0.22} />
      <Path d="M0 170L59 140L115 163L183 121L258 170Z" fill={palette.detail} opacity={0.30} />
    </Svg>
  );
}

function WindCard({ journey, index, width, today, scrollX, palette, selected, onSelect, onOpen }: {
  journey: Journey;
  index: number;
  width: number;
  today: string;
  scrollX: SharedValue<number>;
  palette: JourneyPalette;
  selected: boolean;
  onSelect: (journey: Journey) => void;
  onOpen: (journey: Journey) => void;
}) {
  const reduceMotion = useReducedMotion();
  const pressStartX = useRef(0);
  const style = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 1, transform: [{ translateY: 0 }, { rotate: '0deg' }, { scale: 1 }] };
    const input = [index - 1, index, index + 1];
    return {
      opacity: interpolate(scrollX.value, input, [0.76, 1, 0.76], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(scrollX.value, input, [10, 0, 10], Extrapolation.CLAMP) },
        { rotate: `${interpolate(scrollX.value, input, [5, 0, -5], Extrapolation.CLAMP)}deg` },
        { scale: interpolate(scrollX.value, input, [0.95, 1, 0.95], Extrapolation.CLAMP) },
      ],
    };
  });
  const status = deriveJourneyStatus(today, journey.startDate, journey.endDate);
  const statusLabel = status === 'traveling' ? '正在旅途中' : '出发准备中';

  return (
    <Animated.View style={[{ width, minHeight: 276 }, style]}>
      <View
        style={{
          flex: 1,
          minHeight: 276,
          borderRadius: 32,
          padding: 24,
          overflow: 'hidden',
          justifyContent: 'space-between',
          backgroundColor: palette.card,
        }}>
        <Pressable
          onPressIn={(event) => { pressStartX.current = event.nativeEvent.pageX; }}
          onPress={(event) => {
            if (Math.abs(event.nativeEvent.pageX - pressStartX.current) < 12) onSelect(journey);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${journey.name}，${statusLabel}，选择旅程`}
          accessibilityState={{ selected }}
          style={{ position: 'absolute', inset: 0, zIndex: 2, backgroundColor: 'transparent' }}
        />
        <CardScene palette={palette} />
        <View pointerEvents="none" style={{ zIndex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ backgroundColor: palette.onCard, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 }}>
            <TripText size={12} weight="bold" style={{ color: palette.card }}>● {statusLabel}</TripText>
          </View>
          <Icon name="arrow-up-right" size={23} color={palette.onCard} />
        </View>
        <View pointerEvents="none" style={{ zIndex: 1, gap: 3 }}>
          <TripText size={29} weight="bold" numberOfLines={2} style={{ color: palette.onCard }}>{journey.name}</TripText>
          <TripText size={14} style={{ color: palette.onCard }}>
            {journey.startDate.slice(5).replace('-', '月')}日 — {journey.endDate.slice(5).replace('-', '月')}日
          </TripText>
        </View>
        <View pointerEvents="box-none" style={{ zIndex: 3, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <TripText pointerEvents="none" size={12} numberOfLines={1} style={{ color: palette.onCard, flex: 1 }}>
            {journey.companions.length ? `和 ${journey.companions.join('、')} 一起` : '一个人的好旅程'}
          </TripText>
          {selected ? (
            <Pressable
              onPress={() => onOpen(journey)}
              accessibilityRole="button"
              accessibilityLabel={`进入旅程${journey.name}`}
              hitSlop={8}
              style={({ pressed }) => ({
                backgroundColor: palette.onCard,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 7,
                opacity: pressed ? 0.82 : 1,
              })}>
              <TripText size={12} weight="semibold" style={{ color: palette.card }}>进入旅程 →</TripText>
            </Pressable>
          ) : (
            <TripText pointerEvents="none" size={12} weight="semibold" style={{ color: palette.onCard }}>轻触切换</TripText>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const MemoWindCard = memo(WindCard);

function PageDot({ index, scrollX, color }: { index: number; scrollX: SharedValue<number>; color: string }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, [index - 1, index, index + 1], [0.26, 1, 0.26], Extrapolation.CLAMP),
    transform: [{ scaleX: interpolate(scrollX.value, [index - 1, index, index + 1], [0.55, 1.5, 0.55], Extrapolation.CLAMP) }],
  }));
  return <Animated.View style={[{ width: 12, height: 6, borderRadius: 999, backgroundColor: color }, style]} />;
}

export function JourneyCarousel({ journeys, selectedId, today, dark, progress, onSelect, onOpen }: {
  journeys: Journey[];
  selectedId?: string;
  today: string;
  dark: boolean;
  progress: SharedValue<number>;
  onSelect: (journey: Journey) => void;
  onOpen: (journey: Journey) => void;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.max(260, screenWidth - PAGE_PADDING * 2 - NEXT_CARD_PEEK);
  const stride = cardWidth + CARD_GAP;
  const listRef = useRef<FlatList<Journey>>(null);
  const dragging = useRef(false);
  const programmaticTarget = useRef<number | null>(null);
  const selectOnlyUntil = useRef(0);
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(Math.max(0, journeys.findIndex((item) => item.id === selectedId)));
  const palettes = dark ? darkJourneyPalettes : lightJourneyPalettes;

  useEffect(() => {
    const index = Math.max(0, journeys.findIndex((item) => item.id === selectedId));
    setActiveIndex(index);
    progress.value = index;
    listRef.current?.scrollToOffset({ offset: index * stride, animated: false });
  }, [journeys, progress, selectedId, stride]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => { progress.value = event.contentOffset.x / stride; },
  });

  return (
    <View style={{ marginHorizontal: -PAGE_PADDING }}>
      <Animated.FlatList
        ref={listRef}
        horizontal
        data={journeys}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MemoWindCard journey={item} index={index} width={cardWidth} today={today}
            scrollX={progress} palette={palettes[index % palettes.length]!} selected={index === activeIndex}
            onSelect={(journey) => {
              if (dragging.current) return;
              if (index !== activeIndex) {
                selectOnlyUntil.current = Date.now() + 500;
                if (reduceMotion) {
                  listRef.current?.scrollToOffset({ offset: index * stride, animated: false });
                  setActiveIndex(index);
                  onSelect(journey);
                  void Haptics.selectionAsync();
                  return;
                }
                programmaticTarget.current = index;
                listRef.current?.scrollToOffset({ offset: index * stride, animated: true });
                return;
              }
              onSelect(journey);
            }}
            onOpen={(journey) => {
              if (dragging.current || programmaticTarget.current !== null || Date.now() < selectOnlyUntil.current) return;
              onOpen(journey);
            }} />
        )}
        ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
        contentContainerStyle={{ paddingHorizontal: PAGE_PADDING, paddingBottom: 10 }}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={stride}
        snapToAlignment="start"
        disableIntervalMomentum
        bounces={journeys.length > 1}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          dragging.current = true;
          programmaticTarget.current = null;
        }}
        onScrollEndDrag={(event) => {
          if (Math.abs(event.nativeEvent.velocity?.x ?? 0) < 0.05) {
            requestAnimationFrame(() => { dragging.current = false; });
          }
        }}
        getItemLayout={(_, index) => ({ length: stride, offset: stride * index, index })}
        onMomentumScrollEnd={(event) => {
          const index = Math.max(0, Math.min(journeys.length - 1, Math.round(event.nativeEvent.contentOffset.x / stride)));
          if (index !== activeIndex) void Haptics.selectionAsync();
          setActiveIndex(index);
          const journey = journeys[index];
          if (journey) onSelect(journey);
          dragging.current = false;
          programmaticTarget.current = null;
        }}
      />
      {journeys.length > 1 ? (
        <View accessibilityLabel={`第 ${activeIndex + 1} 趟，共 ${journeys.length} 趟`} style={{ height: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 }}>
          {journeys.map((journey, index) => <PageDot key={journey.id} index={index} scrollX={progress} color={palettes[index % palettes.length]!.card} />)}
        </View>
      ) : null}
    </View>
  );
}
