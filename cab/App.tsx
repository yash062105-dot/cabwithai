import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { RideProvider } from './src/context/RideContext';
import { LocationProvider } from './src/context/LocationContext';

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RideProvider>
          <NavigationContainer>
            <LocationProvider>
              <RootNavigator />
            </LocationProvider>
          </NavigationContainer>
        </RideProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
