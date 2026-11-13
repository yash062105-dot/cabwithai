import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';

import {colors, fonts, radii, spacing, shadows} from '../../theme';
import {useRide} from '../../context/RideContext';
import {Ride} from '../../types/ride';
import {Badge, EmptyState, ScreenHeader} from '../../components';

interface RidesScreenProps {
  navigation: any;
}

const RidesScreen = ({navigation}: RidesScreenProps) => {
  const {ridesHistory, currentRide} = useRide();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>(
    'completed',
  );

  const allRides = currentRide ? [currentRide, ...ridesHistory] : ridesHistory;

  const filteredRides = allRides.filter(ride => {
    if (activeTab === 'upcoming') {
      return (
        ride.status === 'searching' ||
        ride.status === 'assigned' ||
        ride.status === 'arriving' ||
        ride.status === 'in_progress'
      );
    }
    if (activeTab === 'completed') {
      return ride.status === 'completed';
    }
    return ride.status === 'cancelled';
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <ScreenHeader title="Your Rides" />

      {/* Segmented Filter Control */}
      <View style={styles.tabContainer}>
        {(['upcoming', 'completed', 'cancelled'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {filteredRides.length === 0 ? (
          <EmptyState
            icon={activeTab === 'upcoming' ? '🚖' : activeTab === 'completed' ? '🏁' : '📋'}
            title={`No ${activeTab} rides`}
            subtitle={`Your ${activeTab} bookings and trip history will appear here.`}
            actionTitle={activeTab === 'upcoming' ? 'Book a Ride Now' : undefined}
            onAction={() => navigation.navigate('Home')}
          />
        ) : (
          filteredRides.map(ride => (
            <RideCard
              key={ride.id}
              ride={ride}
              onPress={() => {
                if (activeTab === 'upcoming') {
                  navigation.navigate('RideTracking');
                }
              }}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const RideCard = ({ride, onPress}: {ride: Ride; onPress: () => void}) => {
  const isCompleted = ride.status === 'completed';
  const isCancelled = ride.status === 'cancelled';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <View style={styles.cabBadge}>
          <Text style={styles.cabBadgeText}>{ride.cabType}</Text>
        </View>

        <Text style={styles.dateText}>
          {ride.date} • {ride.time}
        </Text>

        <Badge
          label={ride.status.toUpperCase()}
          variant={isCompleted ? 'success' : isCancelled ? 'danger' : 'warning'}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <View style={styles.pickupDot} />
          <Text style={styles.locationText} numberOfLines={1}>
            {ride.pickup}
          </Text>
        </View>

        <View style={styles.verticalLine} />

        <View style={styles.locationRow}>
          <View style={styles.dropSquare} />
          <Text style={styles.locationText} numberOfLines={1}>
            {ride.destination}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <View style={styles.driverInfoRow}>
          <Text style={styles.driverEmoji}>👨‍✈️</Text>
          <Text style={styles.driverText}>
            {ride.driver ? ride.driver.name : 'CAB Driver Partner'}
          </Text>
        </View>

        <Text style={styles.fareText}>₹{ride.fare}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  activeTab: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  activeTabText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cabBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  cabBadgeText: {
    color: colors.text,
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  locationContainer: {
    gap: 8,
  },
  locationRow: {
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
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginRight: 10,
  },
  verticalLine: {
    width: 1,
    height: 10,
    backgroundColor: colors.border,
    marginLeft: 3.5,
    marginVertical: -4,
  },
  locationText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverEmoji: {
    fontSize: 14,
  },
  driverText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  fareText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
});

export default RidesScreen;
