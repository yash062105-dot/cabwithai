import React, {useEffect, useState} from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
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

const UserHomeScreen = ({
  navigation,
}: UserHomeScreenProps) => {
  const {user} = useAuth();
  const {currentLocation} = useLocation();
  const [destination, setDestination] = useState('');
  const [pickup, setPickup] = useState('');

  useEffect(() => {
    let active = true;
    if (!currentLocation) return;

    setPickup('');
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
      <StatusBar
        barStyle="dark-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        {/* Header */}

        <View style={styles.header}>
          <View>
            <Text style={styles.name}>
              {user.name}
            </Text>
          </View>
        </View>

        {/* Search Card */}

        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>
            Where are you going?
          </Text>

          {/* Current Location */}

          <TouchableOpacity
            style={styles.locationRow}
            activeOpacity={0.7}>

            <View style={styles.locationIcon}>
              <Text style={styles.locationEmoji}>
                📍
              </Text>
            </View>

            <View style={styles.locationContent}>
              <Text style={styles.smallLabel}>
                PICKUP LOCATION
              </Text>

              <Text
                style={styles.locationText}
                numberOfLines={1}>
                {pickup || 'Locating...'}
              </Text>
            </View>

            <Text style={styles.chevron}>
              ›
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Destination */}

          <View style={styles.destinationRow}>
            <View style={styles.destinationIcon}>
              <Text style={styles.destinationEmoji}>
                🔎
              </Text>
            </View>

            <TextInput
              style={styles.destinationInput}
              placeholder="Where to?"
              placeholderTextColor={
                colors.textSecondary
              }
              value={destination}
              onChangeText={setDestination}
            />
          </View>

          {/* Book Button */}

          <TouchableOpacity
            style={styles.bookButton}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('BookRide', {pickup, destination: destination.trim()})
            }>
            <Text style={styles.bookButtonText}>
              Find a Cab
            </Text>

            <Text style={styles.bookArrow}>
              →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map */}

        <LiveMap current={currentLocation} style={styles.mapContainer} />

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
    paddingBottom: 105,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  name: {
    color: colors.text,
    fontSize: 21,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  searchCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },

  searchTitle: {
    color: colors.text,
    fontSize: 17,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginBottom: 15,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  locationEmoji: {
    fontSize: 17,
  },

  locationContent: {
    flex: 1,
    marginLeft: 11,
  },

  smallLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
  },

  locationText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },

  chevron: {
    color: colors.textSecondary,
    fontSize: 25,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 13,
    marginLeft: 49,
  },

  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  destinationIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  destinationEmoji: {
    fontSize: 16,
  },

  destinationInput: {
    flex: 1,
    height: 44,
    marginLeft: 11,
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.regular,
    paddingVertical: 0,
  },

  bookButton: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },

  bookButtonText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  bookArrow: {
    color: colors.secondary,
    fontSize: 21,
    marginLeft: 9,
  },

  mapContainer: {
    height: 190,
    backgroundColor: '#E8E5DA',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },

  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 5,
  },

  bottomTab: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomIcon: {
    color: colors.textSecondary,
    fontSize: 20,
    marginBottom: 4,
  },

  activeBottomIcon: {
    color: colors.primary,
  },

  bottomLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: fonts.medium,
  },

  activeBottomLabel: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});

export default UserHomeScreen;