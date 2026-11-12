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

import {colors, fonts, spacing} from '../../theme';
import Api from '../../config/Api';

interface DriverBookingsScreenProps {
  navigation: any;
}

const DriverBookingsScreen = ({navigation}: DriverBookingsScreenProps) => {
  const [bookings, setBookings] = useState<Record<string, any>[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>(
    'completed',
  );

  useEffect(() => {
    Api.get('/driver/bookings')
      .then(response => setBookings(response.data))
      .catch(error => Alert.alert('Could not load rides', error.response?.data?.detail || 'Check your connection and try again.'));
  }, []);

  const visibleBookings = bookings.filter(booking =>
    activeTab === 'upcoming'
      ? ['requested', 'accepted', 'in_progress'].includes(booking.status)
      : booking.status === 'completed',
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Driver Rides</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['upcoming', 'completed'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Rides
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {visibleBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🚕</Text>
            <Text style={styles.emptyTitle}>No {activeTab} rides</Text>
            <Text style={styles.emptySubtitle}>
              Stay Online on the home screen to get new ride requests.
            </Text>
          </View>
        ) : (
          visibleBookings.map(item => (
            <TouchableOpacity key={item._id} style={styles.card} activeOpacity={0.8} onPress={() => navigation.getParent()?.navigate('DriverRide', {bookingId: item._id})}>
              <View style={styles.cardHeader}>
                <Text style={styles.riderText}>👤 {item.rider_name || 'Passenger'}</Text>
                <Text style={styles.dateText}>{new Date(item.created_at).toLocaleString()}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.routeBox}>
                <Text style={styles.routeText} numberOfLines={1}>
                  📍 {item.pickup_address || 'Pickup location'}
                </Text>
                <Text style={styles.routeText} numberOfLines={1}>
                  🏁 {item.destination_address || 'Destination'}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>{item.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.fareText}>₹{item.fare_amount ?? item.estimated_fare}</Text>
              </View>
            </TouchableOpacity>
          ))
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riderText: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  routeBox: {
    gap: 6,
  },
  routeText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completedBadgeText: {
    color: colors.success,
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  fareText: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
});

export default DriverBookingsScreen;
