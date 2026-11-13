import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';

import {colors, fonts, radii, spacing, shadows} from '../../theme';
import {useAuth} from '../../context/AuthContext';
import {Button, ScreenHeader} from '../../components';

const DriverProfileScreen = () => {
  const {driver, logout} = useAuth();
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <ScreenHeader title="Captain Profile" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        
        {/* Driver Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👨‍✈️</Text>
          </View>

          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driver.name || 'Driver Partner'}</Text>
            <Text style={styles.driverPhone}>
              {driver.phone ? `+91 ${driver.phone.replace('+91', '')}` : 'No phone linked'}
            </Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, {backgroundColor: driver.isOnline ? colors.success : colors.textMuted}]} />
              <Text style={styles.statusBadgeText}>
                {driver.isOnline ? 'Online & Available' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle & Licence Details */}
        <Text style={styles.sectionTitle}>Vehicle & Documents</Text>
        <View style={styles.detailsCard}>
          <DetailRow label="Vehicle Category" value={driver.vehicleType || 'Mini Cab'} />
          <View style={styles.divider} />
          <DetailRow label="Vehicle Model" value={driver.vehicleModel || 'Registered Vehicle'} />
          <View style={styles.divider} />
          <DetailRow label="Registration Plate" value={driver.vehicleNumber || 'Verified Number'} />
          <View style={styles.divider} />
          <DetailRow label="Licence Number" value={driver.licenseNumber || 'Active DL'} />
          <View style={styles.divider} />
          <DetailRow label="Lifetime Trips" value={`${driver.totalTrips || 0} Rides`} />
        </View>

       
        {/* Sign Out Button */}
        <Button
          title="Sign Out as Driver"
          variant="outline"
          size="md"
          textStyle={{color: colors.danger}}
          style={{borderColor: colors.dangerBorder, marginTop: 10}}
          onPress={logout}
        />
      </ScrollView>
    </View>
  );
};

const DetailRow = ({label, value}: {label: string; value: string}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginVertical: 12,
    ...shadows.sm,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
  driverPhone: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 10,
  },
  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  detailValue: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 8,
  },
 
});

export default DriverProfileScreen;
