import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { motion } from '@tripline/ui';
import { useTriplineTheme } from '../theme';

const OFFSET_X = [-34, -12, 14, 36, 58, -52] as const;
const OFFSET_Y = [-26, -48, -18, -42, -24, -52] as const;

type Props = {
  /** 彩带锚点（容器右上角为原点），默认 top 10 / right 16 */
  top?: number;
  right?: number;
  bottom?: number;
  /** 三色循环，默认 [primary, accent, celebrate] */
  colors?: [string, string, string];
  /** 粒子尺寸，默认 8×14 */
  pieceWidth?: number;
  pieceHeight?: number;
  /** 结束时渐隐（瞬时庆祝）；false 表示常驻装饰 */
  fade?: boolean;
};

/**
 * 600ms 彩带庆祝（上限 motion.celebrate），只动 transform/opacity。
 * 减弱动效时：fade 模式直接不渲染；常驻模式退化为静态碎片。
 */
export function ConfettiCelebration({
  top, right = 16, bottom, colors, pieceWidth = 8, pieceHeight = 14, fade = true,
}: Props) {
  const { theme } = useTriplineTheme();
  const reduceMotion = useReducedMotion();
  const travel = useSharedValue(0);
  useEffect(() => {
    travel.value = reduceMotion ? 1 : withSpring(1, { duration: motion.celebrate, dampingRatio: motion.dampingRatio });
  }, [reduceMotion, travel]);
  if (reduceMotion && fade) return null;
  const palette = colors ?? [theme.primary, theme.accent, theme.celebrate];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top, right, bottom, width: 0, height: 0 }}>
      {OFFSET_X.map((x, index) => (
        <Piece key={index} index={index} x={x} travel={travel} reduceMotion={reduceMotion} fade={fade}
          width={pieceWidth} height={pieceHeight} color={palette[index % palette.length]} />
      ))}
    </View>
  );
}

function Piece({ index, x, travel, reduceMotion, fade, width, height, color }: {
  index: number; x: number; travel: SharedValue<number>; reduceMotion: boolean; fade: boolean;
  width: number; height: number; color: string;
}) {
  const y = OFFSET_Y[index];
  const style = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 1 : fade ? 1 - travel.value * 0.6 : travel.value,
    transform: [{ translateX: x * travel.value }, { translateY: y * travel.value }, { rotate: index % 2 ? '-28deg' : '28deg' }],
  }));
  return <Animated.View style={[{ position: 'absolute', width, height, borderRadius: 3, backgroundColor: color }, style]} />;
}
