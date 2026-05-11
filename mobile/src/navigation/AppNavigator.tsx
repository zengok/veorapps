import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SaleScreen from '../screens/SaleScreen';
import OrderScreen from '../screens/OrderScreen';
import StockScreen from '../screens/StockScreen';
import NotificationScreen from '../screens/NotificationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { radius, touch, type ThemeColors } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import AppIcon, { type AppIconName } from '../components/AppIcon';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function NotificationBell({ onPress }: { onPress: () => void }) {
  const { unreadCount } = useNotifications();
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={styles.bell}
      activeOpacity={0.7}
      onPress={onPress}
      hitSlop={touch.hitSlop}
      accessibilityRole="button"
      accessibilityLabel="Bildirimleri aç"
    >
      <AppIcon name="bell" size={24} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.red }]}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : String(unreadCount)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const tabScreenOptions = (navigation: any, colors: ThemeColors) => ({
  headerStyle: { backgroundColor: colors.headerBg, elevation: 0, shadowOpacity: 0 },
  headerTintColor: colors.gold,
  headerTitleStyle: { fontWeight: '800' as const, letterSpacing: 0, fontSize: 17, color: colors.ink },
  headerRight: () => <NotificationBell onPress={() => navigation.navigate('Notifications')} />,
  tabBarHideOnKeyboard: true,
  tabBarStyle: {
    backgroundColor: colors.tabBg,
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    minHeight: 66,
    paddingTop: 6,
    paddingBottom: 10,
  },
  tabBarActiveTintColor: colors.gold,
  tabBarInactiveTintColor: colors.inkMuted,
  tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const },
});

const tabIcon = (name: AppIconName) => ({ focused, size }: { focused: boolean; color: string; size: number }) => (
  <AppIcon name={name} size={size + 2} opacity={focused ? 1 : 0.54} />
);

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator screenOptions={({ navigation }) => tabScreenOptions(navigation, colors)}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Ana Sayfa',
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: tabIcon('home'),
        }}
      />
      <Tab.Screen
        name="Sale"
        component={SaleScreen}
        options={{
          title: 'Satış Gir',
          tabBarLabel: 'Satış',
          tabBarIcon: tabIcon('sale'),
        }}
      />
      <Tab.Screen
        name="Order"
        component={OrderScreen}
        options={{
          title: 'Siparişler',
          tabBarLabel: 'Sipariş',
          tabBarIcon: tabIcon('orders'),
        }}
      />
      <Tab.Screen
        name="Stock"
        component={StockScreen}
        options={{
          title: 'Stok',
          tabBarLabel: 'Stok',
          tabBarIcon: tabIcon('stock'),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Ayarlar',
          tabBarLabel: 'Ayarlar',
          tabBarIcon: tabIcon('settings'),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <LoginScreen />;

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  bell: {
    marginRight: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    borderRadius: radius.sm,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#ffffff', fontSize: 9, fontWeight: '700' },
});
