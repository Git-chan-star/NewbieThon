import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/theme';

function Icon({ value, focused }: { value: string; focused: boolean }) {
  return <Text style={{ fontSize: 19, opacity: focused ? 1 : 0.45 }}>{value}</Text>;
}

export default function EmployerTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textTertiary, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border } }}>
      <Tabs.Screen name="index" options={{ title: '홈', tabBarIcon: ({ focused }) => <Icon value="🏠" focused={focused} /> }} />
      <Tabs.Screen name="jobs" options={{ title: '공고', tabBarIcon: ({ focused }) => <Icon value="📣" focused={focused} /> }} />
      <Tabs.Screen name="students" options={{ title: '학생 찾기', tabBarIcon: ({ focused }) => <Icon value="🎓" focused={focused} /> }} />
      <Tabs.Screen name="messages" options={{ title: '메시지', tabBarIcon: ({ focused }) => <Icon value="💬" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: '내 정보', tabBarIcon: ({ focused }) => <Icon value="👤" focused={focused} /> }} />
    </Tabs>
  );
}
