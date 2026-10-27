import React from 'react';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import {
  Home,
  Dumbbell,
  Wrench,
  User,
} from 'lucide-react-native';

export default function AppTabs() {
  const pathname = usePathname();
  const hideTabBar = pathname?.includes('/workout/player');

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      {!hideTabBar && (
        <TabList asChild>
          <CustomTabList>
            <TabTrigger name="home" href="/" asChild>
              <TabButton icon={Home} label="Home" />
            </TabTrigger>
            <TabTrigger name="library" href="/library" asChild>
              <TabButton icon={Dumbbell} label="Library" />
            </TabTrigger>
            <TabTrigger name="garage" href="/garage" asChild>
              <TabButton icon={Wrench} label="Garage" />
            </TabTrigger>
            <TabTrigger name="profile" href="/profile" asChild>
              <TabButton icon={User} label="Profile" />
            </TabTrigger>
          </CustomTabList>
        </TabList>
      )}
    </Tabs>
  );
}

interface TabButtonProps extends TabTriggerSlotProps {
  icon: any;
  label: string;
}

export function TabButton({ icon: Icon, label, isFocused, ...props }: TabButtonProps) {
  const activeColor = '#38BDF8';
  const inactiveColor = '#64748B';

  return (
    <Pressable
      {...(props as any)}
      style={({ pressed }) => [styles.tabButton, pressed && styles.tabButtonPressed]}>
      <View style={[styles.tabContent, isFocused && styles.tabContentActive]}>
        <View style={styles.iconWrapper}>
          <Icon
            size={20}
            color={isFocused ? activeColor : inactiveColor}
            strokeWidth={isFocused ? 2.5 : 1.8}
          />
          {isFocused && <View style={styles.activeGlowIndicator} />}
        </View>
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.tabListContainer, { bottom: bottomInset }]}>
      <View {...props} style={styles.floatingDock} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  floatingDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F131D',
    borderRadius: 36,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#222A3B',
    borderTopColor: '#2D384F',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 18,
      },
      android: {
        elevation: 14,
      },
      web: {
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.55), 0 0 1px rgba(255, 255, 255, 0.1)',
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.94 }],
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 3,
    minWidth: 64,
  },
  tabContentActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.14)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeGlowIndicator: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
    ...Platform.select({
      ios: {
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      web: {
        boxShadow: '0 0 8px #38BDF8',
      },
    }),
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
});
