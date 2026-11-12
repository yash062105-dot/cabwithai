import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
} from 'react-native';

import { colors, fonts, spacing } from '../../theme';
import {CabOption, CabType} from '../../types/ride';
import { useRide } from '../../context/RideContext';
import Api from '../../config/Api';
import LiveMap from '../../components/LiveMap';
import {
  Coordinates,
  PlaceResult,
  reverseGeocode,
  searchPlaces,
} from '../../services/location';
import { useLocation } from '../../context/LocationContext';

interface BookRideScreenProps {
  navigation: any;
  route: any;
}

const distanceKm = (
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) => {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(latitudeB - latitudeA);
  const longitudeDelta = radians(longitudeB - longitudeA);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(latitudeA)) *
      Math.cos(radians(latitudeB)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const BookRideScreen = ({ navigation, route }: BookRideScreenProps) => {
  const { setBooking } = useRide();
  const { currentLocation, refreshLocation } = useLocation();

  const [pickup, setPickup] = useState(route?.params?.pickup || '');
  const [destination, setDestination] = useState(route?.params?.destination || '');
  const [cabOptions, setCabOptions] = useState<CabOption[]>([]);
  const [selectedCabType, setSelectedCabType] = useState<CabType | null>(null);
  const [loadingCabOptions, setLoadingCabOptions] = useState(true);
  const [cabOptionsError, setCabOptionsError] = useState(false);
  const [paymentMethod] = useState<'Cash'>('Cash');
  const [pickupLat, setPickupLat] = useState(
    String(currentLocation?.latitude ?? ''),
  );
  const [pickupLon, setPickupLon] = useState(
    String(currentLocation?.longitude ?? ''),
  );
  const [destinationLat, setDestinationLat] = useState('');
  const [destinationLon, setDestinationLon] = useState('');
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [placeSearchError, setPlaceSearchError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const hasRoute = Boolean(pickupLat && pickupLon && destinationLat && destinationLon);
  const rawDistanceKm = hasRoute
    ? distanceKm(
        Number(pickupLat),
        Number(pickupLon),
        Number(destinationLat),
        Number(destinationLon),
      )
    : null;
  const routeDistanceKm =
    rawDistanceKm !== null && Number.isFinite(rawDistanceKm)
      ? rawDistanceKm
      : null;
  const selectedCab = cabOptions.find(cab => cab.type === selectedCabType);
  const estimatedFare = selectedCab && routeDistanceKm !== null
    ? Math.max(
        20,
        Math.round(selectedCab.base_fare + routeDistanceKm * selectedCab.fare_per_km),
      )
    : null;

  const loadCabOptions = useCallback(async () => {
    setLoadingCabOptions(true);
    setCabOptionsError(false);
    try {
      const response = await Api.get<CabOption[]>('/cab-options');
      setCabOptions(response.data);
      setSelectedCabType(previous =>
        response.data.some(cab => cab.type === previous)
          ? previous
          : response.data[0]?.type ?? null,
      );
    } catch (error: any) {
      setCabOptionsError(true);
      Alert.alert(
        'Could not load available cabs',
        error.response?.data?.detail || 'Check your connection and try again.',
      );
    } finally {
      setLoadingCabOptions(false);
    }
  }, []);

  useEffect(() => {
    loadCabOptions();
  }, [loadCabOptions]);

  useEffect(() => {
    if (!currentLocation) return;
    setPickupLat(String(currentLocation.latitude));
    setPickupLon(String(currentLocation.longitude));
    setPickup('');
    reverseGeocode(currentLocation)
      .then(setPickup)
      .catch((error: Error) =>
        Alert.alert('Could not find pickup address', error.message),
      );
  }, [currentLocation]);

  useEffect(() => {
    const query = destination.trim();
    if (query.length < 3 || (destinationLat && destinationLon)) {
      setPlaceResults([]);
      setPlaceSearchError(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingPlaces(true);
      setPlaceSearchError(false);
      try {
        setPlaceResults(await searchPlaces(query));
      } catch {
        setPlaceResults([]);
        setPlaceSearchError(true);
      } finally {
        setSearchingPlaces(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [destination, destinationLat, destinationLon]);

  const chooseDestination = (place: Coordinates & { label: string }) => {
    setDestination(place.label);
    setDestinationLat(String(place.latitude));
    setDestinationLon(String(place.longitude));
    setPlaceResults([]);
  };

  const handleMapPress = async (coordinates: Coordinates) => {
    setDestinationLat(String(coordinates.latitude));
    setDestinationLon(String(coordinates.longitude));
    try {
      setDestination(await reverseGeocode(coordinates));
    } catch {
      setDestination(
        `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(
          5,
        )}`,
      );
    }
    setPlaceResults([]);
  };

  const handleConfirmBooking = async () => {
    if (!currentLocation || !destinationLat || !destinationLon || !selectedCab) {
      Alert.alert(
        selectedCab ? 'Choose a destination' : 'No cabs available',
        selectedCab
          ? 'Search for a place or tap a destination on the map.'
          : 'There are no available cabs right now. Please try again later.',
      );
      return;
    }
    setSubmitting(true);
    try {
      const location = await refreshLocation();
      const response = await Api.post('/bookings', {
        pickup_lat: location.latitude,
        pickup_lon: location.longitude,
        destination_lat: Number(destinationLat),
        destination_lon: Number(destinationLon),
        pickup_address: pickup.trim(),
        destination_address: destination.trim(),
        cab_type: selectedCab.type,
        payment_method: paymentMethod,
      });
      setBooking(response.data);
      navigation.replace('RideTracking');
    } catch (error: any) {
      Alert.alert(
        'Booking failed',
        error.response?.data?.detail ||
          'Check your connection and driver availability.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Your Cab</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationRow}>
            <View style={styles.pickupDot} />
            <TextInput
              style={styles.locationInput}
              value={pickup}
              onChangeText={setPickup}
              placeholder="Pickup Location"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.locationDivider} />

          <View style={styles.locationRow}>
            <View style={styles.dropSquare} />
            <TextInput
              style={styles.locationInput}
              value={destination}
              onChangeText={setDestination}
              placeholder="Where to?"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Choose destination</Text>
        <TextInput
          style={styles.destinationSearch}
          value={destination}
          onChangeText={value => {
            setDestination(value);
            setDestinationLat('');
            setDestinationLon('');
          }}
          placeholder="Search a place or tap the map"
          placeholderTextColor={colors.textSecondary}
        />
        {searchingPlaces && (
          <Text style={styles.searchStatus}>Searching places...</Text>
        )}
        {placeSearchError && (
          <Text style={styles.searchStatus}>
            Could not load place results. Check your connection and try again.
          </Text>
        )}
        {placeResults.map((place, index) => (
          <TouchableOpacity
            key={`${place.latitude}-${place.longitude}-${index}`}
            style={styles.placeResult}
            onPress={() => chooseDestination(place)}
          >
            <Text style={styles.placeResultText} numberOfLines={2}>
              {place.label}
            </Text>
          </TouchableOpacity>
        ))}
        <LiveMap
          pickup={{
            latitude: Number(pickupLat),
            longitude: Number(pickupLon),
            label: 'Your pickup',
          }}
          destination={
            destinationLat && destinationLon
              ? {
                  latitude: Number(destinationLat),
                  longitude: Number(destinationLon),
                  label: destination,
                }
              : null
          }
          current={currentLocation}
          onMapPress={handleMapPress}
          style={styles.map}
        />

        {/* Cab Selection Title */}
        <Text style={styles.sectionTitle}>Available Cabs</Text>

        {/* Cab List */}
        <View style={styles.cabList}>
          {loadingCabOptions ? (
            <Text style={styles.searchStatus}>Loading available cabs...</Text>
          ) : cabOptionsError ? (
            <TouchableOpacity onPress={loadCabOptions}>
              <Text style={styles.searchStatus}>Could not load cabs. Tap to retry.</Text>
            </TouchableOpacity>
          ) : cabOptions.length === 0 ? (
            <Text style={styles.searchStatus}>No cabs are available right now.</Text>
          ) : cabOptions.map(cab => {
            const isSelected = selectedCabType === cab.type;
            return (
              <TouchableOpacity
                key={cab.type}
                style={[styles.cabCard, isSelected && styles.selectedCabCard]}
                onPress={() => setSelectedCabType(cab.type)}
                activeOpacity={0.8}
              >
                <View style={styles.cabInfo}>
                  <View style={styles.cabTitleRow}>
                    <Text style={styles.cabName}>{cab.type}</Text>

                    <View style={styles.capacityBadge}>
                      <Text style={styles.capacityText}>
                        {cab.available_drivers} available
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cabDescription}>
                    {routeDistanceKm === null ? 'Base fare' : 'Estimated trip fare'}
                  </Text>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.cabPrice}>
                    {routeDistanceKm === null
                      ? `From ₹${cab.base_fare}`
                      : `₹${Math.max(
                          20,
                          Math.round(
                            cab.base_fare + routeDistanceKm * cab.fare_per_km,
                          ),
                        )}`}
                  </Text>
                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedCheck}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.cashNotice}>Payment: Cash in hand</Text>

        {/* Fare Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Route estimate</Text>
            <Text style={styles.summaryValue}>
              {routeDistanceKm === null
                ? 'Select destination'
                : `${routeDistanceKm.toFixed(1)} km`}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.totalValue}>
              {estimatedFare === null ? '—' : `₹${estimatedFare}`}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          activeOpacity={0.8}
          onPress={cabOptionsError ? loadCabOptions : handleConfirmBooking}
          disabled={submitting || loadingCabOptions}
        >
          <Text style={styles.confirmButtonText}>
            {submitting
              ? 'Requesting driver...'
              : loadingCabOptions
              ? 'Loading available cabs...'
              : cabOptionsError
              ? 'Retry loading cabs'
              : selectedCab && estimatedFare !== null
              ? `Confirm ${selectedCab.type} • ₹${estimatedFare}`
              : selectedCab
              ? 'Choose destination'
              : 'No cabs available'}
          </Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 18,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 28,
    marginTop: -3,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 110,
  },
  locationCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 14,
  },
  coordinatesCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  coordinatesTitle: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  coordinatesHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 10,
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  coordinateInput: {
    flex: 1,
    minWidth: 0,
    height: 42,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    fontSize: 13,
  },
  destinationSearch: {
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
    color: colors.text,
    marginBottom: 8,
  },
  searchStatus: {
    color: colors.textSecondary,
    fontSize: 12,
    paddingVertical: 6,
  },
  placeResult: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  placeResultText: {
    color: colors.text,
    fontSize: 13,
  },
  map: {
    marginBottom: 18,
  },
  cashNotice: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 14,
    paddingVertical: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    marginRight: 12,
    marginLeft: 4,
  },
  dropSquare: {
    width: 10,
    height: 10,
    backgroundColor: colors.primary,
    marginRight: 12,
    marginLeft: 4,
  },
  locationInput: {
    flex: 1,
    height: 42,
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.medium,
    paddingVertical: 0,
  },
  locationDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
    marginLeft: 26,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 12,
  },
  cabList: {
    gap: 10,
    marginBottom: 16,
  },
  cabCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCabCard: {
    borderColor: colors.secondary,
    borderWidth: 2,
    backgroundColor: '#FFFDF5',
  },
  cabIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  cabInfo: {
    flex: 1,
  },
  cabTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cabName: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  capacityBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  capacityText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  cabDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  cabEta: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: fonts.bold,
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  cabPrice: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
  selectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  selectedCheck: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  paymentContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  paymentChip: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activePaymentChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentChipText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  activePaymentChipText: {
    color: colors.white,
    fontFamily: fonts.bold,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  savingsValue: {
    color: colors.success,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  totalLabel: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  totalValue: {
    color: colors.text,
    fontSize: 17,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.xl,
  },
  confirmButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  arrow: {
    color: colors.secondary,
    fontSize: 22,
    marginLeft: 10,
  },
});

export default BookRideScreen;
