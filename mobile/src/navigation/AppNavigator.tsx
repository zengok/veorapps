import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SaleScreen from '../screens/SaleScreen';
import OrderScreen from '../screens/OrderScreen';
import StockScreen from '../screens/StockScreen';
import NotificationScreen from '../screens/NotificationScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const C = {
  black: '#1a1a1a',
  gold: '#c9a961',
  gray: '#666666',
  tabBorder: '#2a2a2a',
  badge: '#e05555',
  badgeText: '#ffffff',
};

function NotificationBell({ onPress }: { onPress: () => void }) {
  const { unreadCount } = useNotifications();
  return (
    <TouchableOpacity style={styles.bell} activeOpacity={0.7} onPress={onPress}>
      <Ionicons name="notifications-outline" size={22} color={C.gold} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : String(unreadCount)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const tabScreenOptions = (navigation: any) => ({
  headerStyle: { backgroundColor: C.black, elevation: 0, shadowOpacity: 0 },
  headerTintColor: C.gold,
  headerTitleStyle: { fontWeight: '700' as const, letterSpacing: 1, fontSize: 15 },
  headerRight: () => <NotificationBell onPress={() => navigation.navigate('Notifications')} />,
  tabBarStyle: {
    backgroundColor: C.black,
    borderTopColor: C.tabBorder,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
  },
  tabBarActiveTintColor: C.gold,
  tabBarInactiveTintColor: C.gray,
  tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const },
});

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={({ navigation }) => tabScreenOptions(navigation)}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Ana Sayfa',
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Sale"
        component={SaleScreen}
        options={{
          title: 'Satış Gir',
          tabBarLabel: 'Satış',
          tabBarIcon: ({ color, size }) => <Ionicons name="cash-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Order"
        component={OrderScreen}
        options={{
          title: 'Siparişler',
          tabBarLabel: 'Sipariş',
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Stock"
        component={StockScreen}
        options={{
          title: 'Stok',
          tabBarLabel: 'Stok',
          tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
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
    backgroundColor: C.badge,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: C.badgeText, fontSize: 9, fontWeight: '700' },
});
