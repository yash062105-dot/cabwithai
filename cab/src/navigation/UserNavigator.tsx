

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
  useWindowDimensions,
} from 'react-native';

import {
  Home,
  CarFront,
  Wallet,
  UserRound,
} from 'lucide-react-native';

import UserHomeScreen from '../screens/user/UserHomeScreen';
import BookRideScreen from '../screens/user/BookRideScreen';
import RideTrackingScreen from '../screens/user/RideTrackingScreen';
import RidesScreen from '../screens/user/RidesScreen';
import WalletScreen from '../screens/user/WalletScreen';
import UserProfileScreen from '../screens/user/UserProfileScreen';

import {colors, fonts, radii, shadows} from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({Icon, focused, label}: any) => {
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

const UserTabNavigator = () => {
  const {width} = useWindowDimensions();

  const isSmallScreen = width < 360;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,

        tabBarStyle: {
          ...styles.tabBar,
          height: Platform.OS === 'ios'
            ? 85
            : isSmallScreen ? 62 : 68,
          paddingBottom: Platform.OS === 'ios'
            ? 20
            : isSmallScreen ? 5 : 8,
        },

        tabBarItemStyle: {
          flex: 1,
        },
      }}>

      <Tab.Screen
        name="Home"
        component={UserHomeScreen}
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
        name="Rides"
        component={RidesScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              Icon={CarFront}
              label="Rides"
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              Icon={Wallet}
              label="Wallet"
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={UserProfileScreen}
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

const UserNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen
        name="UserTabs"
        component={UserTabNavigator}
      />

      <Stack.Screen
        name="BookRide"
        component={BookRideScreen}
      />

      <Stack.Screen
        name="RideTracking"
        component={RideTrackingScreen}
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
    justifyContent: 'center',
    paddingHorizontal: 2,
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
    fontSize: 8,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  tabLabelActive: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});

export default UserNavigator;
