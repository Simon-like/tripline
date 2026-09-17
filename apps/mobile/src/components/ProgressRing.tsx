import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { RollingNumber } from './RollingNumber';
import { clampPercent } from './progressRingMath';
import { useTriplineTheme } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
/** 圆环过渡时长（280–350ms 区间），中心 RollingNumber 与其同步 */
const RING_DURATION = 300;

/** 进度环：percent 变化时 dashoffset 平滑过渡（约 300ms），中心 % 用 RollingNumber 同步滚动；减弱动效瞬变 */
export function ProgressRing({ percent, size = 104, compact = false }: { percent: number; size?: number; compact?: boolean }) {
  const { theme } = useTriplineTheme();
  const reducedMotion = useReducedMotion();
  const target = clampPercent(percent);
  const progress = useSharedValue(target);
  useEffect(() => {
    progress.value = reducedMotion
      ? target
      : withTiming(target, { duration: RING_DURATION, easing: Easing.out(Easing.cubic) });
  }, [target, reducedMotion, progress]);
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value / 100),
  }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={theme.surfaceAlt} strokeWidth={stroke} />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={theme.primary}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={ringProps}
        />
      </Svg>
      <RollingNumber value={target} duration={RING_DURATION} size={compact ? 17 : 22}
        format={(display) => display + '%'} style={{ color: theme.primary }} />
    </View>
  );
}
