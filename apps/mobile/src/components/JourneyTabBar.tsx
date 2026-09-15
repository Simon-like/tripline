import { useEffect, useState, type ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, motion, type IconName } from '@tripline/ui';
import { TripText } from './TripText';
import { useTriplineTheme } from '../theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const tabs: Record<string, { title: string; icon: IconName }> = {
  checklist: { title: '清单', icon: 'luggage' },
  itinerary: { title: '行程', icon: 'map' },
  ledger: { title: '账本', icon: 'wallet' },
  journal: { title: '手账', icon: 'notebook' },
  return: { title: '返程', icon: 'plane' },
};

export function JourneyTabBar({ state, navigation, journeyId }: TabBarProps & { journeyId: string }) {
  const { theme, dark } = useTriplineTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const cellWidth = width > 0 ? (width - 12) / state.routes.length : 0;
  const offset = useSharedValue(0);
  const stretch = useSharedValue(1);

  useEffect(() => {
    const destination = cellWidth * state.index;
    offset.value = reduceMotion ? destination : withSpring(destination, { duration: motion.expand, dampingRatio: motion.dampingRatio });
    stretch.value = reduceMotion ? 1 : withSequence(
      withSpring(1.13, { duration: motion.instant, dampingRatio: motion.dampingRatio }),
      withSpring(1, { duration: motion.standard, dampingRatio: motion.dampingRatio }),
    );
  }, [cellWidth, offset, reduceMotion, state.index, stretch]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }, { scaleX: stretch.value }],
  }));

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ position: 'absolute', left: 20, right: 20, bottom: Math.max(insets.bottom, 12), height: 74,
        borderRadius: 38, borderWidth: 1, borderColor: theme.glassStroke, overflow: 'hidden',
        shadowColor: theme.shadow, shadowOpacity: dark ? 0.36 : 0.16, shadowRadius: 22,
        shadowOffset: { width: 0, height: 10 }, elevation: 14 }}>
      {Platform.OS === 'ios' ? (
        <BlurView tint={dark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'} intensity={70} style={StyleSheet.absoluteFill} />
      ) : null}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: Platform.OS === 'ios' ? theme.glassFill : theme.glassFallback }]} />
      <View pointerEvents="none" style={{ position: 'absolute', top: 1, left: 20, right: 20, height: 1, backgroundColor: theme.glassStroke }} />

      {cellWidth > 0 ? (
        <Animated.View pointerEvents="none" style={[{
          position: 'absolute', left: 6, top: 6, width: cellWidth, height: 60,
          borderRadius: 31, backgroundColor: theme.glassSelection,
          borderWidth: 1, borderColor: theme.glassStroke,
        }, indicatorStyle]} />
      ) : null}

      <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 6 }}>
        {state.routes.map((route, index) => {
          const spec = tabs[route.name];
          if (!spec) return null;
          const focused = state.index === index;
          const color = focused ? theme.primary : theme.textSecondary;
          return (
            <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: focused }}
              accessibilityLabel={spec.title} onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, { ...route.params, id: journeyId });
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={{ flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Icon name={spec.icon} size={focused ? 24 : 21} color={color} />
              <TripText size={11} weight="semibold" style={{ color }}>{spec.title}</TripText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
