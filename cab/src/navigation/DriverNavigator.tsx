import React from 'react';
import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import {
  Text,
  StyleSheet,
  View,
  Platform,
} from 'react-native';

import {
  Home,
  ClipboardList,
  Wallet,
  UserRound,
} from 'lucide-react-native';

import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import DriverBookingsScreen from '../screens/driver/DriverBookingsScreen';
import DriverEarningsScreen from '../screens/driver/DriverEarningsScreen';
import DriverProfileScreen from '../screens/driver/DriverProfileScreen';
import DriverRideScreen from '../screens/driver/DriverRideScreen';

import {colors, fonts, radii, shadows} from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

interface TabIconProps {
  Icon: React.ComponentType<any>;
  focused: boolean;
  label: string;
}

const TabIcon = ({Icon, focused, label}: TabIconProps) => {
  return (
    <View style={styles.tabItemContainer}>
      <View
        style={[
          styles.iconWrapper,
          focused && styles.iconWrapperActive,
        ]}>
        <Icon
          size={18}
          strokeWidth={focused ? 2.5 : 1.8}
          color={focused ? colors.primary : colors.textSecondary}
        />
      </View>

      <Text
        style={[
          styles.tabLabel,
          focused && styles.tabLabelActive,
        ]}>
        {label}
      </Text>
    </View>
  );
};

const DriverTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,

        tabBarStyle: {
          ...styles.tabBar,
          height: Platform.OS === 'ios' ? 85 : 68,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        },

        tabBarItemStyle: {
          flex: 1,
        },
      }}>

      <Tab.Screen
        name="Home"
        component={DriverHomeScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              Icon={Home}
              label="Home"
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Bookings"
        component={DriverBookingsScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              Icon={ClipboardList}
              label="Bookings"
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Earnings"
        component={DriverEarningsScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              Icon={Wallet}
              label="Earnings"
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={DriverProfileScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              Icon={UserRound}
              label="Profile"
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const DriverNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen
        name="DriverTabs"
        component={DriverTabNavigator}
      />

      <Stack.Screen
        name="DriverRide"
        component={DriverRideScreen}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    ...shadows.md,
    elevation: 12,
  },

  tabItemContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },

  iconWrapper: {
    width: 42,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  iconWrapperActive: {
    backgroundColor: colors.surface,
  },

  tabLabel: {
    fontFamily: fonts.medium,
    fontSize: 7,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  tabLabelActive: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});

export default DriverNavigator;
