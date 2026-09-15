import { useState } from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';
import { resolvePhotoUri } from '../data/photos';
import { useTriplineTheme } from '../theme';
import { TripText } from './TripText';

/** Error state belongs to each URI; a changed photo starts a fresh load. */
export function JournalPhoto({ path, style, full = false }: { path: string; style: StyleProp<ViewStyle>; full?: boolean }) {
  return <Photo key={path} path={path} style={style} full={full} />;
}
function Photo({ path, style, full }: { path: string; style: StyleProp<ViewStyle>; full: boolean }) {
  const [failed, setFailed] = useState(false);
  const { theme } = useTriplineTheme();
  return <View style={[{ backgroundColor: theme.surfaceAlt, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, style]}>
    {failed ? <View style={{ padding: full ? 24 : 4, gap: 8, alignItems: 'center' }}>
      <TripText size={full ? 18 : 10} muted>照片不在本机</TripText>
      {full ? <TripText size={13} muted>文字记录仍在。分享码不会传送原生照片，请向朋友另取原图。</TripText> : null}
    </View> : <Image source={{ uri: resolvePhotoUri(path) }} resizeMode={full ? 'contain' : 'cover'} onError={() => setFailed(true)} style={{ width: '100%', height: '100%' }} />}
  </View>;
}
