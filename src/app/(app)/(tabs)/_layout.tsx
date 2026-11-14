import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { AppIcon } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';

// [route name, label, AppIcon name]
const TABS = [
  ['index',   'Home',    'home'],
  ['learn',   'Learn',   'learn'],
  ['connect', 'Connect', 'connect'],
  ['give',    'Give',    'give'],
  ['account', 'Account', 'account'],
] as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const tab = TABS.find(([name]) => name === route.name) ?? TABS[0];
        return {
          headerShown: false,
          tabBarLabel: tab[1],
          tabBarIcon: ({ focused, color }) => (
            <AppIcon name={tab[2]} active={focused} size={24} />
          ),
          tabBarActiveTintColor: Palette.goldDark,
          tabBarInactiveTintColor: Palette.stoneLight,
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 88 : 68,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 24 : 10,
            borderTopWidth: 1,
            borderTopColor: Palette.line,
            backgroundColor: Palette.surface,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
        };
      }}
    >
      {TABS.map(([name]) => (
        <Tabs.Screen key={name} name={name} />
      ))}
    </Tabs>
  );
}
