import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';

import {colors, fonts, radii, spacing, shadows} from '../../theme';
import Api from '../../config/Api';
import {EmptyState, ScreenHeader} from '../../components';

const WalletScreen = () => {
  const [transactions, setTransactions] = useState<Record<string, any>[]>([]);

  useEffect(() => {
    Api.get('/transactions/me')
      .then(response => setTransactions(response.data))
      .catch(error =>
        Alert.alert(
          'Could not load transactions',
          error.response?.data?.detail || 'Check your connection and try again.',
        ),
      );
  }, []);

  const totalPaid = transactions
    .filter(transaction => transaction.direction === 'debit')
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <ScreenHeader title="Cash Ride History" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        
        {/* Metric Cards */}
        <View style={styles.cardsRow}>
          <View style={[styles.statCard, styles.balanceCard]}>
            <Text style={styles.statLabel}>CASH FARES PAID</Text>
            <Text style={styles.statValue}>₹{totalPaid}</Text>
            <Text style={styles.statSub}>Total paid to drivers</Text>
          </View>

          <View style={[styles.statCard, styles.ridesCard]}>
            <Text style={styles.ridesLabel}>RECORDED TRIPS</Text>
            <Text style={styles.ridesValue}>{transactions.length}</Text>
            <View style={styles.ridesBadge}>
              <Text style={styles.ridesBadgeText}>Verified Fares</Text>
            </View>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.cashNoticeCard}>
          <Text style={styles.cashNoticeIcon}>💵</Text>
          <View style={styles.cashNoticeTextContainer}>
            <Text style={styles.cashNoticeTitle}>Cash Payment Model</Text>
            <Text style={styles.cashNoticeSubtitle}>
              All trip payments are made in hand directly to your driver upon reaching the destination.
            </Text>
          </View>
        </View>

        {/* Transaction History List */}
        <Text style={styles.sectionTitle}>Recent Fare Records</Text>

        {transactions.length === 0 ? (
          <EmptyState
            icon="💳"
            title="No transactions yet"
            subtitle="Completed cash ride fares will appear in this ledger."
          />
        ) : (
          <View style={styles.txnList}>
            {transactions.map(txn => {
              const isCredit = txn.direction === 'credit';
              return (
                <View key={txn._id} style={styles.txnCard}>
                  <View
                    style={[
                      styles.txnIconCircle,
                      isCredit ? styles.creditCircle : styles.debitCircle,
                    ]}>
                    <Text style={[styles.txnIcon, isCredit ? styles.creditIcon : styles.debitIcon]}>
                      {isCredit ? '↓' : '↑'}
                    </Text>
                  </View>

                  <View style={styles.txnInfo}>
                    <Text style={styles.txnTitle}>
                      {txn.type === 'ride_payment' ? 'Cab Fare Payment' : 'Ride Settlement'}
                    </Text>
                    <Text style={styles.txnDate}>
                      {new Date(txn.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      •{' '}
                      {new Date(txn.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  <View style={styles.txnAmountContainer}>
                    <Text
                      style={[
                        styles.txnAmount,
                        isCredit ? styles.creditAmount : styles.debitAmount,
                      ]}>
                      {isCredit ? '+' : '-'}₹{txn.amount}
                    </Text>
                    <Text style={styles.paymentMethodLabel}>Cash</Text>
                  </View>
                </View>
              );
            })}
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
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1,
    ...shadows.sm,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ridesCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  statValue: {
    color: colors.white,
    fontSize: 26,
    fontFamily: fonts.bold,
    fontWeight: '800',
    marginTop: 6,
  },
  statSub: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginTop: 4,
  },
  ridesLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  ridesValue: {
    color: colors.text,
    fontSize: 26,
    fontFamily: fonts.bold,
    fontWeight: '800',
    marginTop: 6,
  },
  ridesBadge: {
    marginTop: 6,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingVertical: 3,
    paddingHorizontal: 7,
    alignSelf: 'flex-start',
  },
  ridesBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  cashNoticeCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 12,
    alignItems: 'center',
    ...shadows.sm,
  },
  cashNoticeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cashNoticeTextContainer: {
    flex: 1,
  },
  cashNoticeTitle: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  cashNoticeSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
    lineHeight: 17,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 12,
  },
  txnList: {
    gap: 10,
  },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  txnIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creditCircle: {
    backgroundColor: colors.successLight,
  },
  debitCircle: {
    backgroundColor: colors.surface,
  },
  txnIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  creditIcon: {
    color: colors.success,
  },
  debitIcon: {
    color: colors.primary,
  },
  txnInfo: {
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
    marginTop: 3,
  },
  txnAmountContainer: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
  creditAmount: {
    color: colors.success,
  },
  debitAmount: {
    color: colors.text,
  },
  paymentMethodLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
});

export default WalletScreen;
