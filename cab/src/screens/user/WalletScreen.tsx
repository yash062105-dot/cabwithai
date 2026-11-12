import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';

import {colors, fonts, spacing} from '../../theme';
import Api from '../../config/Api';

const WalletScreen = () => {
  const [transactions, setTransactions] = useState<Record<string, any>[]>([]);

  useEffect(() => {
    Api.get('/transactions/me')
      .then(response => setTransactions(response.data))
      .catch(error => Alert.alert('Could not load transactions', error.response?.data?.detail || 'Check your connection and try again.'));
  }, []);
  const totalPaid = transactions
    .filter(transaction => transaction.direction === 'debit')
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cash Ride History</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        
        {/* Payment Summary */}
        <View style={styles.cardsRow}>
          <View style={[styles.statCard, styles.balanceCard]}>
            <Text style={styles.statLabel}>CASH FARES RECORDED</Text>
            <Text style={styles.statValue}>₹{totalPaid}</Text>
          </View>

          <View style={[styles.statCard, styles.savingsCard]}>
            <Text style={styles.savingsLabel}>CASH RIDES</Text>
            <Text style={styles.savingsValue}>{transactions.length}</Text>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsBadgeText}>Ride history</Text>
            </View>
          </View>
        </View>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.txnList}>
          {transactions.map(txn => (
            <View key={txn._id} style={styles.txnCard}>
              <View
                style={[
                  styles.txnIconCircle,
                  txn.direction === 'credit'
                    ? styles.creditCircle
                    : styles.debitCircle,
                ]}>
                <Text style={styles.txnIcon}>
                  {txn.direction === 'credit' ? '↓' : '↑'}
                </Text>
              </View>

              <View style={styles.txnInfo}>
                <Text style={styles.txnTitle}>{txn.type === 'ride_payment' ? 'Ride payment' : 'Ride earning'}</Text>
                <Text style={styles.txnDate}>{new Date(txn.created_at).toLocaleString()}</Text>
              </View>

              <View style={styles.txnAmountContainer}>
                <Text
                  style={[
                    styles.txnAmount,
                      txn.direction === 'credit'
                      ? styles.creditAmount
                      : styles.debitAmount,
                  ]}>
                  {txn.direction === 'credit' ? '+' : '-'}₹{txn.amount}
                </Text>
              </View>
            </View>
          ))}
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
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 90,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  savingsCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  statValue: {
    color: colors.white,
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '800',
    marginTop: 4,
  },
  addMoneyButton: {
    marginTop: 12,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  addMoneyText: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  savingsLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  savingsValue: {
    color: colors.text,
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '800',
    marginTop: 4,
  },
  savingsBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.1)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  savingsBadgeText: {
    color: colors.text,
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  addBox: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  addTitle: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  currencySymbol: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.bold,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  submitAddButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitAddText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  quickChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickChipText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 12,
  },
  offerCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  offerTag: {
    color: colors.primary,
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  offerTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold,
    marginTop: 4,
  },
  offerDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  txnList: {
    gap: 10,
  },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txnIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creditCircle: {
    backgroundColor: '#DCFCE7',
  },
  debitCircle: {
    backgroundColor: '#FEE2E2',
  },
  txnIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  txnInfo: {
    flex: 1,
  },
  txnTitle: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  txnDate: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  txnAmountContainer: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  creditAmount: {
    color: colors.success,
  },
  debitAmount: {
    color: colors.danger,
  },
  badgeChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 9,
    fontFamily: fonts.bold,
  },
});

export default WalletScreen;
