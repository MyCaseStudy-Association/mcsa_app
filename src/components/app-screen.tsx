import { PropsWithChildren, ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand/brand-mark';
import { ThemedText } from '@/components/themed-text';
import { AppColors, MaxContentWidth, Spacing } from '@/constants/theme';

type AppScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  showBrand?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function AppScreen({
  title,
  subtitle,
  headerRight,
  showBrand = true,
  refreshing = false,
  onRefresh,
  children,
}: AppScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={AppColors.primaryTeal}
              colors={[AppColors.primaryTeal]}
            />
          ) : undefined
        }
        contentContainerStyle={styles.content}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.heading}>
              {showBrand ? <BrandMark size={40} /> : null}
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

          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: AppColors.authBg,
    flex: 1,
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
  headingCopy: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 0,
  },
  title: {
    color: AppColors.glassText,
    fontSize: 34,
    lineHeight: 40,
  },
  subtitle: {
    color: AppColors.glassMuted,
  },
});
