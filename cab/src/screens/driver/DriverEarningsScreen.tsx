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
import {EmptyState, ScreenHeader} from '../../components';

const DriverEarningsScreen = () => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [transactions, setTransactions] = useState<Record<string, any>[]>([]);

  useEffect(() => {
    Api.get('/driver/transactions')
      .then(response => setTransactions(response.data))
      .catch(error =>
        Alert.alert(
          'Could not load earnings',
          error.response?.data?.detail || 'Check your connection and try again.',
        ),
      );
  }, []);

  const now = new Date();
  const periodStart =
    period === 'today'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : period === 'week'
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getFullYear(), now.getMonth(), 1);
  const periodTransactions = transactions.filter(
    item => new Date(item.created_at) >= periodStart,
  );
  const currentData = {
    net: periodTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    rides: periodTransactions.length,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <ScreenHeader title="Earnings Overview" />

      {/* Time Period Filter Tab */}
      <View style={styles.tabContainer}>
        {(['today', 'week', 'month'] as const).map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.tab, period === item && styles.activeTab]}
            onPress={() => setPeriod(item)}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.tabText,
                period === item && styles.activeTabText,
              ]}>
              {item === 'today' ? 'Today' : item === 'week' ? 'This Week' : 'This Month'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        
        {/* Main Earnings Card */}
        <View style={styles.mainCard}>
          <Text style={styles.mainLabel}>CASH FARES RECORDED</Text>
          <Text style={styles.mainAmount}>₹{currentData.net}</Text>
          <View style={styles.ridesCountBadge}>
            <Text style={styles.ridesCountText}>🚕 {currentData.rides} Rides Completed</Text>
          </View>
        </View>

        {/* Breakdown Card */}
        <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <Text style={styles.rowLabel}>Completed ride earnings</Text>
            <Text style={styles.rowValue}>₹{currentData.net}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.totalLabel}>Total cash collected</Text>
            <Text style={styles.totalValue}>₹{currentData.net}</Text>
          </View>
        </View>

        {/* Activity Feed */}
        <Text style={styles.sectionTitle}>Recent Fare Trips</Text>
        {periodTransactions.length === 0 ? (
          <EmptyState
            icon="💵"
            title="No rides for this period"
            subtitle="Completed trips will show cash amounts earned."
          />
        ) : (
          <View style={styles.txnList}>
            {periodTransactions.map(txn => (
              <View key={txn._id} style={styles.txnItem}>
                <View style={styles.txnIconCircle}>
                  <Text style={styles.txnIcon}>🚕</Text>
                </View>
                <View style={styles.txnDetails}>
                  <Text style={styles.txnTitle}>Ride Completed</Text>
                  <Text style={styles.txnDate}>
                    {new Date(txn.created_at).toLocaleDateString()} •{' '}
                    {new Date(txn.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text style={styles.txnAmount}>+₹{txn.amount}</Text>
              </View>
            ))}
          </View>
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
  mainCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: 22,
    alignItems: 'center',
    marginVertical: 10,
    ...shadows.md,
  },
  mainLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 1,
  },
  mainAmount: {
    color: colors.white,
    fontSize: 40,
    fontFamily: fonts.bold,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: 6,
  },
  ridesCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
    marginTop: 4,
  },
  ridesCountText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 10,
  },
  breakdownCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  rowValue: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  totalLabel: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  totalValue: {
    color: colors.primary,
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
  txnList: {
    gap: 10,
  },
  txnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  txnIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txnIcon: {
    fontSize: 18,
  },
  txnDetails: {
    flex: 1,
  },
  txnTitle: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  txnDate: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  txnAmount: {
    color: colors.success,
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
});

export default DriverEarningsScreen;
