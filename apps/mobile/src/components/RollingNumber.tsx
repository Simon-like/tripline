import { useEffect, useRef, useState } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { easeOutCubic, tweenValue } from './rollingNumberMath';
import { TripText } from './TripText';

type Props = {
  /** 目标值；变化时从上一值滚动过来 */
  value: number;
  /** 滚动时长 ms，默认 600；ProgressRing 传更短值与圆环同步 */
  duration?: number;
  /** 帧显示值 → 文案（如分 → ¥、拼接 %、千分位），默认取整字符串 */
  format?: (display: number) => string;
  size?: number;
  weight?: 'regular' | 'semibold' | 'bold';
  muted?: boolean;
  style?: StyleProp<TextStyle>;
};

/** 数字滚动：value 变化时 rAF easeOutCubic 滚到新值；系统「减弱动态效果」下瞬变 */
export function RollingNumber({ value, duration = 600, format = String, size = 16, weight = 'regular', muted, style }: Props) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (reduceMotion || from === value) { setDisplay(value); return; }
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - startedAt) / duration);
      setDisplay(tweenValue(from, value, easeOutCubic(p)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduceMotion]);
  return <TripText size={size} weight={weight} muted={muted} numbers style={style}>{format(display)}</TripText>;
}
