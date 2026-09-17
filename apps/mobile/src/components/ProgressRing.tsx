import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { TripText } from './TripText';
import { useTriplineTheme } from '../theme';

export function ProgressRing({ percent, size = 104, compact = false }: { percent: number; size?: number; compact?: boolean }) {
  const { theme } = useTriplineTheme();
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={theme.surfaceAlt} strokeWidth={stroke} />
        <Circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={theme.primary}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - Math.min(100, Math.max(0, percent)) / 100)}
        />
      </Svg>
      <TripText size={compact ? 17 : 22} numbers style={{ color: theme.primary }}>{percent}%</TripText>
    </View>
  );
}
