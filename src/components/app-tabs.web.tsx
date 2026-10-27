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
        <Icon
          size={19}
          color={isFocused ? activeColor : inactiveColor}
          strokeWidth={isFocused ? 2.5 : 1.8}
        />
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 12;

  return (
    <View style={[styles.tabListContainer, { bottom: bottomInset }]}>
      <View {...props} style={styles.floatingDock} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  floatingDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#12151E',
    borderRadius: 32,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#232938',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 3,
  },
  tabContentActive: {
    backgroundColor: '#1B2333',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#F9FAFB',
    fontWeight: '800',
  },
});
