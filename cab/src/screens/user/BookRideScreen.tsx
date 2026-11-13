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
  ActivityIndicator,
} from 'react-native';

import { colors, fonts, radii, spacing, shadows } from '../../theme';
import { CabOption, CabType } from '../../types/ride';
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
import { Button, ScreenHeader } from '../../components';

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
    }, 400);
    return () => clearTimeout(timer);
  }, [destination, destinationLat, destinationLon]);

  const handleSelectPlace = (place: PlaceResult) => {
    setDestination(place.label);
    setDestinationLat(String(place.latitude));
    setDestinationLon(String(place.longitude));
    setPlaceResults([]);
  };

  const handleConfirmBooking = async () => {
    if (!selectedCabType) {
      Alert.alert('Select a Cab', 'Please choose a cab category for your ride.');
      return;
    }
    if (!pickup.trim() || !pickupLat || !pickupLon) {
      Alert.alert(
        'Pickup needed',
        'We need your current location to dispatch a driver.',
      );
      return;
    }
    if (!destination.trim() || !destinationLat || !destinationLon) {
      Alert.alert(
        'Destination needed',
        'Search and select a drop location from suggestions.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await Api.post('/bookings', {
        pickup,
        destination,
        cab_type: selectedCabType,
        pickup_latitude: Number(pickupLat),
        pickup_longitude: Number(pickupLon),
        destination_latitude: Number(destinationLat),
        destination_longitude: Number(destinationLon),
        payment_method: paymentMethod,
      });

      setBooking({
        id: response.data._id,
        pickup,
        destination,
        cabType: selectedCabType,
        fare: response.data.fare,
        status: response.data.status,
        date: new Date(response.data.created_at).toLocaleDateString(),
        time: new Date(response.data.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        pickupCoordinates: {
          latitude: Number(pickupLat),
          longitude: Number(pickupLon),
        },
        destinationCoordinates: {
          latitude: Number(destinationLat),
          longitude: Number(destinationLon),
        },
      });

      navigation.replace('RideTracking', { rideId: response.data._id });
    } catch (error: any) {
      Alert.alert(
        'Booking Failed',
        error.response?.data?.detail || 'Could not schedule ride. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <ScreenHeader
        title="Book a Ride"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.refreshBadge}
            onPress={refreshLocation}
            activeOpacity={0.7}>
            <Text style={styles.refreshText}>GPS ↺</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        
        {/* Route Card: Pickup and Destination */}
        <View style={styles.routeCard}>
          <View style={styles.locationRow}>
            <View style={styles.pickupDot} />
            <TextInput
              style={styles.locationInput}
              placeholder="Detecting pickup location..."
              placeholderTextColor={colors.textMuted}
              value={pickup}
              onChangeText={text => {
                setPickup(text);
                setPickupLat('');
                setPickupLon('');
              }}
            />
          </View>

          <View style={styles.locationDivider} />

          <View style={styles.locationRow}>
            <View style={styles.dropSquare} />
            <TextInput
              style={styles.locationInput}
              placeholder="Where to? (e.g. Airport, Station)"
              placeholderTextColor={colors.textMuted}
              value={destination}
              onChangeText={text => {
                setDestination(text);
                setDestinationLat('');
                setDestinationLon('');
              }}
            />
          </View>
        </View>

        {/* Destination Suggestions Dropdown */}
        {searchingPlaces && (
          <View style={styles.searchStatus}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.searchStatusText}>Searching places...</Text>
          </View>
        )}

        {placeSearchError && (
          <Text style={styles.searchErrorText}>Could not search places. Try another phrase.</Text>
        )}

        {placeResults.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {placeResults.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.placeResultRow}
                onPress={() => handleSelectPlace(item)}
                activeOpacity={0.7}>
                <Text style={styles.placePin}>📍</Text>
                <Text style={styles.placeResultText} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Live Route Preview Map */}
        <View style={styles.mapContainer}>
          <LiveMap
            pickup={pickupLat && pickupLon ? { latitude: Number(pickupLat), longitude: Number(pickupLon), label: pickup } : null}
            destination={destinationLat && destinationLon ? { latitude: Number(destinationLat), longitude: Number(destinationLon), label: destination } : null}
            style={styles.map}
          />
          {routeDistanceKm !== null && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>Est. Distance: {routeDistanceKm.toFixed(1)} km</Text>
            </View>
          )}
        </View>

        {/* Cab Selection Options */}
        <Text style={styles.sectionTitle}>Choose Cab Category</Text>

        {loadingCabOptions ? (
          <View style={styles.loadingCabBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingCabText}>Loading available cabs...</Text>
          </View>
        ) : cabOptionsError ? (
          <TouchableOpacity
            style={styles.retryBox}
            onPress={loadCabOptions}
            activeOpacity={0.8}>
            <Text style={styles.retryText}>Could not load cabs. Tap to retry ↺</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.cabList}>
            {cabOptions.map(cab => {
              const selected = selectedCabType === cab.type;
              const fare = routeDistanceKm !== null
                ? Math.max(20, Math.round(cab.base_fare + routeDistanceKm * cab.fare_per_km))
                : cab.base_fare;

              return (
                <TouchableOpacity
                  key={cab.type}
                  style={[
                    styles.cabCard,
                    selected && styles.selectedCabCard,
                  ]}
                  onPress={() => setSelectedCabType(cab.type)}
                  activeOpacity={0.85}>
                  
                  <View style={[styles.cabIconCircle, selected && styles.selectedCabIconCircle]}>
                    <Text style={styles.cabIcon}>
                      {cab.type === 'Auto' ? '🛺' : cab.type === 'SUV' ? '🚐' : cab.type === 'Sedan' ? '🚙' : '🚗'}
                    </Text>
                  </View>

                  <View style={styles.cabInfo}>
                    <View style={styles.cabTitleRow}>
                      <Text style={styles.cabName}>{cab.type}</Text>
                      <View style={styles.capacityBadge}>
                        <Text style={styles.capacityText}>
                          {cab.type === 'Auto' ? '👥 3' : cab.type === 'SUV' ? '👥 6' : '👥 4'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cabDescription} numberOfLines={1}>
                      {cab.available_drivers > 0
                        ? `${cab.available_drivers} driver${cab.available_drivers > 1 ? 's' : ''} nearby`
                        : 'Available for immediate dispatch'}
                    </Text>
                    <Text style={styles.cabEta}>⚡ Fast pickup in your area</Text>
                  </View>

                  <View style={styles.priceContainer}>
                    <Text style={styles.cabPrice}>₹{fare}</Text>
                    {selected && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedCheck}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Payment and Fare Details */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentMethodCard}>
          <View style={styles.cashIconCircle}>
            <Text style={styles.cashIcon}>💵</Text>
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>Cash in Hand</Text>
            <Text style={styles.paymentSubtitle}>Pay the driver directly after completing the trip</Text>
          </View>
          <Text style={styles.verifiedCheck}>✓ Active</Text>
        </View>

        {/* Price Breakdown */}
        {selectedCab && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Base Fare</Text>
              <Text style={styles.summaryValue}>₹{selectedCab.base_fare}</Text>
            </View>

            {routeDistanceKm !== null && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estimated Distance</Text>
                <Text style={styles.summaryValue}>{routeDistanceKm.toFixed(1)} km</Text>
              </View>
            )}

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              <Text style={styles.totalValue}>₹{estimatedFare ?? selectedCab.base_fare}</Text>
            </View>
          </View>
        )}

        {/* Bottom Booking Button */}
        <View style={styles.actionSection}>
          <Button
            title={submitting ? 'Confirming Booking...' : 'Request Cab Now'}
            icon="→"
            size="lg"
            loading={submitting}
            disabled={!selectedCabType || submitting}
            onPress={handleConfirmBooking}
          />
        </View>
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
    paddingTop: 8,
    paddingBottom: 40,
  },

  refreshBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },

  refreshText: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  routeCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 14,
    ...shadows.sm,
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
    marginRight: 14,
    marginLeft: 4,
  },

  dropSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginRight: 14,
    marginLeft: 4,
  },

  locationInput: {
    flex: 1,
    height: 44,
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.medium,
    paddingVertical: 0,
  },

  locationDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
    marginLeft: 28,
  },

  searchStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },

  searchStatusText: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  searchErrorText: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: 8,
  },

  suggestionsContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 14,
    ...shadows.sm,
  },

  placeResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  placePin: {
    fontSize: 14,
    marginRight: 10,
  },

  placeResultText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.medium,
  },

  mapContainer: {
    height: 200,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
    position: 'relative',
    ...shadows.sm,
  },

  map: {
    flex: 1,
  },

  distanceBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: colors.backdrop,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },

  distanceText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: fonts.bold,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  loadingCabBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },

  loadingCabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.medium,
  },

  retryBox: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderRadius: radii.lg,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },

  retryText: {
    color: colors.warning,
    fontSize: 13,
    fontFamily: fonts.bold,
  },

  cabList: {
    gap: 10,
    marginBottom: 18,
  },

  cabCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },

  selectedCabCard: {
    borderColor: colors.primary,
    backgroundColor: '#FAFBFD',
  },

  cabIconCircle: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  selectedCabIconCircle: {
    backgroundColor: colors.secondaryLight,
  },

  cabIcon: {
    fontSize: 24,
  },

  cabInfo: {
    flex: 1,
  },

  cabTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  cabName: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  capacityBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },

  capacityText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: fonts.bold,
  },

  cabDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },

  cabEta: {
    color: colors.success,
    fontSize: 11,
    fontFamily: fonts.bold,
    marginTop: 3,
  },

  priceContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },

  cabPrice: {
    color: colors.text,
    fontSize: 17,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },

  selectedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },

  selectedCheck: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '800',
  },

  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.sm,
  },

  cashIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  cashIcon: {
    fontSize: 20,
  },

  paymentInfo: {
    flex: 1,
  },

  paymentTitle: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  paymentSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.regular,
    marginTop: 1,
  },

  verifiedCheck: {
    color: colors.success,
    fontSize: 12,
    fontFamily: fonts.bold,
  },

  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.medium,
  },

  summaryValue: {
    color: colors.text,
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
    fontWeight: '700',
  },

  totalValue: {
    color: colors.primary,
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },

  actionSection: {
    marginTop: 4,
  },
});

export default BookRideScreen;
