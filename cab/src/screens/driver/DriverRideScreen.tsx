import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';

import {colors, fonts, radii, spacing, shadows} from '../../theme';
import Api from '../../config/Api';
import LiveMap from '../../components/LiveMap';
import {Button, ScreenHeader} from '../../components';

interface DriverRideScreenProps {
  navigation: any;
  route: any;
}

const DriverRideScreen = ({navigation, route}: DriverRideScreenProps) => {
  const bookingId = route?.params?.bookingId;
  const [booking, setBooking] = useState<Record<string, any> | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadBooking = async () => {
    if (!bookingId) return;
    try {
      const response = await Api.get(`/bookings/${bookingId}`);
      setBooking(response.data);
    } catch (error: any) {
      Alert.alert('Could not load booking', error.response?.data?.detail || 'Check your connection and try again.');
    }
  };

  useEffect(() => {
    loadBooking();
    const timer = setInterval(loadBooking, 5000);
    return () => clearInterval(timer);
  }, [bookingId]);

  const handleStartTrip = async () => {
    if (enteredOtp.length !== 4) {
      setOtpError(true);
      return;
    }
    setOtpError(false);
    setLoading(true);
    try {
      await Api.post(`/driver/bookings/${bookingId}/start`, {otp: enteredOtp});
      loadBooking();
    } catch (error: any) {
      setOtpError(true);
      Alert.alert('Start trip failed', error.response?.data?.detail || 'Enter the correct 4-digit customer OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTrip = async () => {
    setLoading(true);
    try {
      await Api.post(`/driver/bookings/${bookingId}/complete`);
      loadBooking();
    } catch (error: any) {
      Alert.alert('Complete trip failed', error.response?.data?.detail || 'Try again shortly.');
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

  const pickupCoords = booking?.pickup_latitude && booking?.pickup_longitude
    ? {latitude: booking.pickup_latitude, longitude: booking.pickup_longitude, label: booking.pickup}
    : null;
  const destCoords = booking?.destination_latitude && booking?.destination_longitude
    ? {latitude: booking.destination_latitude, longitude: booking.destination_longitude, label: booking.destination}
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
              <Text style={styles.customerName}>{booking?.user?.name || 'Rider'}</Text>
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
                <Text style={styles.routeText} numberOfLines={1}>{booking?.pickup}</Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routeRow}>
              <View style={styles.dropSquare} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>DROP</Text>
                <Text style={styles.routeText} numberOfLines={1}>{booking?.destination}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* OTP Verification Box for Pickup */}
        {isAccepted && (
          <View style={styles.otpBox}>
            <Text style={styles.otpTitle}>Customer Verification Code</Text>
            <Text style={styles.otpHint}>
              Ask customer for their 4-digit ride OTP to start trip
            </Text>
            <TextInput
              style={[styles.otpInput, otpError && styles.otpInputError]}
              placeholder="••••"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              value={enteredOtp}
              onChangeText={text => {
                setEnteredOtp(text);
                setOtpError(false);
              }}
            />
            {otpError && (
              <Text style={styles.errorText}>Invalid code. Check with customer.</Text>
            )}
          </View>
        )}

        {/* Fare Summary for Completed Ride */}
        {isCompleted && (
          <View style={styles.fareCard}>
            <Text style={styles.fareTitle}>CASH FARE TO COLLECT</Text>
            <Text style={styles.fareAmount}>₹{booking?.fare || '0'}</Text>
            <Text style={styles.paymentType}>💵 Collect Cash from Customer</Text>
          </View>
        )}

        {/* Primary Action Button */}
        <View style={styles.actionSection}>
          {isAccepted && (
            <Button
              title="Verify OTP & Start Trip"
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
  otpBox: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: 16,
    ...shadows.sm,
  },
  otpTitle: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  otpHint: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 3,
    marginBottom: 14,
    textAlign: 'center',
  },
  otpInput: {
    width: 160,
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
    backgroundColor: colors.surfaceSubtle,
    letterSpacing: 8,
  },
  otpInputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
    fontFamily: fonts.medium,
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
