import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { TripText } from './TripText';
import { clampPercent } from './progressRingMath';
import { useTriplineTheme } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
/** 圆环过渡时长（280–350ms 区间），中心数字与其同步 */
const RING_DURATION = 300;

/** 中心数字滚动：与圆环同步的 easeOutCubic 补间；减弱动效瞬时（手法对齐 ledger RollingNumber） */
function useTweenedPercent(target: number, reducedMotion: boolean): number {
  const [display, setDisplay] = useState(target);
  const previous = useRef(target);
  useEffect(() => {
    const from = previous.current;
    previous.current = target;
    if (reducedMotion || from === target) {
      setDisplay(target);
      return;
    }
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - startedAt) / RING_DURATION);
      setDisplay(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reducedMotion]);
  return display;
}

/** 进度环：percent 变化时 dashoffset 平滑过渡（约 300ms），中心 % 数字同步滚动；减弱动效瞬变 */
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
  const display = useTweenedPercent(target, reducedMotion);
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
      <TripText size={compact ? 17 : 22} numbers style={{ color: theme.primary }}>{display}%</TripText>
    </View>
  );
}
