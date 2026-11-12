import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

import {colors, fonts, spacing} from '../../theme';
import {useRide} from '../../context/RideContext';
import LiveMap from '../../components/LiveMap';

interface RideTrackingScreenProps {
  navigation: any;
  route: any;
}

const RideTrackingScreen = ({navigation, route}: RideTrackingScreenProps) => {
  const {currentRide, refreshBooking, finishCurrentRide, cancelCurrentRide} = useRide();
  const bookingId = route?.params?.rideId || currentRide?.id;

  useEffect(() => {
    if (!bookingId) return;
    refreshBooking(bookingId).catch(() => undefined);
    const timer = setInterval(() => refreshBooking(bookingId).catch(() => undefined), 5000);
    return () => clearInterval(timer);
  }, [bookingId, refreshBooking]);

  if (!currentRide) {
    return <View style={[styles.container, styles.loading]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }
  const ride = currentRide;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'searching':
        return 'Searching for Nearby Driver...';
      case 'assigned':
        return 'Driver Assigned! En route to pickup.';
      case 'arriving':
        return 'Driver is arriving.';
      case 'in_progress':
        return 'On the way to destination 🚗';
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

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride #{ride.id}</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        {/* Map Container */}
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

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View style={styles.livePulse} />
            <Text style={styles.statusText}>{getStatusText(ride.status)}</Text>
          </View>

          {/* Progress Timeline Dots */}
          <View style={styles.timelineRow}>
            {(['searching', 'assigned', 'arriving', 'in_progress', 'completed'] as const).map(
              (step, idx) => {
                const isPassed =
                  ['searching', 'assigned', 'arriving', 'in_progress', 'completed'].indexOf(
                    ride.status,
                  ) >= idx;
                return (
                  <React.Fragment key={step}>
                    <View
                      style={[
                        styles.timelineDot,
                        isPassed && styles.activeTimelineDot,
                      ]}
                    />
                    {idx < 4 && (
                      <View
                        style={[
                          styles.timelineLine,
                          isPassed && styles.activeTimelineLine,
                        ]}
                      />
                    )}
                  </React.Fragment>
                );
              },
            )}
          </View>
        </View>

        {/* Driver Card */}
        {ride.driver && (
          <View style={styles.driverCard}>
            <View style={styles.driverHeader}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverEmoji}>👤</Text>
              </View>

              <View style={styles.driverMeta}>
                <Text style={styles.driverName}>{ride.driver.name}</Text>
              </View>

              <TouchableOpacity
                style={styles.callButton}
                activeOpacity={0.8}
                onPress={() => console.log('Call driver:', ride.driver?.phone)}>
                <Text style={styles.callIcon}>📞</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.vehicleDivider} />

            <View style={styles.vehicleRow}>
              <View>
                <Text style={styles.vehicleLabel}>CAB MODEL</Text>
                <Text style={styles.vehicleValue}>{ride.driver.vehicleModel}</Text>
              </View>

              <View style={styles.plateContainer}>
                <Text style={styles.plateNumber}>{ride.driver.vehicleNumber}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Route Details Card */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.pickupDot} />
            <View>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeText}>{ride.pickup}</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routeRow}>
            <View style={styles.dropSquare} />
            <View>
              <Text style={styles.routeLabel}>DESTINATION</Text>
              <Text style={styles.routeText}>{ride.destination}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Controls */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.simButton}
          activeOpacity={0.8}
          onPress={handleNextStep}>
          <Text style={styles.simButtonText}>
            {ride.status === 'completed'
              ? 'Back to Home'
              : 'Waiting for driver update'}
          </Text>
        </TouchableOpacity>

          {ride.status !== 'completed' && ride.status !== 'cancelled' && (
          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.7}
            onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel Ride</Text>
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
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 140,
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
    transform: [{rotate: '-5deg'}],
  },
  mapRoadVertical: {
    position: 'absolute',
    left: 120,
    top: -20,
    bottom: -20,
    width: 22,
    backgroundColor: '#FFFFFF',
    transform: [{rotate: '15deg'}],
  },
  driverPin: {
    position: 'absolute',
    top: 60,
    left: 100,
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
  userPin: {
    position: 'absolute',
    top: 130,
    right: 80,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userPinInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  etaOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
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
    paddingHorizontal: 10,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverEmoji: {
    fontSize: 26,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    fontSize: 20,
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
    fontSize: 9,
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
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  plateNumber: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: fonts.bold,
    letterSpacing: 1,
  },
  routeCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.xl,
    gap: 10,
  },
  simButton: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  cancelButton: {
    height: 44,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: colors.danger,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
});

export default RideTrackingScreen;
