import { Ionicons } from '@expo/vector-icons';
import { PropsWithChildren, ReactNode, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ui/themed-text';
import { AppPalette, MaxContentWidth, Spacing } from '@/theme/theme';
import { useColors } from '@/theme/theme-provider';

type AppScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  onBack?: () => void;
  showBrand?: boolean;
  stickyHeader?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function AppScreen({
  title,
  subtitle,
  headerRight,
  onBack,
  showBrand = true,
  stickyHeader = true,
  refreshing = false,
  onRefresh,
  children,
}: AppScreenProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const header = (
    <View style={styles.header}>
      <View style={styles.heading}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={onBack}
            style={({ pressed }) => pressed && styles.backButtonPressed}>
            <Ionicons name="chevron-back" size={26} color={colors.glassText} />
          </Pressable>
        ) : null}
        <View style={styles.headingCopy}>
          <ThemedText type="title" style={styles.title}>
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText type="small" style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </View>
      {headerRight}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {stickyHeader ? (
        <View style={styles.headerBar}>
          <View style={styles.headerInner}>{header}</View>
        </View>
      ) : null}

      <ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primaryTeal}
              colors={[colors.primaryTeal]}
            />
          ) : undefined
        }
        contentContainerStyle={styles.content}>
        <View style={styles.container}>
          {!stickyHeader ? header : null}
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: AppPalette) {
  return StyleSheet.create({
    screen: {
      backgroundColor: c.screenBg,
      flex: 1,
    },
    headerBar: {
      backgroundColor: c.screenBg,
      borderBottomColor: c.surfaceGlassBorder,
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingBottom: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    headerInner: {
      alignSelf: 'center',
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    scroll: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingBottom: Spacing.six,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.four,
    },
    container: {
      alignSelf: 'center',
      flex: 1,
      gap: Spacing.four,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    header: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.three,
      justifyContent: 'space-between',
    },
    heading: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: Spacing.two,
      minWidth: 200,
    },
    backButtonPressed: {
      opacity: 0.5,
    },
    headingCopy: {
      flex: 1,
      gap: Spacing.one,
      minWidth: 0,
    },
    title: {
      color: c.glassText,
      fontSize: 26,
      fontWeight: '700',
      lineHeight: 32,
    },
    subtitle: {
      color: c.glassMuted,
    },
  });
}
