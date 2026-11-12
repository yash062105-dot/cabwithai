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

const DriverEarningsScreen = () => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [transactions, setTransactions] = useState<Record<string, any>[]>([]);

  useEffect(() => {
    Api.get('/driver/transactions')
      .then(response => setTransactions(response.data))
      .catch(error => Alert.alert('Could not load earnings', error.response?.data?.detail || 'Check your connection and try again.'));
  }, []);

  const now = new Date();
  const periodStart = period === 'today'
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
    : period === 'week'
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getFullYear(), now.getMonth(), 1);
  const periodTransactions = transactions.filter(item => new Date(item.created_at) >= periodStart);
  const currentData = {
    net: periodTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    rides: periodTransactions.length,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Earnings Overview</Text>
      </View>

      {/* Time Period Selector */}
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
              {item === 'today' ? "Today" : item === 'week' ? 'This Week' : 'This Month'}
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

          <View style={styles.thickDivider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.totalLabel}>Cash collected</Text>
            <Text style={styles.totalValue}>₹{currentData.net}</Text>
          </View>
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
  mainCard: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  mainLabel: {
    color: colors.secondary,
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 1,
  },
  mainAmount: {
    color: colors.white,
    fontSize: 38,
    fontFamily: fonts.bold,
    fontWeight: '800',
    marginVertical: 4,
  },
  ridesCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 6,
  },
  ridesCountText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold,
    marginTop: 14,
    marginBottom: 10,
  },
  breakdownCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  rowValue: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  feeValue: {
    color: colors.danger,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  incentiveValue: {
    color: colors.success,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  thickDivider: {
    height: 1.5,
    backgroundColor: colors.primary,
    marginVertical: 10,
  },
  totalLabel: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  totalValue: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
  payoutCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  payoutTitle: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  payoutDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
});

export default DriverEarningsScreen;
