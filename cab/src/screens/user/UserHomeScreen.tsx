
import React, {useEffect, useState} from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import {colors, fonts, spacing} from '../../theme';
import {useAuth} from '../../context/AuthContext';
import {useLocation} from '../../context/LocationContext';
import LiveMap from '../../components/LiveMap';
import {reverseGeocode} from '../../services/location';

interface UserHomeScreenProps {
  navigation: any;
}

const UserHomeScreen = ({navigation}: UserHomeScreenProps) => {
  const {user} = useAuth();
  const {currentLocation} = useLocation();

  const [pickup, setPickup] = useState('');

  useEffect(() => {
    let active = true;

    if (!currentLocation) {
      setPickup('');
      return;
    }

    reverseGeocode(currentLocation)
      .then(address => {
        if (active) setPickup(address);
      })
      .catch((error: Error) => {
        if (active) {
          Alert.alert('Could not find current address', error.message);
        }
      });

    return () => {
      active = false;
    };
  }, [currentLocation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>
          Hello, {user?.name || 'User'}
        </Text>
        <Text style={styles.subtitle}>
          Your location is ready
        </Text>
      </View>

      {/* Current Location */}
      <View style={styles.locationCard}>
        <Text style={styles.locationLabel}>
          📍 YOUR CURRENT LOCATION
        </Text>

        <Text style={styles.locationText}>
          {pickup || 'Locating your position...'}
        </Text>
      </View>

      {/* Live Map */}
      <LiveMap
        current={currentLocation}
        style={styles.mapContainer}
      />

      {/* Find Cab Button */}
      <TouchableOpacity
        style={styles.bookButton}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('BookRide', {pickup})
        }>
        <Text style={styles.bookButtonText}>
          Find a Cab
        </Text>

        <Text style={styles.bookArrow}>→</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: 25,
  },

  header: {
    marginBottom: 22,
  },

  name: {
    color: colors.text,
    fontSize: 23,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 5,
    fontFamily: fonts.regular,
  },

  locationCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },

  locationLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginBottom: 9,
  },

  locationText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },

  mapContainer: {
    height: 350,
    backgroundColor: '#E8E5DA',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 22,
  },

  bookButton: {
    height: 55,
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  bookButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  bookArrow: {
    color: colors.secondary,
    fontSize: 22,
    marginLeft: 10,
  },
});

export default UserHomeScreen;
