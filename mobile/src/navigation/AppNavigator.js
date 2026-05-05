import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import SalesScreen from '../screens/SalesScreen';
import InventoryScreen from '../screens/InventoryScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator({ setUserToken }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1A1A1A', borderTopColor: '#333' },
        tabBarActiveTintColor: '#D4AF37', // Gold color
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        options={{ tabBarLabel: 'Özet' }}
      >
        {(props) => <DashboardScreen {...props} setUserToken={setUserToken} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Sales" 
        component={SalesScreen} 
        options={{ tabBarLabel: 'Satış Gir' }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen} 
        options={{ tabBarLabel: 'Stok & Katalog' }}
      />
    </Tab.Navigator>
  );
}
