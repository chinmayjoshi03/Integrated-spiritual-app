import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { BrandFonts, Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// [route name, label, icon, active icon]
const TABS: [string, string, IconName, IconName][] = [
  ['index', 'Home', 'home-outline', 'home'],
  ['learn', 'Learn', 'book-outline', 'book'],
  ['connect', 'Connect', 'people-outline', 'people'],
  ['give', 'Give', 'heart-outline', 'heart'],
  ['account', 'Account', 'person-circle-outline', 'person-circle'],
];

export default function TabLayout() {
  const { user } = useSession();

  // Same rule as the website: phone number and date of birth are required before using the app.
  if (user && user.profileComplete === false) return <Redirect href={'/edit-profile?required=1' as any} />;

  return (
    <Tabs
      screenOptions={({ route }) => {
        const tab = TABS.find(([name]) => name === route.name) ?? TABS[0];
        return {
          headerShown: false,
          tabBarLabel: tab[1],
          tabBarIcon: ({ focused }) => <Ionicons name={focused ? tab[3] : tab[2]} size={24} color={focused ? Palette.goldDark : Palette.stoneLight} />,
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
          tabBarLabelStyle: { fontFamily: BrandFonts.bodySemi, fontSize: 11, marginTop: 2 },
        };
      }}
    >
      {TABS.map(([name]) => <Tabs.Screen key={name} name={name} />)}
    </Tabs>
  );
}
