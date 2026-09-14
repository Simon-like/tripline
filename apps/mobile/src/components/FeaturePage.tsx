import { View } from 'react-native';
import { Icon, type IconName } from '@tripline/ui';
import { Page } from './Page';
import { TripText } from './TripText';
import { useTriplineTheme } from '../theme';

type Props = { icon: IconName; title: string; subtitle: string; cardTitle: string; cardBody: string; accent: 'primary' | 'accent' | 'celebrate' | 'success' };

export function FeaturePage({ icon, title, subtitle, cardTitle, cardBody, accent }: Props) {
  const { theme } = useTriplineTheme();
  return (
    <Page tabbed>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 58, height: 58, borderRadius: 21, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={30} color={theme[accent]} />
        </View>
        <View style={{ flex: 1 }}>
          <TripText size={29} weight="bold">{title}</TripText>
          <TripText size={13} muted>{subtitle}</TripText>
        </View>
      </View>
      <View style={{ backgroundColor: theme.surface, borderRadius: 28, padding: 24, minHeight: 196, justifyContent: 'space-between', borderWidth: 1, borderColor: theme.border }}>
        <View style={{ width: 42, height: 8, borderRadius: 4, backgroundColor: theme[accent] }} />
        <View style={{ gap: 8 }}>
          <TripText size={22} weight="bold">{cardTitle}</TripText>
          <TripText size={15} muted>{cardBody}</TripText>
        </View>
      </View>
      <TripText size={13} muted style={{ textAlign: 'center' }}>旅程数据与互动功能会在下一阶段逐步开启</TripText>
    </Page>
  );
}
