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

import {colors, fonts, spacing} from '../../theme';
import {useAuth} from '../../context/AuthContext';
import Api from '../../config/Api';
import {watchLocation} from '../../services/location';
import {connectDriverSocket} from '../../services/driverSocket';
import type {Socket} from 'socket.io-client';
import {useIsFocused} from '@react-navigation/native';
import LiveMap from '../../components/LiveMap';
import {useLocation} from '../../context/LocationContext';

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
      setIncomingBooking(response.data.find((booking: Record<string, any>) => booking.status === 'requested') || null);
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

    connectDriverSocket(
      message => {
        if (active) console.warn('Driver location socket:', message);
      },
    )
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
      Alert.alert('Could not accept request', error.response?.data?.detail || 'Refresh and try again.');
      loadBookings();
    }
  };

  const handleDeclineRide = async () => {
    if (!incomingBooking) return;
    try {
      await Api.post(`/driver/bookings/${incomingBooking._id}/decline`);
      setIncomingBooking(null);
    } catch (error: any) {
      Alert.alert('Could not decline request', error.response?.data?.detail || 'Refresh and try again.');
    }
  };

  const handleAvailability = async () => {
    const nextAvailability = !driver.isOnline;
    try {
      await Api.patch('/driver/availability', null, {params: {available: nextAvailability}});
      setDriverOnline(nextAvailability);
    } catch (error: any) {
      Alert.alert('Availability unchanged', error.response?.data?.detail || 'Try again shortly.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Driver Dashboard</Text>
          <Text style={styles.driverName}>{driver.name}</Text>
        </View>

        {/* Online / Offline Switch */}
        <TouchableOpacity
          style={[
            styles.onlineToggle,
            driver.isOnline ? styles.onlineState : styles.offlineState,
          ]}
          onPress={handleAvailability}
          activeOpacity={0.8}>
          <View style={styles.toggleDot} />
          <Text style={styles.toggleText}>
            {driver.isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        
        {/* Today's Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Earnings</Text>
          <Text style={styles.earningsValue}>₹{earnings}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{completedRides}</Text>
              <Text style={styles.statLabel}>COMPLETED</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{driver.isOnline ? 'ON' : 'OFF'}</Text>
              <Text style={styles.statLabel}>AVAILABILITY</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{driver.totalTrips}</Text>
              <Text style={styles.statLabel}>TOTAL RIDES</Text>
            </View>
          </View>
        </View>

        {/* Map Area */}
        <View style={styles.mapContainer}>
          <LiveMap current={lastLocation} style={styles.liveMap} />
          <View style={styles.mapStatusBanner}>
            <View
              style={[
                styles.statusDot,
                {backgroundColor: driver.isOnline ? colors.success : colors.danger},
              ]}
            />
            <Text style={styles.mapStatusText}>
              {driver.isOnline
                ? 'Looking for nearby ride requests...'
                : 'You are Offline. Go Online to receive rides.'}
            </Text>
          </View>
        </View>

        {/* Driver Quick Mode Switch */}
        <TouchableOpacity
          style={styles.switchBanner}
          activeOpacity={0.8}
          onPress={logout}>
          <Text style={styles.switchText}>Sign out</Text>
          <Text style={styles.switchChevron}>›</Text>
        </TouchableOpacity>

        {/* Quick Recent Request Button */}
      </ScrollView>

      {/* Incoming Ride Request Modal */}
      <Modal
        visible={Boolean(incomingBooking && driver.isOnline)}
        transparent
        animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW RIDE REQUEST</Text>
              </View>

              <Text style={styles.requestFare}>₹{Math.round(incomingBooking?.estimated_fare || 0)}</Text>
            </View>

            <View style={styles.riderRow}>
              <Text style={styles.riderAvatar}>👤</Text>
              <View>
                <Text style={styles.riderName}>{incomingBooking?.rider_name || 'Passenger'}</Text>
                <Text style={styles.riderMeta}>{incomingBooking?.payment_method || 'Cash'} • {incomingBooking?.cab_type || 'Cab'}</Text>
              </View>
            </View>

            <View style={styles.routeBox}>
              <View style={styles.routeItem}>
                <View style={styles.pickupDot} />
                  <Text style={styles.routeText} numberOfLines={1}>
                  {incomingBooking?.pickup_address || 'Pickup location'}
                </Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeItem}>
                <View style={styles.dropSquare} />
                  <Text style={styles.routeText} numberOfLines={1}>
                  {incomingBooking?.destination_address || 'Destination'}
                </Text>
              </View>
            </View>

            <View style={styles.requestActions}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDeclineRide}
                activeOpacity={0.8}>
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAcceptRide}
                activeOpacity={0.8}>
                <Text style={styles.acceptText}>Accept Ride</Text>
              </TouchableOpacity>
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
    paddingTop: 18,
    paddingBottom: 12,
  },
  welcomeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  driverName: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  onlineState: {
    backgroundColor: colors.primary,
  },
  offlineState: {
    backgroundColor: colors.border,
  },
  toggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  toggleText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 90,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 18,
    marginVertical: 12,
  },
  summaryTitle: {
    color: colors.secondary,
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 1,
  },
  earningsValue: {
    color: colors.white,
    fontSize: 32,
    fontFamily: fonts.bold,
    fontWeight: '800',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
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
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  mapContainer: {
    height: 220,
    backgroundColor: '#E5E7EB',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  liveMap: {
    height: '100%',
  },
  mapStatusBanner: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  mapStatusText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: fonts.medium,
    flex: 1,
  },
  switchBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  switchText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  switchChevron: {
    color: colors.textSecondary,
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  requestCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  newBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  requestFare: {
    color: colors.text,
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  riderAvatar: {
    fontSize: 28,
    marginRight: 10,
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
  },
  routeBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
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
    height: 12,
    backgroundColor: colors.border,
    marginLeft: 3.5,
    marginVertical: 2,
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
  declineButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  acceptButton: {
    flex: 1.5,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});

export default DriverHomeScreen;
