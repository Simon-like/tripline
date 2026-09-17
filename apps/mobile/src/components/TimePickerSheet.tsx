import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { BouncyButton } from './BouncyButton';
import { BottomSheet } from './BottomSheet';
import { TripText } from './TripText';
import { useTriplineTheme } from '../theme';

const hours = Array.from({ length: 24 }, (_, index) => index);
const minutes = Array.from({ length: 60 }, (_, index) => index);
const pad = (value: number) => String(value).padStart(2, '0');

export function TimePickerSheet({ visible, value, onClose, onConfirm }: {
  visible: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (time: string) => void;
}) {
  const { theme } = useTriplineTheme();
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(30);
  const hourList = useRef<ScrollView>(null);
  const minuteList = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    const nextHour = match ? Math.min(23, Number(match[1])) : 9;
    const nextMinute = match ? Math.min(59, Number(match[2])) : 30;
    setHour(nextHour);
    setMinute(nextMinute);
    const timer = setTimeout(() => {
      hourList.current?.scrollTo({ y: Math.max(0, nextHour - 2) * 44, animated: false });
      minuteList.current?.scrollTo({ y: Math.max(0, nextMinute - 2) * 44, animated: false });
    }, 80);
    return () => clearTimeout(timer);
  }, [visible, value]);

  function column(values: number[], selected: number, select: (value: number) => void, label: string, ref: React.RefObject<ScrollView | null>) {
    return (
      <View style={{ flex: 1, gap: 8 }}>
        <TripText size={13} weight="semibold" muted style={{ textAlign: 'center' }}>{label}</TripText>
        <ScrollView ref={ref} style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false} accessibilityLabel={`${label}选择`}>
          {values.map((number) => (
            <Pressable key={number} onPress={() => select(number)} accessibilityRole="button" accessibilityState={{ selected: number === selected }}
              accessibilityLabel={`${pad(number)}${label}`} style={{ height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: number === selected ? theme.primarySoft : 'transparent' }}>
              <TripText size={20} numbers weight={number === selected ? 'bold' : 'regular'} style={{ color: number === selected ? theme.primary : theme.text }}>{pad(number)}</TripText>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} backgroundColor={theme.surface} maxHeight="65%" accessibilityLabel="关闭时间选择">
      <View style={{ paddingHorizontal: 24, paddingBottom: 32, gap: 18 }}>
        <TripText size={23} weight="bold">选择安排时间</TripText>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          {column(hours, hour, setHour, '时', hourList)}
          {column(minutes, minute, setMinute, '分', minuteList)}
        </View>
        <BouncyButton onPress={() => onConfirm(`${pad(hour)}:${pad(minute)}`)} style={{ backgroundColor: theme.accent, paddingVertical: 15, borderRadius: 999, alignItems: 'center' }}>
          <TripText size={16} weight="bold" style={{ color: theme.onAccent }}>确定 {pad(hour)}:{pad(minute)}</TripText>
        </BouncyButton>
      </View>
    </BottomSheet>
  );
}
