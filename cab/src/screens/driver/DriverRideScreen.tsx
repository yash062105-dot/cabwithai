import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';

import {colors, fonts, radii, spacing, shadows} from '../../theme';
import Api from '../../config/Api';
import LiveMap from '../../components/LiveMap';
import {Button, ScreenHeader} from '../../components';
import {connectDriverSocket} from '../../services/driverSocket';
import {watchLocation} from '../../services/location';
import type {Socket} from 'socket.io-client';

const getApiErrorMessage = (error: any, fallback: string): string => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map(item => {
        const location = Array.isArray(item?.loc) ? item.loc.slice(1).join('.') : '';
        const message = typeof item?.msg === 'string' ? item.msg : '';
        return [location, message].filter(Boolean).join(': ');
      })
      .filter(Boolean)
      .join('\n') || fallback;
  }
  return fallback;
};

interface DriverRideScreenProps {
  navigation: any;
  route: any;
}

const DriverRideScreen = ({navigation, route}: DriverRideScreenProps) => {
  const bookingId = route?.params?.bookingId;
  const [booking, setBooking] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);

  const loadBooking = async () => {
    if (!bookingId) return;
    try {
      const response = await Api.get(`/driver/bookings/${bookingId}`);
      setBooking(response.data);
    } catch (error: any) {
      Alert.alert('Could not load booking', getApiErrorMessage(error, 'Check your connection and try again.'));
    }
  };

  useEffect(() => {
    let active = true;
    let socket: Socket | null = null;
    let sendLocation: ((coordinates: {latitude: number; longitude: number}) => void) | null = null;
    let latestCoordinates: {latitude: number; longitude: number} | null = null;

    loadBooking();
    const stopWatching = watchLocation(coordinates => {
      latestCoordinates = coordinates;
      sendLocation?.(coordinates);
    });
    connectDriverSocket(message => console.warn('Driver trip socket:', message))
      .then(connection => {
        if (!active) {
          connection.socket.disconnect();
          return;
        }
        socket = connection.socket;
        sendLocation = connection.sendLocation;
        socket.on('booking_status', (update: {booking_id: string}) => {
          if (update.booking_id === bookingId) loadBooking();
        });
        socket.on('connect', loadBooking);
        loadBooking();
        if (latestCoordinates) connection.sendLocation(latestCoordinates);
      })
      .catch(error => console.warn('Could not connect to driver trip socket:', error));

    return () => {
      active = false;
      stopWatching();
      socket?.disconnect();
      sendLocation = null;
    };
  }, [bookingId]);

  const handleStartTrip = async () => {
    setLoading(true);
    try {
      await Api.post(`/driver/bookings/${bookingId}/start`);
      loadBooking();
    } catch (error: any) {
      Alert.alert('Start trip failed', getApiErrorMessage(error, 'Try again shortly.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTrip = async () => {
    setLoading(true);
    try {
      await Api.post(`/driver/bookings/${bookingId}/complete`, {});
      loadBooking();
    } catch (error: any) {
      Alert.alert('Complete trip failed', getApiErrorMessage(error, 'Try again shortly.'));
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    navigation.replace('DriverTabs');
  };

  const isAccepted = booking?.status === 'accepted';
  const isInProgress = booking?.status === 'in_progress';
  const isCompleted = booking?.status === 'completed';

  const pickupCoords = booking?.pickup_lat != null && booking?.pickup_lon != null
    ? {latitude: booking.pickup_lat, longitude: booking.pickup_lon, label: booking.pickup_address}
    : null;
  const destCoords = booking?.destination_lat != null && booking?.destination_lon != null
    ? {latitude: booking.destination_lat, longitude: booking.destination_lon, label: booking.destination_address}
    : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <ScreenHeader
        title={booking ? `Trip #${booking._id.slice(-6)}` : 'Active Trip'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        
        {/* Live Route Map */}
        <View style={styles.mapContainer}>
          <LiveMap
            pickup={pickupCoords}
            destination={destCoords}
            style={styles.liveMap}
          />
          <View style={styles.stageBanner}>
            <Text style={styles.stageText}>
              {isAccepted
                ? '📍 Heading to Pickup Point'
                : isInProgress
                ? '🚗 Trip in Progress to Destination'
                : '🏁 Ride Completed'}
            </Text>
          </View>
        </View>

        {/* Customer Information Card */}
        <View style={styles.card}>
          <View style={styles.customerRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.customerAvatar}>👤</Text>
            </View>

            <View style={styles.customerMeta}>
              <Text style={styles.customerName}>{booking?.rider_name || booking?.user?.name || 'Rider'}</Text>
              <Text style={styles.customerRating}>★ 5.0 • Cash Payment</Text>
            </View>

            <TouchableOpacity
              style={styles.callButton}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert('Call Rider', `Calling ${booking?.user?.phone || 'Customer'}...`)
              }>
              <Text style={styles.callIcon}>📞</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Route Info */}
          <View style={styles.routeBox}>
            <View style={styles.routeRow}>
              <View style={styles.pickupDot} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>PICKUP</Text>
                <Text style={styles.routeText} numberOfLines={1}>{booking?.pickup_address || booking?.pickup}</Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routeRow}>
              <View style={styles.dropSquare} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>DROP</Text>
                <Text style={styles.routeText} numberOfLines={1}>{booking?.destination_address || booking?.destination}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fare Summary for Completed Ride */}
        {isCompleted && (
          <View style={styles.fareCard}>
            <Text style={styles.fareTitle}>CASH FARE TO COLLECT</Text>
            <Text style={styles.fareAmount}>₹{booking?.fare_amount ?? booking?.estimated_fare ?? booking?.fare ?? '0'}</Text>
            <Text style={styles.paymentType}>💵 Collect Cash from Customer</Text>
          </View>
        )}

        {/* Primary Action Button */}
        <View style={styles.actionSection}>
          {isAccepted && (
            <Button
              title="Start Trip"
              size="lg"
              loading={loading}
              onPress={handleStartTrip}
            />
          )}

          {isInProgress && (
            <Button
              title="Complete Trip & Collect Fare"
              size="lg"
              loading={loading}
              onPress={handleCompleteTrip}
            />
          )}

          {isCompleted && (
            <Button
              title="Back to Dashboard"
              size="lg"
              onPress={handleFinish}
            />
          )}
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
  mapContainer: {
    height: 240,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    position: 'relative',
    ...shadows.sm,
  },
  liveMap: {
    flex: 1,
  },
  stageBanner: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  stageText: {
    color: colors.secondary,
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 14,
    ...shadows.sm,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerAvatar: {
    fontSize: 22,
  },
  customerMeta: {
    flex: 1,
  },
  customerName: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
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
    borderRadius: radii.pill,
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.successBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
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
    marginRight: 12,
  },
  dropSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  routeLine: {
    width: 1.5,
    height: 12,
    backgroundColor: colors.border,
    marginLeft: 3.2,
    marginVertical: -2,
  },
  routeTextContainer: {
    flex: 1,
  },
  routeLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  routeText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.medium,
    marginTop: 1,
  },
  fareCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    ...shadows.md,
  },
  fareTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 1,
  },
  fareAmount: {
    color: colors.white,
    fontSize: 40,
    fontFamily: fonts.bold,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: 6,
  },
  paymentType: {
    color: colors.secondary,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  actionSection: {
    marginTop: 8,
  },
});

export default DriverRideScreen;
