import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';

import {colors, fonts, spacing} from '../../theme';
import {useAuth} from '../../context/AuthContext';

const DriverProfileScreen = () => {
  const {driver, logout} = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Driver Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        
        {/* Driver Main Card */}
        <View style={styles.driverCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👨‍✈️</Text>
          </View>

          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <Text style={styles.driverRating}>
              ⭐ {driver.rating} Rating • {driver.totalTrips} Trips
            </Text>
            <Text style={styles.driverPhone}>+91 {driver.phone}</Text>
          </View>

          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>REGISTERED</Text>
          </View>
        </View>

        {/* Account action */}
        <TouchableOpacity
          style={styles.switchBanner}
          activeOpacity={0.85}
          onPress={logout}>
          <View style={styles.switchIconBox}>
            <Text style={styles.switchEmoji}>👤</Text>
          </View>
          <View style={styles.switchContent}>
            <Text style={styles.switchTitle}>Sign out</Text>
            <Text style={styles.switchSubtitle}>Return to account sign-in</Text>
          </View>
          <Text style={styles.switchChevron}>›</Text>
        </TouchableOpacity>

        {/* Vehicle Information */}
        <Text style={styles.sectionTitle}>Vehicle Details</Text>
        <View style={styles.infoGroup}>
          <InfoItem label="VEHICLE TYPE" value={driver.vehicleType} icon="🚗" />
          <View style={styles.divider} />
          <InfoItem label="VEHICLE MODEL" value={driver.vehicleModel} icon="🚘" />
          <View style={styles.divider} />
          <InfoItem label="VEHICLE NUMBER" value={driver.vehicleNumber} icon="🔢" />
          <View style={styles.divider} />
          <InfoItem label="LICENSE NUMBER" value={driver.licenseNumber} icon="🆔" />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const InfoItem = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 12,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
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
    fontSize: 17,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  driverRating: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  driverPhone: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 1,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    color: colors.success,
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  switchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  switchIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  switchEmoji: {
    fontSize: 22,
  },
  switchContent: {
    flex: 1,
  },
  switchTitle: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  switchSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  switchChevron: {
    color: colors.secondary,
    fontSize: 24,
    marginLeft: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 10,
  },
  infoGroup: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold,
    marginTop: 2,
  },
  docItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  docTitle: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  docBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  docBadgeText: {
    color: colors.success,
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 46,
  },
  logoutButton: {
    height: 52,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});

export default DriverProfileScreen;
