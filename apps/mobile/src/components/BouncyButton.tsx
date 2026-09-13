import type { PropsWithChildren } from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { motion } from '@tripline/ui';

type Props = PropsWithChildren<PressableProps & { style?: ViewStyle }>;

export function BouncyButton({ children, style, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        {...rest}
        onPressIn={(event) => {
          scale.value = reducedMotion ? 0.96 : withSpring(0.96, { duration: motion.instant, dampingRatio: motion.dampingRatio });
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.value = reducedMotion ? 1 : withSpring(1, { duration: motion.standard, dampingRatio: motion.dampingRatio });
          onPressOut?.(event);
        }}
        style={style}
      >{children}</Pressable>
    </Animated.View>
  );
}
