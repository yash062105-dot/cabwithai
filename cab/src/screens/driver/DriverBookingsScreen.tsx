import React, {useEffect, useState} from 'react';
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
import {Badge, EmptyState, ScreenHeader} from '../../components';

interface DriverBookingsScreenProps {
  navigation: any;
}

const DriverBookingsScreen = ({navigation}: DriverBookingsScreenProps) => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'past'>('incoming');
  const [bookings, setBookings] = useState<Record<string, any>[]>([]);

  useEffect(() => {
    Api.get('/driver/bookings')
      .then(response => setBookings(response.data))
      .catch(error =>
        Alert.alert(
          'Could not load bookings',
          error.response?.data?.detail || 'Check your connection and try again.',
        ),
      );
  }, []);

  const incomingList = bookings.filter(
    b => b.status === 'requested' || b.status === 'accepted' || b.status === 'in_progress',
  );
  const pastList = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
  const displayedList = activeTab === 'incoming' ? incomingList : pastList;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <ScreenHeader title="Assigned Bookings" />

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'incoming' && styles.activeTab]}
          onPress={() => setActiveTab('incoming')}
          activeOpacity={0.8}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'incoming' && styles.activeTabText,
            ]}>
            Active & Pending ({incomingList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
          activeOpacity={0.8}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'past' && styles.activeTabText,
            ]}>
            Completed History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {displayedList.length === 0 ? (
          <EmptyState
            icon={activeTab === 'incoming' ? '🚖' : '📋'}
            title={activeTab === 'incoming' ? 'No active bookings' : 'No trip history'}
            subtitle={
              activeTab === 'incoming'
                ? 'Make sure you are Online on the dashboard to receive requests.'
                : 'Your past completed trips will show here.'
            }
          />
        ) : (
          displayedList.map(booking => {
            const isCompleted = booking.status === 'completed';
            const isCancelled = booking.status === 'cancelled';
            const isActive = booking.status === 'accepted' || booking.status === 'in_progress';

            return (
              <TouchableOpacity
                key={booking._id}
                style={styles.card}
                activeOpacity={isActive ? 0.85 : 1}
                onPress={() => {
                  if (isActive) {
                    navigation.navigate('DriverRide', {bookingId: booking._id});
                  }
                }}>
                <View style={styles.cardHeader}>
                  <Text style={styles.bookingId}>TRIP #{booking._id.slice(-6)}</Text>
                  <Badge
                    label={booking.status.toUpperCase()}
                    variant={isCompleted ? 'success' : isCancelled ? 'danger' : 'warning'}
                  />
                </View>

                <View style={styles.riderRow}>
                  <Text style={styles.riderAvatar}>👤</Text>
                  <Text style={styles.riderName}>{booking.user?.name || 'Customer'}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.routeBox}>
                  <View style={styles.routeItem}>
                    <View style={styles.pickupDot} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {booking.pickup}
                    </Text>
                  </View>

                  <View style={styles.routeLine} />

                  <View style={styles.routeItem}>
                    <View style={styles.dropSquare} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {booking.destination}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>
                    {new Date(booking.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={styles.fareAmount}>₹{booking.fare}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingId: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  riderAvatar: {
    fontSize: 16,
  },
  riderName: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  routeBox: {
    gap: 8,
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
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginRight: 10,
  },
  routeLine: {
    width: 1.5,
    height: 10,
    backgroundColor: colors.border,
    marginLeft: 3.2,
    marginVertical: -4,
  },
  routeText: {
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
  dateText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  fareAmount: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
});

export default DriverBookingsScreen;
