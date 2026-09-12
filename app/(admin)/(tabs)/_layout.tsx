import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/theme';

function Icon({ value, focused }: { value: string; focused: boolean }) {
  return <Text style={{ fontSize: 19, opacity: focused ? 1 : 0.45 }}>{value}</Text>;
}

export default function AdminTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textTertiary, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border } }}>
      <Tabs.Screen name="index" options={{ title: '현황', tabBarIcon: ({ focused }) => <Icon value="📊" focused={focused} /> }} />
      <Tabs.Screen name="users" options={{ title: '회원', tabBarIcon: ({ focused }) => <Icon value="👥" focused={focused} /> }} />
      <Tabs.Screen name="jobs" options={{ title: '공고', tabBarIcon: ({ focused }) => <Icon value="📣" focused={focused} /> }} />
      <Tabs.Screen name="operations" options={{ title: '운영', tabBarIcon: ({ focused }) => <Icon value="🛡️" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: '관리자', tabBarIcon: ({ focused }) => <Icon value="⚙️" focused={focused} /> }} />
    </Tabs>
  );
}
