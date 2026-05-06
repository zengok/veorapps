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
        tabBarStyle: { 
          backgroundColor: 'rgba(35, 31, 23, 0.95)', 
          borderTopColor: '#4d4635',
          borderTopWidth: 1,
          elevation: 0, // for Android
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: '#f2ca50', // Primary gold
        tabBarInactiveTintColor: '#99907c', // Outline
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        options={{ tabBarLabel: 'Atelier' }}
      >
        {(props) => <DashboardScreen {...props} setUserToken={setUserToken} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Sales" 
        component={SalesScreen} 
        options={{ tabBarLabel: 'Vault' }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen} 
        options={{ tabBarLabel: 'Stock' }}
      />
    </Tab.Navigator>
  );
}
