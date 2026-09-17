import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Keyboard, Modal, Pressable, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useTriplineTheme } from '../theme';
import { shouldDismissSheet } from './sheetGesture';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  backgroundColor?: string;
  maxHeight?: `${number}%`;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function BottomSheet({ visible, onClose, children, backgroundColor, maxHeight = '86%', style, accessibilityLabel = '关闭卡片' }: Props) {
  const { theme } = useTriplineTheme();
  const reducedMotion = useReducedMotion();
  const [presented, setPresented] = useState(visible);
  const height = useRef(800);
  const closing = useRef(false);
  const backdrop = useSharedValue(0);
  const offset = useSharedValue(800);
  const measuredHeight = useSharedValue(800);

  useEffect(() => {
    if (visible) {
      if (!presented) setPresented(true);
    } else if (presented && !closing.current) {
      closing.current = true;
      if (reducedMotion) setPresented(false);
      else {
        backdrop.value = withTiming(0, { duration: 210 });
        offset.value = withTiming(height.current, { duration: 230 }, (finished) => {
          if (finished) runOnJS(setPresented)(false);
        });
      }
    }
  }, [visible, presented, reducedMotion, backdrop, offset]);

  function enter() {
    closing.current = false;
    backdrop.value = reducedMotion ? 1 : withTiming(1, { duration: 180 });
    offset.value = reducedMotion ? 0 : withSpring(0, { duration: 330, dampingRatio: 0.88 });
  }

  function finishClose() {
    setPresented(false);
    onClose();
  }

  function dismiss() {
    if (closing.current) return;
    closing.current = true;
    Keyboard.dismiss();
    if (reducedMotion) {
      finishClose();
      return;
    }
    backdrop.value = withTiming(0, { duration: 210 });
    offset.value = withTiming(height.current, { duration: 230 }, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  }

  const drag = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onUpdate((event) => {
      offset.value = Math.max(0, event.translationY);
      backdrop.value = Math.max(0.15, 1 - offset.value / Math.max(measuredHeight.value, 1));
    })
    .onEnd((event) => {
      if (shouldDismissSheet(event.translationY, event.velocityY)) {
        runOnJS(dismiss)();
      } else {
        offset.value = reducedMotion ? 0 : withSpring(0, { duration: 260, dampingRatio: 0.86 });
        backdrop.value = reducedMotion ? 1 : withTiming(1, { duration: 180 });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value * 0.45 }));
  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  return (
    <Modal visible={presented} transparent animationType="none" onShow={enter} onRequestClose={dismiss}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[{ position: 'absolute', inset: 0, backgroundColor: theme.shadow }, backdropStyle]}>
          <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={{ flex: 1 }} />
        </Animated.View>
        <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
          <Animated.View onLayout={(event) => { height.current = event.nativeEvent.layout.height; measuredHeight.value = height.current; }} style={[{
            backgroundColor: backgroundColor ?? theme.surface,
            borderTopLeftRadius: 32, borderTopRightRadius: 32,
            maxHeight, width: '100%', maxWidth: 560, alignSelf: 'center', overflow: 'hidden',
          }, panelStyle, style]}>
            <GestureDetector gesture={drag}>
              <View accessible accessibilityRole="button" accessibilityLabel="向下拖动关闭卡片" style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 48, height: 5, borderRadius: 9, backgroundColor: theme.border }} />
              </View>
            </GestureDetector>
            {children}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
