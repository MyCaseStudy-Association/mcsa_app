import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppPalette } from '@/theme/theme';
import { useAppTheme } from '@/theme/theme-provider';

type SmoothModalProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  placement?: 'bottom' | 'center' | 'full';
  contentStyle?: StyleProp<ViewStyle>;
  keyboardAvoiding?: boolean;
}>;

const EXIT_DURATION = 180;

export function SmoothModal({
  visible,
  onClose,
  placement = 'bottom',
  contentStyle,
  keyboardAvoiding = false,
  children,
}: SmoothModalProps) {
  const { colors, scheme } = useAppTheme();
  const themedStyles = useMemo(() => createThemedStyles(colors, scheme), [colors, scheme]);
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }

    if (mounted) {
      progress.value = withTiming(
        0,
        {
          duration: EXIT_DURATION,
          easing: Easing.in(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        },
        (finished) => {
          if (finished) {
            runOnJS(setMounted)(false);
          }
        },
      );
    }
  }, [mounted, progress, visible]);

  useEffect(() => {
    if (mounted && visible) {
      progress.value = 0;
      progress.value = withSpring(1, {
        damping: 22,
        stiffness: 260,
        mass: 0.72,
        overshootClamping: false,
        reduceMotion: ReduceMotion.System,
      });
    }
  }, [mounted, progress, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const contentAnimationStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0.85, 1]),
    transform:
      placement === 'bottom'
        ? [{ translateY: interpolate(progress.value, [0, 1], [72, 0]) }]
        : placement === 'center'
          ? [
            { translateY: interpolate(progress.value, [0, 1], [14, 0]) },
            { scale: interpolate(progress.value, [0, 1], [0.94, 1]) },
            ]
          : [{ translateY: interpolate(progress.value, [0, 1], [32, 0]) }],
  }));

  const modalContent = (
    <View
      accessibilityViewIsModal
      style={[
        styles.root,
        placement === 'bottom' ? styles.bottom : placement === 'center' ? styles.center : null,
      ]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.backdrop, themedStyles.backdrop, backdropStyle]}
      />
      <Pressable
        accessibilityLabel="Close modal"
        accessibilityRole="button"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          styles.content,
          placement === 'bottom'
            ? [styles.bottomContent, themedStyles.bottomContent]
            : placement === 'center'
              ? [styles.centerContent, themedStyles.centerContent]
              : [styles.fullContent, themedStyles.fullContent],
          contentAnimationStyle,
          contentStyle,
        ]}>
        {children}
      </Animated.View>
    </View>
  );

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={mounted}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}>
          {modalContent}
        </KeyboardAvoidingView>
      ) : (
        modalContent
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  bottom: {
    justifyContent: 'flex-end',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    zIndex: 1,
  },
  bottomContent: {
    width: '100%',
  },
  centerContent: {
    maxWidth: 380,
    width: '100%',
  },
  fullContent: {
    flex: 1,
    width: '100%',
  },
});

function createThemedStyles(c: AppPalette, scheme: 'light' | 'dark') {
  return StyleSheet.create({
    backdrop: {
      backgroundColor:
        scheme === 'dark' ? 'rgba(0, 8, 7, 0.76)' : 'rgba(6, 40, 36, 0.48)',
    },
    bottomContent: {
      backgroundColor: c.modalSurface,
      boxShadow:
        scheme === 'dark'
          ? '0 -16px 44px rgba(0, 0, 0, 0.58)'
          : '0 -12px 36px rgba(7, 58, 53, 0.18)',
    },
    centerContent: {
      backgroundColor: c.modalSurface,
      borderColor: c.modalBorder,
      borderWidth: 1,
      boxShadow:
        scheme === 'dark'
          ? '0 18px 52px rgba(0, 0, 0, 0.62)'
          : '0 16px 42px rgba(7, 58, 53, 0.20)',
    },
    fullContent: {
      backgroundColor: c.screenBg,
    },
  });
}
