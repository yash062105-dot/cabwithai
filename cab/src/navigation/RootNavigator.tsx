import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import AuthNavigator from './AuthNavigator';
import UserNavigator from './UserNavigator';
import DriverNavigator from './DriverNavigator';
import {useAuth} from '../context/AuthContext';
import AccountStatusScreen from '../screens/auth/AccountStatusScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const {isLoggedIn, isReady, role, accountStatus} = useAuth();

  if (!isReady) {
    return <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}><ActivityIndicator /></View>;
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {!isLoggedIn ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : accountStatus !== 'active' ? (
        <Stack.Screen name="AccountStatus" component={AccountStatusScreen} />
      ) : role === 'user' ? (
        <Stack.Screen name="User" component={UserNavigator} />
      ) : (
        <Stack.Screen name="Driver" component={DriverNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;