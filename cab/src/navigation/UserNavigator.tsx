import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Text, StyleSheet} from 'react-native';

import UserHomeScreen from '../screens/user/UserHomeScreen';
import BookRideScreen from '../screens/user/BookRideScreen';
import RideTrackingScreen from '../screens/user/RideTrackingScreen';
import RidesScreen from '../screens/user/RidesScreen';
import WalletScreen from '../screens/user/WalletScreen';
import UserProfileScreen from '../screens/user/UserProfileScreen';

import {colors, fonts} from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const UserTabNavigator = () => {
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
        component={UserHomeScreen}
        options={{
          tabBarIcon: ({color}) => <Text style={{color, fontSize: 20}}>⌂</Text>,
        }}
      />

      <Tab.Screen
        name="Rides"
        component={RidesScreen}
        options={{
          tabBarIcon: ({color}) => <Text style={{color, fontSize: 20}}>🚕</Text>,
        }}
      />

      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarLabel: 'Cash',
          tabBarIcon: ({color}) => <Text style={{color, fontSize: 20}}>💰</Text>,
        }}
      />

      <Tab.Screen
        name="Profile"
        component={UserProfileScreen}
        options={{
          tabBarIcon: ({color}) => <Text style={{color, fontSize: 20}}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

const UserNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="UserTabs" component={UserTabNavigator} />
      <Stack.Screen name="BookRide" component={BookRideScreen} />
      <Stack.Screen name="RideTracking" component={RideTrackingScreen} />
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

export default UserNavigator;