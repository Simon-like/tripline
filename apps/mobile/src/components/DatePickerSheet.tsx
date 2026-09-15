import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, View, type ViewStyle } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  buildMonthGrid,
  isInRange,
  parseDateString,
  resolveRangeSelection,
  shiftMonth,
  toLocalDateString,
} from '@tripline/shared';
import { Icon, motion } from '@tripline/ui';
import { BouncyButton } from './BouncyButton';
import { TripText } from './TripText';
import { useTriplineTheme } from '../theme';

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const;
// 入场：backdrop 淡入先行，面板延迟 ~60ms 弹簧上浮（dampingRatio 0.65 ≈ stiffness 300 / damping 20 的轻过冲）
const ENTER_STAGGER = 60;
const ENTER_DURATION = 320;
const ENTER_DAMPING = 0.65;
// 关闭：下滑 + 淡出
const EXIT_DURATION = 240;
// 切月：横向轻滑 + 淡入
const MONTH_SHIFT = 24;
const MONTH_DURATION = 180;
// 选中日胶囊弹性反馈（≤120ms）
const SELECT_DAMPING = 0.55;

export type DatePickerSheetProps = {
  visible: boolean;
  mode: 'single' | 'range';
  /** 初始起点（YYYY-MM-DD），无则为 null */
  initialStart?: string | null;
  /** 初始终点（range 模式），无则为 null */
  initialEnd?: string | null;
  title?: string;
  onClose: () => void;
  /** range: end 一定 >= start；single: end 与 start 相同 */
  onConfirm: (start: string, end: string) => void;
};

/** 选中日胶囊：选中瞬间压缩后弹回，120ms 内的 Q 弹反馈 */
function BounceCapsule({ selected, reducedMotion, style, children }: {
  selected: boolean;
  reducedMotion: boolean;
  style: ViewStyle;
  children: ReactNode;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      return;
    }
    if (selected) {
      scale.value = 0.8;
      scale.value = withSpring(1, { duration: motion.instant, dampingRatio: SELECT_DAMPING });
    }
  }, [selected, reducedMotion, scale]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

export function DatePickerSheet({
  visible, mode, initialStart = null, initialEnd = null, title, onClose, onConfirm,
}: DatePickerSheetProps) {
  const { theme } = useTriplineTheme();
  const reducedMotion = useReducedMotion();
  const today = toLocalDateString(new Date());

  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(1);

  // 动效 shared values：backdrop / 面板 / 网格 三组独立控制
  const backdrop = useSharedValue(0);
  const sheetY = useSharedValue(72);
  const sheetScale = useSharedValue(0.97);
  const gridX = useSharedValue(0);
  const gridOpacity = useSharedValue(1);
  const closingRef = useRef(false);
  const afterCloseRef = useRef<(() => void) | null>(null);

  // 入场：backdrop 淡入，面板错开 60ms 上滑 + 轻微过冲；减弱动效时全部瞬时到位
  useEffect(() => {
    if (!visible) return;
    closingRef.current = false;
    afterCloseRef.current = null;
    gridX.value = 0;
    gridOpacity.value = 1;
    if (reducedMotion) {
      backdrop.value = 1;
      sheetY.value = 0;
      sheetScale.value = 1;
      return;
    }
    backdrop.value = 0;
    sheetY.value = 72;
    sheetScale.value = 0.97;
    backdrop.value = withTiming(1, { duration: 200 });
    sheetY.value = withDelay(ENTER_STAGGER, withSpring(0, { duration: ENTER_DURATION, dampingRatio: ENTER_DAMPING }));
    sheetScale.value = withDelay(ENTER_STAGGER, withSpring(1, { duration: ENTER_DURATION, dampingRatio: ENTER_DAMPING }));
  }, [visible, reducedMotion, backdrop, sheetY, sheetScale, gridX, gridOpacity]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value * 0.45 }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }, { scale: sheetScale.value }],
  }));
  const gridStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: gridX.value }],
    opacity: gridOpacity.value,
  }));

  // 每次打开时重置选中态与视图月
  useEffect(() => {
    if (!visible) return;
    const nextStart = initialStart;
    const nextEnd = mode === 'range' ? initialEnd : initialStart;
    setStart(nextStart);
    setEnd(nextEnd);
    const anchor = parseDateString(nextStart ?? '') ?? new Date();
    setViewYear(anchor.getFullYear());
    setViewMonth(anchor.getMonth() + 1);
  }, [visible, initialStart, initialEnd, mode]);

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth, 1), [viewYear, viewMonth]);
  const canConfirm = mode === 'single' ? start !== null : start !== null && end !== null;

  // 关闭：下滑 + 淡出播完后再回调父组件（confirm 时也走同一条路径）
  function finishClose() {
    closingRef.current = false;
    const after = afterCloseRef.current;
    afterCloseRef.current = null;
    if (after) after();
    else onClose();
  }

  function dismiss(after?: () => void) {
    if (reducedMotion) {
      if (after) after();
      else onClose();
      return;
    }
    if (closingRef.current) return;
    closingRef.current = true;
    afterCloseRef.current = after ?? null;
    sheetY.value = withTiming(360, { duration: EXIT_DURATION });
    sheetScale.value = withTiming(0.98, { duration: EXIT_DURATION });
    backdrop.value = withTiming(0, { duration: EXIT_DURATION - 40 }, (finished) => {
      'worklet';
      if (finished) runOnJS(finishClose)();
    });
  }

  // 切月：新网格从切月方向横滑淡入（下一月从右 +24px，上一月从左 -24px）
  function changeMonth(offset: number) {
    const next = shiftMonth(viewYear, viewMonth, offset);
    setViewYear(next.year);
    setViewMonth(next.month);
    if (reducedMotion) return;
    gridX.value = offset * MONTH_SHIFT;
    gridOpacity.value = 0;
    gridX.value = withTiming(0, { duration: MONTH_DURATION });
    gridOpacity.value = withTiming(1, { duration: MONTH_DURATION });
  }

  function tapDay(date: string) {
    if (mode === 'single') {
      setStart(date);
      setEnd(date);
      return;
    }
    const next = resolveRangeSelection(start, end, date);
    setStart(next.start);
    setEnd(next.end);
  }

  function confirm() {
    if (!start || !canConfirm) return;
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    dismiss(() => onConfirm(start, end ?? start));
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => dismiss()}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.shadow }, backdropStyle]}>
          <Pressable onPress={() => dismiss()} style={{ flex: 1 }} accessibilityLabel="关闭日期选择" />
        </Animated.View>
        <Animated.View style={[sheetStyle, {
          backgroundColor: theme.surface,
          borderTopLeftRadius: 32, borderTopRightRadius: 32,
          paddingTop: 16, paddingHorizontal: 24, paddingBottom: 28,
          width: '100%', maxWidth: 560, alignSelf: 'center',
        }]}>
          <View style={{ width: 48, height: 5, borderRadius: 9, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 16 }} />

          {title ? <TripText size={13} weight="semibold" muted style={{ textAlign: 'center', marginBottom: 8 }}>{title}</TripText> : null}

          {/* 月份标题 + 切月 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Pressable onPress={() => changeMonth(-1)} hitSlop={10} accessibilityLabel="上个月" style={{ padding: 6 }}>
              <Icon name="chevron-left" size={22} color={theme.text} />
            </Pressable>
            <TripText size={19} weight="bold">{viewYear} 年 {viewMonth} 月</TripText>
            <Pressable onPress={() => changeMonth(1)} hitSlop={10} accessibilityLabel="下个月" style={{ padding: 6, transform: [{ scaleX: -1 }] }}>
              <Icon name="chevron-left" size={22} color={theme.text} />
            </Pressable>
          </View>

          {/* 周一~周日表头 */}
          <View style={{ flexDirection: 'row', marginBottom: 6 }}>
            {WEEK_LABELS.map((label) => (
              <View key={label} style={{ flex: 1, alignItems: 'center' }}>
                <TripText size={12} weight="semibold" muted>{label}</TripText>
              </View>
            ))}
          </View>

          {/* 6×7 日期网格（切月时整格横滑淡入） */}
          <Animated.View style={gridStyle}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {cells.map((cell) => {
                const day = Number(cell.date.slice(8));
                const isStart = cell.date === start;
                const isEnd = cell.date === end;
                const selected = isStart || isEnd;
                const hasRange = mode === 'range' && start !== null && end !== null && start !== end;
                const inRange = hasRange && isInRange(cell.date, start, end) && !selected;
                const isToday = cell.date === today;
                // 范围淡色带：端点向外半格、中间格全宽，视觉上连成一条带
                const bandLeft = hasRange && (inRange || (isEnd && start !== cell.date));
                const bandRight = hasRange && (inRange || (isStart && end !== cell.date));
                return (
                  <Pressable
                    key={cell.date}
                    onPress={() => tapDay(cell.date)}
                    accessibilityLabel={`${cell.date}${isToday ? '，今天' : ''}`}
                    style={{ width: `${100 / 7}%`, height: 42, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {bandLeft || bandRight ? (
                      <View style={{ position: 'absolute', left: 0, right: 0, top: 2, bottom: 2, flexDirection: 'row' }}>
                        <View style={{ flex: 1, backgroundColor: bandLeft ? theme.primarySoft : 'transparent' }} />
                        <View style={{ flex: 1, backgroundColor: bandRight ? theme.primarySoft : 'transparent' }} />
                      </View>
                    ) : null}
                    <BounceCapsule
                      selected={selected}
                      reducedMotion={reducedMotion}
                      style={{
                        width: 38, height: 38, borderRadius: 999,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: selected ? theme.primary : 'transparent',
                        borderWidth: isToday && !selected ? 1.5 : 0,
                        borderColor: theme.primary,
                      }}
                    >
                      <TripText
                        size={15}
                        weight={selected ? 'bold' : 'regular'}
                        muted={!cell.inMonth && !selected}
                        style={selected ? { color: theme.onPrimary } : undefined}
                      >{day}</TripText>
                    </BounceCapsule>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* 选中摘要 */}
          <TripText size={13} muted style={{ textAlign: 'center', marginTop: 12 }}>
            {start
              ? end && end !== start
                ? `${start} 出发 → ${end} 返程`
                : mode === 'range'
                  ? `${start} 出发，再点返程日期`
                  : `已选 ${start}`
              : mode === 'range' ? '先点出发日期，再点返程日期' : '点选一个日期'}
          </TripText>

          {/* 确认 / 取消 */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
            <View style={{ flex: 1 }}>
              <BouncyButton onPress={() => dismiss()} style={{ backgroundColor: theme.surfaceAlt, paddingVertical: 13, borderRadius: 999, alignItems: 'center' }}>
                <TripText size={15} weight="semibold">取消</TripText>
              </BouncyButton>
            </View>
            <View style={{ flex: 1 }}>
              <BouncyButton onPress={confirm} disabled={!canConfirm} style={{ backgroundColor: theme.accent, opacity: canConfirm ? 1 : 0.45, paddingVertical: 13, borderRadius: 999, alignItems: 'center' }}>
                <TripText size={15} weight="bold" style={{ color: theme.onAccent }}>确定</TripText>
              </BouncyButton>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** 供表单展示的格式化：YYYY-MM-DD → YYYY年M月D日 */
export function formatDateLabel(date: string): string {
  const parsed = parseDateString(date);
  if (!parsed) return date;
  return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月${parsed.getDate()}日`;
}
