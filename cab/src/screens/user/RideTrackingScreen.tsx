import React, {useEffect} from 'react';
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

import {colors, fonts, radii, spacing, shadows} from '../../theme';
import {useRide} from '../../context/RideContext';
import LiveMap from '../../components/LiveMap';
import {connectBookingSocket} from '../../services/bookingSocket';
import type {Socket} from 'socket.io-client';
import {Button, ScreenHeader} from '../../components';

interface RideTrackingScreenProps {
  navigation: any;
  route: any;
}

const RideTrackingScreen = ({navigation, route}: RideTrackingScreenProps) => {
  const {currentRide, refreshBooking, finishCurrentRide, cancelCurrentRide} = useRide();
  const bookingId = route?.params?.rideId || currentRide?.id;

  useEffect(() => {
    if (!bookingId) return;
    let active = true;
    let socket: Socket | null = null;
    const refresh = () => {
      refreshBooking(bookingId).catch((error: Error) =>
        console.warn('Could not refresh ride status:', error),
      );
    };
    refresh();
    const timer = setInterval(refresh, 15_000);
    connectBookingSocket(
      bookingId,
      refresh,
      message => {
        if (active) console.warn('Ride update socket:', message);
      },
    )
      .then(connection => {
        if (active) socket = connection;
        else connection.disconnect();
      })
      .catch(error => {
        if (active) {
          Alert.alert(
            'Live ride updates unavailable',
            error instanceof Error ? error.message : 'Ride updates will refresh periodically.',
          );
        }
      });
    return () => {
      active = false;
      clearInterval(timer);
      socket?.emit('unwatch_booking', {booking_id: bookingId});
      socket?.disconnect();
    };
  }, [bookingId, refreshBooking]);

  if (!currentRide) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  const ride = currentRide;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'searching':
        return 'Searching for Nearby Driver...';
      case 'assigned':
        return 'Driver Assigned! En route to pickup.';
      case 'arriving':
        return 'Driver is arriving now.';
      case 'in_progress':
        return 'Trip in progress 🚗';
      case 'completed':
        return 'Ride Completed! Thank you for riding.';
      case 'cancelled':
        return 'Ride Cancelled.';
      default:
        return 'Processing Ride...';
    }
  };

  const handleNextStep = () => {
    if (ride.status === 'completed' || ride.status === 'cancelled') {
      finishCurrentRide();
      navigation.replace('Home');
    }
  };

  const handleCancel = async () => {
    await cancelCurrentRide();
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <ScreenHeader
        title={`Ride #${ride.id.slice(-6)}`}
        onBack={() => navigation.navigate('Home')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        
        {/* Live Map with ETA overlay */}
        <View style={styles.mapContainer}>
          <LiveMap
            pickup={ride.pickupCoordinates ? {...ride.pickupCoordinates, label: ride.pickup} : null}
            destination={ride.destinationCoordinates ? {...ride.destinationCoordinates, label: ride.destination} : null}
            driver={ride.driverLocation ? {...ride.driverLocation, label: ride.driver?.name || 'Driver'} : null}
            style={styles.liveMap}
          />

          <View style={styles.etaOverlay}>
            <Text style={styles.etaTitle}>DRIVER ETA</Text>
            <Text style={styles.etaTime}>
              {ride.predictedEtaSeconds != null &&
              Number.isFinite(ride.predictedEtaSeconds) &&
              ride.status !== 'in_progress'
                ? `${Math.ceil(ride.predictedEtaSeconds / 60)} min`
                : '—'}
            </Text>
          </View>
        </View>

        {/* Live Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View style={styles.livePulse} />
            <Text style={styles.statusText}>{getStatusText(ride.status)}</Text>
          </View>

          {/* Progress Timeline Dots */}
          <View style={styles.timelineRow}>
            {['searching', 'assigned', 'in_progress', 'completed'].map((stage, idx, arr) => {
              const stages = ['searching', 'assigned', 'in_progress', 'completed'];
              const currentIdx = stages.indexOf(ride.status);
              const isPassed = currentIdx >= idx;

              return (
                <React.Fragment key={stage}>
                  <View style={[styles.timelineDot, isPassed && styles.activeTimelineDot]} />
                  {idx < arr.length - 1 && (
                    <View style={[styles.timelineLine, currentIdx > idx && styles.activeTimelineLine]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Driver Profile Card */}
        {ride.driver && (
          <View style={styles.driverCard}>
            <View style={styles.driverHeader}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverEmoji}>👨‍✈️</Text>
              </View>

              <View style={styles.driverMeta}>
                <Text style={styles.driverName}>{ride.driver.name}</Text>
                <Text style={styles.driverRating}>★ 4.9 • Verified CAB Driver</Text>
              </View>

              <TouchableOpacity
                style={styles.callButton}
                activeOpacity={0.7}
                onPress={() => Alert.alert('Call Driver', `Calling ${ride.driver?.phone || 'Driver'}...`)}>
                <Text style={styles.callIcon}>📞</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.vehicleDivider} />

            <View style={styles.vehicleRow}>
              <View>
                <Text style={styles.vehicleLabel}>VEHICLE</Text>
                <Text style={styles.vehicleValue}>{ride.driver.vehicleModel || 'Cab Taxi'}</Text>
              </View>

              <View style={styles.plateContainer}>
                <Text style={styles.plateNumber}>
                  {ride.driver.vehicleNumber || 'IN TAXI'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Route Details Card */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.pickupDot} />
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeText} numberOfLines={1}>{ride.pickup}</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routeRow}>
            <View style={styles.dropSquare} />
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>DESTINATION</Text>
              <Text style={styles.routeText} numberOfLines={1}>{ride.destination}</Text>
            </View>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.actionsContainer}>
          {(ride.status === 'completed' || ride.status === 'cancelled') ? (
            <Button
              title="Return to Home"
              size="lg"
              onPress={handleNextStep}
            />
          ) : (
            <Button
              title="Cancel Booking"
              variant="outline"
              size="md"
              textStyle={{color: colors.danger}}
              style={{borderColor: colors.dangerBorder}}
              onPress={handleCancel}
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
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 14,
    position: 'relative',
    ...shadows.sm,
  },
  liveMap: {
    flex: 1,
  },
  etaOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  etaTitle: {
    color: colors.secondary,
    fontSize: 9,
    fontFamily: fonts.bold,
  },
  etaTime: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 14,
    ...shadows.sm,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  livePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    marginRight: 10,
  },
  statusText: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  activeTimelineDot: {
    backgroundColor: colors.primary,
  },
  timelineLine: {
    flex: 1,
    height: 3,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  activeTimelineLine: {
    backgroundColor: colors.primary,
  },
  driverCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    ...shadows.sm,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.secondaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverEmoji: {
    fontSize: 24,
  },
  driverMeta: {
    flex: 1,
  },
  driverName: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  driverRating: {
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
  vehicleDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  vehicleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  vehicleValue: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
    marginTop: 2,
  },
  plateContainer: {
    backgroundColor: colors.secondaryLight,
    borderWidth: 1,
    borderColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
  },
  plateNumber: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: fonts.bold,
    letterSpacing: 1,
  },
  routeCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    ...shadows.sm,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    marginRight: 12,
  },
  dropSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: colors.border,
    marginLeft: 4,
    marginVertical: 4,
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
  actionsContainer: {
    marginTop: 6,
  },
});

export default RideTrackingScreen;
