import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';

import {colors, fonts, radii, spacing, shadows} from '../../theme';
import {useAuth} from '../../context/AuthContext';
import Api from '../../config/Api';
import {watchLocation} from '../../services/location';
import {connectDriverSocket} from '../../services/driverSocket';
import type {Socket} from 'socket.io-client';
import {useIsFocused} from '@react-navigation/native';
import LiveMap from '../../components/LiveMap';
import {useLocation} from '../../context/LocationContext';
import {Badge, Button} from '../../components';

interface DriverHomeScreenProps {
  navigation: any;
}

const DriverHomeScreen = ({navigation}: DriverHomeScreenProps) => {
  const {driver, setDriverOnline, updateDriverProfile, logout} = useAuth();
  const {currentLocation} = useLocation();
  const isFocused = useIsFocused();
  const [incomingBooking, setIncomingBooking] = useState<Record<string, any> | null>(null);
  const [earnings, setEarnings] = useState(0);
  const [completedRides, setCompletedRides] = useState(0);
  const [lastLocation, setLastLocation] = useState(currentLocation);

  const loadBookings = async () => {
    try {
      const response = await Api.get('/driver/bookings');
      setIncomingBooking(
        response.data.find((booking: Record<string, any>) => booking.status === 'requested') || null,
      );
    } catch (error: any) {
      Alert.alert('Could not load requests', error.response?.data?.detail || 'Check your connection and try again.');
    }
  };

  useEffect(() => {
    loadBookings();
    Api.get('/driver/me')
      .then(response => {
        setDriverOnline(Boolean(response.data.online));
        updateDriverProfile({
          name: response.data.name,
          phone: response.data.phone || '',
          vehicleType: response.data.vehicle_type || '',
          vehicleModel: response.data.vehicle_model || '',
          vehicleNumber: response.data.vehicle_number || '',
          licenseNumber: response.data.license_number || '',
          totalTrips: response.data.completed_rides || 0,
        });
      })
      .catch((error: any) =>
        Alert.alert('Could not load driver profile', error.response?.data?.detail || 'Check your connection and try again.'),
      );
    Api.get('/driver/transactions')
      .then(response => {
        const rows = response.data as Record<string, any>[];
        const today = new Date().toDateString();
        const todayRows = rows.filter(
          item => item.created_at && new Date(item.created_at).toDateString() === today,
        );
        setEarnings(todayRows.reduce((sum, item) => sum + Number(item.amount || 0), 0));
        setCompletedRides(todayRows.length);
      })
      .catch((error: any) =>
        Alert.alert('Could not load earnings', error.response?.data?.detail || 'Check your connection and try again.'),
      );
    const timer = setInterval(loadBookings, 5000);
    return () => clearInterval(timer);
  }, [setDriverOnline, updateDriverProfile]);

  useEffect(() => {
    if (!driver.isOnline || !isFocused) return;
    let active = true;
    let socket: Socket | null = null;
    let sendLocation: ((coordinates: {latitude: number; longitude: number}) => void) | null = null;
    let latestCoordinates: {latitude: number; longitude: number} | null = null;
    const stopWatching = watchLocation(coordinates => {
      latestCoordinates = coordinates;
      setLastLocation(coordinates);
      sendLocation?.(coordinates);
    });

    connectDriverSocket(message => {
      if (active) console.warn('Driver location socket:', message);
    })
      .then(connection => {
        if (!active) {
          connection.socket.disconnect();
          return;
        }
        socket = connection.socket;
        sendLocation = connection.sendLocation;
        connection.socket.on('ride_request', loadBookings);
        if (latestCoordinates) connection.sendLocation(latestCoordinates);
      })
      .catch(error => {
        if (active) {
          Alert.alert(
            'Live location unavailable',
            error instanceof Error ? error.message : 'Could not connect to live location service.',
          );
        }
      });

    return () => {
      active = false;
      stopWatching();
      socket?.disconnect();
      sendLocation = null;
    };
  }, [driver.isOnline, isFocused]);

  useEffect(() => {
    setLastLocation(currentLocation);
  }, [currentLocation]);

  const handleAcceptRide = async () => {
    if (!incomingBooking) return;
    try {
      await Api.post(`/driver/bookings/${incomingBooking._id}/accept`);
      navigation.navigate('DriverRide', {bookingId: incomingBooking._id});
      setIncomingBooking(null);
    } catch (error: any) {
      Alert.alert('Could not accept ride', error.response?.data?.detail || 'The request may have expired.');
    }
  };

  const handleDeclineRide = async () => {
    if (!incomingBooking) return;
    try {
      await Api.post(`/driver/bookings/${incomingBooking._id}/reject`);
    } catch (error: any) {
      console.warn('Decline error:', error);
    }
    setIncomingBooking(null);
  };

  const toggleOnline = async () => {
    try {
      const response = await Api.patch('/driver/status', {online: !driver.isOnline});
      setDriverOnline(Boolean(response.data.online));
    } catch (error: any) {
      Alert.alert('Status change failed', error.response?.data?.detail || 'Try again shortly.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header with Status Pill */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greeting}>CAPTAIN DASHBOARD</Text>
          <Text style={styles.driverName}>{driver.name || 'Driver'}</Text>
        </View>

        <TouchableOpacity
          style={[styles.statusToggle, driver.isOnline ? styles.onlineToggle : styles.offlineToggle]}
          onPress={toggleOnline}
          activeOpacity={0.8}>
          <View style={[styles.statusPillDot, driver.isOnline ? styles.onlineDot : styles.offlineDot]} />
          <Text style={[styles.statusToggleText, driver.isOnline ? styles.onlineText : styles.offlineText]}>
            {driver.isOnline ? 'ONLINE' : 'GO ONLINE'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        
        {/* Earnings Highlight Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.summaryTitle}>TODAY'S CASH COLLECTED</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.indicatorDot} />
              <Text style={styles.indicatorText}>Live</Text>
            </View>
          </View>

          <Text style={styles.earningsValue}>₹{earnings}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{completedRides}</Text>
              <Text style={styles.statLabel}>TRIPS COMPLETED</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{driver.vehicleType || 'Mini'}</Text>
              <Text style={styles.statLabel}>CAB TYPE</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>★ 4.9</Text>
              <Text style={styles.statLabel}>RATING</Text>
            </View>
          </View>
        </View>

        {/* Live GPS Map Surface */}
        <View style={styles.mapContainer}>
          <LiveMap
            current={lastLocation}
            style={styles.liveMap}
          />
          <View style={styles.mapStatusBanner}>
            <View style={[styles.statusDot, {backgroundColor: driver.isOnline ? colors.success : colors.danger}]} />
            <Text style={styles.mapStatusText}>
              {driver.isOnline
                ? 'Ready to receive ride dispatch requests'
                : 'You are currently offline. Tap GO ONLINE to start receiving trips'}
            </Text>
          </View>
        </View>

        {/* Vehicle Quick Card */}
        <View style={styles.vehicleInfoCard}>
          <View style={styles.vehicleIconCircle}>
            <Text style={styles.vehicleIcon}>🚗</Text>
          </View>
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleModel}>{driver.vehicleModel || 'Registered Vehicle'}</Text>
            <Text style={styles.vehicleNumber}>{driver.vehicleNumber || 'Licence in verification'}</Text>
          </View>
          <Badge label="Active" variant="success" />
        </View>
      </ScrollView>

      {/* Incoming Ride Request Modal */}
      <Modal
        visible={Boolean(incomingBooking)}
        transparent
        animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>⚡ NEW TRIP REQUEST</Text>
              </View>
              <Text style={styles.requestFare}>₹{incomingBooking?.fare || '0'}</Text>
            </View>

            <View style={styles.riderRow}>
              <View style={styles.riderAvatarCircle}>
                <Text style={styles.riderAvatar}>👤</Text>
              </View>
              <View>
                <Text style={styles.riderName}>{incomingBooking?.user?.name || 'Rider'}</Text>
                <Text style={styles.riderMeta}>Payment: Cash in hand</Text>
              </View>
            </View>

            <View style={styles.routeBox}>
              <View style={styles.routeItem}>
                <View style={styles.pickupDot} />
                <Text style={styles.routeText} numberOfLines={1}>
                  {incomingBooking?.pickup}
                </Text>
              </View>

              <View style={styles.routeLine} />

              <View style={styles.routeItem}>
                <View style={styles.dropSquare} />
                <Text style={styles.routeText} numberOfLines={1}>
                  {incomingBooking?.destination}
                </Text>
              </View>
            </View>

            <View style={styles.requestActions}>
              <Button
                title="Decline"
                variant="outline"
                size="md"
                onPress={handleDeclineRide}
                style={styles.declineBtn}
                fullWidth={false}
              />
              <Button
                title="Accept Ride"
                variant="primary"
                size="md"
                onPress={handleAcceptRide}
                style={styles.acceptBtn}
                fullWidth={false}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 16,
    paddingBottom: 10,
  },

  headerTextContainer: {
    flex: 1,
  },

  greeting: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  driverName: {
    color: colors.text,
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },

  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    ...shadows.sm,
  },

  onlineToggle: {
    backgroundColor: colors.successLight,
    borderWidth: 1.5,
    borderColor: colors.successBorder,
  },

  offlineToggle: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },

  statusPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  onlineDot: {
    backgroundColor: colors.success,
  },

  offlineDot: {
    backgroundColor: colors.textMuted,
  },

  statusToggleText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  onlineText: {
    color: colors.success,
  },

  offlineText: {
    color: colors.textSecondary,
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 30,
  },

  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: 20,
    marginVertical: 12,
    ...shadows.md,
  },

  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
  },

  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },

  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginRight: 5,
  },

  indicatorText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: fonts.bold,
  },

  earningsValue: {
    color: colors.white,
    fontSize: 36,
    fontFamily: fonts.bold,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 6,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },

  statBox: {
    alignItems: 'center',
    flex: 1,
  },

  statNumber: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.bold,
  },

  statLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
    marginTop: 3,
  },

  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  mapContainer: {
    height: 220,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    position: 'relative',
    ...shadows.sm,
  },

  liveMap: {
    flex: 1,
  },

  mapStatusBanner: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  mapStatusText: {
    color: colors.text,
    fontSize: 11,
    fontFamily: fonts.medium,
    flex: 1,
  },

  vehicleInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },

  vehicleIconCircle: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  vehicleIcon: {
    fontSize: 20,
  },

  vehicleDetails: {
    flex: 1,
  },

  vehicleModel: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  vehicleNumber: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'flex-end',
  },

  requestCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingBottom: 36,
    ...shadows.lg,
  },

  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  newBadge: {
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },

  newBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: fonts.bold,
  },

  requestFare: {
    color: colors.text,
    fontSize: 26,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },

  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  riderAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  riderAvatar: {
    fontSize: 20,
  },

  riderName: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold,
  },

  riderMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.medium,
    marginTop: 2,
  },

  routeBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  routeItem: {
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
    height: 14,
    backgroundColor: colors.border,
    marginLeft: 3.2,
    marginVertical: 3,
  },

  routeText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.medium,
  },

  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },

  declineBtn: {
    flex: 1,
  },

  acceptBtn: {
    flex: 1.5,
  },
});

export default DriverHomeScreen;
