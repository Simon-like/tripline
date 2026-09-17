import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { motion } from '@tripline/ui';

/** 小列表逐项入场；长列表和减弱动效直接展示，避免滚动时积压动画。 */
export function CascadeIn({ index, total, style, children }: { index: number; total: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = total > 10 || reduceMotion
      ? 1
      : withDelay(index * motion.stagger, withSpring(1, { duration: motion.expand, dampingRatio: motion.dampingRatio }));
  }, [index, progress, reduceMotion, total]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 14 }],
  }));
  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
