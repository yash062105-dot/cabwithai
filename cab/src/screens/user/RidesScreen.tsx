import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';

import {colors, fonts, spacing} from '../../theme';
import {useRide} from '../../context/RideContext';
import {Ride} from '../../types/ride';

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
      return ride.status === 'searching' || ride.status === 'assigned' || ride.status === 'arriving' || ride.status === 'in_progress';
    }
    if (activeTab === 'completed') {
      return ride.status === 'completed';
    }
    return ride.status === 'cancelled';
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Rides</Text>
      </View>

      {/* Tabs */}
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
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🚕</Text>
            <Text style={styles.emptyTitle}>No {activeTab} rides</Text>
            <Text style={styles.emptySubtitle}>
              Your {activeTab} ride bookings will appear here.
            </Text>
          </View>
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
      activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.cabBadge}>
          <Text style={styles.cabBadgeText}>{ride.cabType}</Text>
        </View>

        <Text style={styles.dateText}>
          {ride.date} • {ride.time}
        </Text>

        <View
          style={[
            styles.statusTag,
            isCompleted
              ? styles.completedTag
              : isCancelled
              ? styles.cancelledTag
              : styles.upcomingTag,
          ]}>
          <Text
            style={[
              styles.statusTagText,
              isCompleted
                ? styles.completedTagText
                : isCancelled
                ? styles.cancelledTagText
                : styles.upcomingTagText,
            ]}>
            {ride.status.toUpperCase()}
          </Text>
        </View>
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
        {ride.driver ? (
          <Text style={styles.driverText}>👨‍✈️ {ride.driver.name}</Text>
        ) : (
          <Text style={styles.driverText}>CAB Service</Text>
        )}

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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  activeTabText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 90,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cabBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cabBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  completedTag: {
    backgroundColor: '#DCFCE7',
  },
  completedTagText: {
    color: colors.success,
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  cancelledTag: {
    backgroundColor: '#FEE2E2',
  },
  cancelledTagText: {
    color: colors.danger,
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  upcomingTag: {
    backgroundColor: '#FEF3C7',
  },
  upcomingTagText: {
    color: colors.primary,
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
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
