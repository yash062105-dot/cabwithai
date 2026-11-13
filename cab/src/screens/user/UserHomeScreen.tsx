import React, {useEffect, useState} from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import {colors, fonts, radii, spacing, shadows} from '../../theme';
import {useAuth} from '../../context/AuthContext';
import {useLocation} from '../../context/LocationContext';
import LiveMap from '../../components/LiveMap';
import {reverseGeocode} from '../../services/location';
import {Button} from '../../components';

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

      {/* Modern Header with User Avatar */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.name}>{user?.name || 'Rider'}</Text>
        </View>

        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Current Location Quick Card */}
      <View style={styles.locationCard}>
        <View style={styles.locationIconCircle}>
          <View style={styles.pulseDot} />
        </View>

        <View style={styles.locationTextContainer}>
          <Text style={styles.locationLabel}>PICKUP LOCATION</Text>
          <Text style={styles.locationText} numberOfLines={2}>
            {pickup || 'Pinpointing your GPS position...'}
          </Text>
        </View>
      </View>

      {/* Interactive Live Map Surface */}
      <View style={styles.mapWrapper}>
        <LiveMap
          current={currentLocation}
          style={styles.mapContainer}
        />
        <View style={styles.mapFloatingBadge}>
          <Text style={styles.mapBadgeText}>📍 Live Area Map</Text>
        </View>
      </View>

      {/* Bottom Booking Action Container */}
      <View style={styles.actionContainer}>
        <Button
          title="Find a Cab"
          icon="→"
          size="lg"
          onPress={() => navigation.navigate('BookRide', {pickup})}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: 16,
    justifyContent: 'space-between',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 12,
  },

  headerTextContainer: {
    flex: 1,
  },

  greeting: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  name: {
    color: colors.text,
    fontSize: 26,
    fontFamily: fonts.bold,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },

  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },

  avatarText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primary,
    fontWeight: '700',
  },

  locationCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    ...shadows.sm,
  },

  locationIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.successBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },

  locationTextContainer: {
    flex: 1,
  },

  locationLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  locationText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '600',
    lineHeight: 19,
  },

  mapWrapper: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
    position: 'relative',
    ...shadows.sm,
  },

  mapContainer: {
    flex: 1,
    minHeight: 280,
  },

  mapFloatingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.backdrop,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },

  mapBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  actionContainer: {
    paddingBottom: 20,
  },
});

export default UserHomeScreen;
