import { useEffect, useRef } from 'react';
import { Platform, Pressable, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon, motion, type IconName } from '@tripline/ui';
import { TripText } from './TripText';
import { useTriplineTheme } from '../theme';

/** 选中回弹：1 → 1.06 → 1，手法对齐 DatePickerSheet 的 BounceCapsule（instant 120ms / damping 0.55） */
const POP_IN = 80;
const POP_DAMPING = 0.55;

export type BouncyChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  /** 选中态底色，默认 primary；传入时请保证与 onColor 对比度 ≥ 4.5:1 */
  color?: string;
  /** 选中态图标/文字色，默认 onPrimary */
  onColor?: string;
  /** 未选中态图标色，默认 textSecondary（账本会传分类色） */
  iconColor?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  accessibilityLabel?: string;
};

/**
 * 共用选择 chip（分类 / 标签 / Day 胶囊）：
 * 按下 0.96 压缩；false→true 切换时 1→1.06→1 Q 弹 + 一次 selectionAsync；
 * 只动 transform，不推挤相邻布局；减弱动效时退化为瞬时变色（保留 haptic）。
 */
export function BouncyChip({
  label, selected, onPress, icon, color, onColor, iconColor, size = 'md', style, accessibilityLabel,
}: BouncyChipProps) {
  const { theme } = useTriplineTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const previousSelected = useRef(selected);

  // 仅在「未选中 → 选中」的瞬间回弹；首帧已是选中态（如默认分类）不播
  useEffect(() => {
    const was = previousSelected.current;
    previousSelected.current = selected;
    if (reducedMotion) {
      scale.value = 1;
      return;
    }
    if (selected && !was) {
      scale.value = withSequence(
        withTiming(1.06, { duration: POP_IN }),
        withSpring(1, { duration: motion.instant, dampingRatio: POP_DAMPING }),
      );
    }
  }, [selected, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const fill = color ?? theme.primary;
  const onFill = onColor ?? theme.onPrimary;
  const dims = size === 'sm'
    ? { paddingHorizontal: 12, paddingVertical: 7, text: 12, icon: 13 }
    : { paddingHorizontal: 15, paddingVertical: 9, text: 13, icon: 14 };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={() => {
          // 仅在「即将选中」的确认时刻给一次轻触反馈；取消选中不震
          if (!selected && Platform.OS !== 'web') void Haptics.selectionAsync();
          onPress();
        }}
        onPressIn={() => {
          scale.value = reducedMotion ? 1 : withSpring(0.96, { duration: motion.instant, dampingRatio: motion.dampingRatio });
        }}
        onPressOut={() => {
          scale.value = reducedMotion ? 1 : withSpring(1, { duration: motion.standard, dampingRatio: motion.dampingRatio });
        }}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={accessibilityLabel ?? label}
        style={[{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          paddingHorizontal: dims.paddingHorizontal, paddingVertical: dims.paddingVertical,
          borderRadius: 999,
          backgroundColor: selected ? fill : theme.surfaceAlt,
        }, style]}
      >
        {icon ? <Icon name={icon} size={dims.icon} color={selected ? onFill : (iconColor ?? theme.textSecondary)} /> : null}
        <TripText size={dims.text} weight={selected ? 'bold' : 'semibold'} style={{ color: selected ? onFill : theme.text }}>{label}</TripText>
      </Pressable>
    </Animated.View>
  );
}
