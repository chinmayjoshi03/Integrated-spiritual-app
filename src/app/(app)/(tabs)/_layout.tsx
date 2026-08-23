import { Tabs } from 'expo-router';

import { AppIcon } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';

const tabs = [
  ['index', 'Home', 'home'], ['practice', 'Practice', 'practice'], ['learn', 'Learn', 'learn'], ['connect', 'Connect', 'connect'], ['profile', 'Profile', 'profile'],
] as const;

export default function TabLayout() {
  return <Tabs screenOptions={({ route }) => {
    const item = tabs.find(([name]) => name === route.name) || tabs[0];
    return {
      headerShown: false,
      tabBarLabel: item[1],
      tabBarIcon: ({ focused }) => <AppIcon name={item[2]} active={focused} />,
      tabBarActiveTintColor: Palette.goldDark,
      tabBarInactiveTintColor: Palette.stoneLight,
      tabBarStyle: { height: 82, paddingTop: 8, paddingBottom: 13, borderTopColor: Palette.line, backgroundColor: Palette.surface },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
    };
  }}>
    {tabs.map(([name]) => <Tabs.Screen key={name} name={name} />)}
  </Tabs>;
}
