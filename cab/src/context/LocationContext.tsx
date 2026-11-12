import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Coordinates,
  getCurrentLocation,
  isLocationPermissionError,
  requestLocationPermission,
} from '../services/location';
import { colors, fonts, spacing } from '../theme';

interface LocationContextValue {
  currentLocation: Coordinates | null;
  refreshLocation: () => Promise<Coordinates>;
}

const LocationContext = createContext<LocationContextValue | undefined>(
  undefined,
);

export const LocationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [checking, setChecking] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(
    null,
  );

  const refreshLocation = useCallback(async () => {
    const position = await getCurrentLocation();
    const coordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    setCurrentLocation(coordinates);
    return coordinates;
  }, []);

  const requestAccess = useCallback(async () => {
    setChecking(true);
    try {
      const granted = await requestLocationPermission();
      setPermissionGranted(granted);
      if (granted) {
        try {
          await refreshLocation();
        } catch (error: any) {
          if (isLocationPermissionError(error?.code)) {
            setPermissionGranted(false);
          }
        }
      }
    } catch {
      setPermissionGranted(false);
    } finally {
      setChecking(false);
    }
  }, [refreshLocation]);

  useEffect(() => {
    requestAccess();
  }, [requestAccess]);

  if (checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.message}>Checking location access...</Text>
      </View>
    );
  }

  if (!permissionGranted || !currentLocation) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Location access required</Text>
        <Text style={styles.message}>
          CAB needs foreground location access and active device location
          services for pickup, driver registration, and live ride tracking.
          Enable location to continue.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestAccess}>
          <Text style={styles.buttonText}>Try permission again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.settingsText}>Open device settings</Text>
        </TouchableOpacity>
        <Text style={styles.platformHint}>
          {Platform.OS === 'ios'
            ? 'Choose While Using the App.'
            : 'Choose Allow while using the app.'}
        </Text>
      </View>
    );
  }

  return (
    <LocationContext.Provider value={{ currentLocation, refreshLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export function useLocation(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: 16,
  },
  button: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 24,
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  settingsButton: {
    paddingVertical: 14,
  },
  settingsText: {
    color: colors.primary,
    fontFamily: fonts.medium,
  },
  platformHint: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
});
