import type { PropsWithChildren } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { chineseFont, numberFont, useTriplineTheme } from '../theme';

type Props = PropsWithChildren<TextProps & {
  size?: number;
  weight?: 'regular' | 'semibold' | 'bold';
  muted?: boolean;
  numbers?: boolean;
}>;

export function TripText({ children, size = 16, weight = 'regular', muted, numbers, style, ...rest }: Props) {
  const { theme } = useTriplineTheme();
  const textStyle: TextStyle = {
    color: muted ? theme.textSecondary : theme.text,
    fontFamily: numbers ? numberFont : chineseFont,
    fontWeight: numbers ? undefined : weight === 'bold' ? '700' : weight === 'semibold' ? '600' : '400',
    fontSize: size,
    lineHeight: Math.round(size * 1.42),
    fontStyle: 'normal',
  };
  return <Text {...rest} style={[textStyle, style]}>{children}</Text>;
}
