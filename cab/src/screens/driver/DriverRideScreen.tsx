import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { colors, fonts, spacing } from '../../theme';
import Api from '../../config/Api';
import LiveMap from '../../components/LiveMap';
import { Coordinates, watchLocation } from '../../services/location';

interface DriverRideScreenProps {
  navigation: any;
  route: any;
}

type TripStage = 'navigating_pickup' | 'arrived' | 'in_trip' | 'completed';

const DriverRideScreen = ({ navigation, route }: DriverRideScreenProps) => {
  const [stage, setStage] = useState<TripStage>('navigating_pickup');
  const [booking, setBooking] = useState<Record<string, any> | null>(null);
  const [driverLocation, setDriverLocation] = useState<Coordinates | null>(
    null,
  );
  const bookingId = route?.params?.bookingId;

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const response = await Api.get('/driver/bookings');
        const current = response.data.find(
          (item: Record<string, any>) => item._id === bookingId,
        );
        if (current) {
          setBooking(current);
          setStage(
            current.status === 'in_progress'
              ? 'in_trip'
              : current.status === 'completed'
              ? 'completed'
              : 'navigating_pickup',
          );
        }
      } catch (error: any) {
        Alert.alert(
          'Could not load ride',
          error.response?.data?.detail ||
            'Check your connection and try again.',
        );
      }
    };
    loadBooking();
  }, [bookingId]);

  useEffect(
    () =>
      watchLocation(coordinates => {
        setDriverLocation(coordinates);
        Api.patch('/driver/location', coordinates).catch(() => undefined);
      }),
    [],
  );

  const handleArrived = () => {
    setStage('arrived');
  };

  const handleStartTrip = async () => {
    try {
      await Api.post(`/driver/bookings/${bookingId}/start`);
      setStage('in_trip');
    } catch (error: any) {
      Alert.alert(
        'Could not start ride',
        error.response?.data?.detail || 'Refresh and try again.',
      );
    }
  };

  const handleCompleteTrip = async () => {
    try {
      const response = await Api.post(
        `/driver/bookings/${bookingId}/complete`,
        { fare_amount: booking?.estimated_fare },
      );
      setBooking(previous => ({ ...previous, ...response.data }));
      setStage('completed');
    } catch (error: any) {
      Alert.alert(
        'Could not complete ride',
        error.response?.data?.detail || 'Refresh and try again.',
      );
    }
  };

  const handleFinish = () => {
    navigation.replace('Home');
  };

  if (!booking) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Ride #{String(booking._id).slice(-8)}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Navigation Map */}
        <View style={styles.mapContainer}>
          <LiveMap
            pickup={{
              latitude: booking.pickup_lat,
              longitude: booking.pickup_lon,
              label: booking.pickup_address || 'Pickup',
            }}
            destination={{
              latitude: booking.destination_lat,
              longitude: booking.destination_lon,
              label: booking.destination_address || 'Destination',
            }}
            current={driverLocation}
            style={styles.liveMap}
          />

          <View style={styles.stageBanner}>
            <Text style={styles.stageText}>
              {stage === 'navigating_pickup' && '📍 Navigating to Pickup Point'}
              {stage === 'arrived' &&
                '⌛ Arrived at Pickup. Waiting for Passenger.'}
              {stage === 'in_trip' && '🚗 Driving to Destination'}
              {stage === 'completed' && '🏁 Trip Completed! Collect Payment.'}
            </Text>
          </View>
        </View>

        {/* Customer Information Card */}
        <View style={styles.card}>
          <View style={styles.customerRow}>
            <Text style={styles.customerAvatar}>👤</Text>

            <View style={styles.customerMeta}>
              <Text style={styles.customerName}>
                {booking.rider_name || 'Passenger'}
              </Text>
              <Text style={styles.customerRating}>
                {booking.payment_method || 'Cash'} • {booking.cab_type || 'Cab'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.callButton}
              activeOpacity={0.8}
              onPress={() => console.log('Call customer')}
            >
              <Text style={styles.callIcon}>📞</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Pickup & Destination */}
          <View style={styles.routeBox}>
            <View style={styles.routeRow}>
              <View style={styles.pickupDot} />
              <View>
                <Text style={styles.routeLabel}>PICKUP</Text>
                <Text style={styles.routeText}>
                  {booking.pickup_address || 'Pickup location'}
                </Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routeRow}>
              <View style={styles.dropSquare} />
              <View>
                <Text style={styles.routeLabel}>DESTINATION</Text>
                <Text style={styles.routeText}>
                  {booking.destination_address || 'Destination'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Arrival confirmation */}
        {stage === 'arrived' && (
          <View style={styles.otpBox}>
            <Text style={styles.otpTitle}>
              Confirm the passenger is on board before starting.
            </Text>
          </View>
        )}

        {/* Payment Summary when completed */}
        {stage === 'completed' && (
          <View style={styles.fareCard}>
            <Text style={styles.fareTitle}>Total Collectible Fare</Text>
            <Text style={styles.fareAmount}>
              ₹{booking.fare_amount ?? booking.estimated_fare}
            </Text>
            <Text style={styles.paymentType}>
              Payment Method: {booking.payment_method || 'Cash'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer Controls */}
      <View style={styles.footer}>
        {stage === 'navigating_pickup' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleArrived}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>I Have Arrived</Text>
          </TouchableOpacity>
        )}

        {stage === 'arrived' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleStartTrip}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Start Trip</Text>
          </TouchableOpacity>
        )}

        {stage === 'in_trip' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCompleteTrip}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Complete Trip</Text>
          </TouchableOpacity>
        )}

        {stage === 'completed' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleFinish}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Collect Fare & Finish</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 110,
  },
  mapContainer: {
    height: 260,
    marginTop: 10,
    marginBottom: 16,
  },
  liveMap: {
    height: 260,
  },
  mapGrid: {
    ...StyleSheet.absoluteFill,
  },
  mapRoadHorizontal: {
    position: 'absolute',
    top: 90,
    left: -20,
    right: -20,
    height: 24,
    backgroundColor: '#FFFFFF',
  },
  mapRoadVertical: {
    position: 'absolute',
    left: 120,
    top: -20,
    bottom: -20,
    width: 22,
    backgroundColor: '#FFFFFF',
  },
  driverPin: {
    position: 'absolute',
    top: 80,
    left: 110,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  driverPinEmoji: {
    fontSize: 22,
  },
  stageBanner: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  stageText: {
    color: colors.secondary,
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    fontSize: 28,
    marginRight: 12,
  },
  customerMeta: {
    flex: 1,
  },
  customerName: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  customerRating: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  routeBox: {
    gap: 8,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 10,
  },
  dropSquare: {
    width: 8,
    height: 8,
    backgroundColor: colors.primary,
    marginRight: 10,
  },
  routeLine: {
    width: 1,
    height: 10,
    backgroundColor: colors.border,
    marginLeft: 3.5,
    marginVertical: -4,
  },
  routeLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontFamily: fonts.bold,
  },
  routeText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  otpBox: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: 14,
  },
  otpTitle: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  otpHint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  otpInput: {
    width: 180,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
  },
  fareCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  fareTitle: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  fareAmount: {
    color: colors.primary,
    fontSize: 36,
    fontFamily: fonts.bold,
    fontWeight: '800',
    marginVertical: 4,
  },
  paymentType: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: fonts.bold,
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
  actionButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});

export default DriverRideScreen;
