import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Text, StyleSheet} from 'react-native';

import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import DriverBookingsScreen from '../screens/driver/DriverBookingsScreen';
import DriverEarningsScreen from '../screens/driver/DriverEarningsScreen';
import DriverProfileScreen from '../screens/driver/DriverProfileScreen';
import DriverRideScreen from '../screens/driver/DriverRideScreen';

import {colors, fonts} from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DriverTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      <Tab.Screen
        name="Home"
        component={DriverHomeScreen}
        options={{
          tabBarIcon: ({color}) => <Text style={{color, fontSize: 20}}>⌂</Text>,
        }}
      />

      <Tab.Screen
        name="Bookings"
        component={DriverBookingsScreen}
        options={{
          tabBarIcon: ({color}) => <Text style={{color, fontSize: 20}}>📋</Text>,
        }}
      />

      <Tab.Screen
        name="Earnings"
        component={DriverEarningsScreen}
        options={{
          tabBarIcon: ({color}) => <Text style={{color, fontSize: 20}}>💵</Text>,
        }}
      />

      <Tab.Screen
        name="Profile"
        component={DriverProfileScreen}
        options={{
          tabBarIcon: ({color}) => <Text style={{color, fontSize: 20}}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

const DriverNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="DriverTabs" component={DriverTabNavigator} />
      <Stack.Screen name="DriverRide" component={DriverRideScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
});

export default DriverNavigator;