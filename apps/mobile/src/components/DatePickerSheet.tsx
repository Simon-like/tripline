import { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
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
const ENTER_DURATION = 300;

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

  // 弹层入场弹簧（≤300ms，只动 transform/opacity；减弱动效时瞬时到位）
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) {
      translateY.value = 0;
      opacity.value = 1;
      return;
    }
    translateY.value = withSpring(0, { duration: ENTER_DURATION, dampingRatio: motion.dampingRatio });
    opacity.value = withSpring(1, { duration: ENTER_DURATION, dampingRatio: 1 });
  }, [reducedMotion, translateY, opacity]);
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
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

  function changeMonth(offset: number) {
    const next = shiftMonth(viewYear, viewMonth, offset);
    setViewYear(next.year);
    setViewMonth(next.month);
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
    onConfirm(start, end ?? start);
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.shadow, opacity: 0.45 }} />
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

          {/* 6×7 日期网格 */}
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
                  <View style={{
                    width: 38, height: 38, borderRadius: 999,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: selected ? theme.primary : 'transparent',
                    borderWidth: isToday && !selected ? 1.5 : 0,
                    borderColor: theme.primary,
                  }}>
                    <TripText
                      size={15}
                      weight={selected ? 'bold' : 'regular'}
                      muted={!cell.inMonth && !selected}
                      style={selected ? { color: theme.onPrimary } : undefined}
                    >{day}</TripText>
                  </View>
                </Pressable>
              );
            })}
          </View>

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
              <BouncyButton onPress={onClose} style={{ backgroundColor: theme.surfaceAlt, paddingVertical: 13, borderRadius: 999, alignItems: 'center' }}>
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
