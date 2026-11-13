import React from 'react';
import {StatusBar, StyleSheet, Text, View} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {colors, fonts, radii, spacing, shadows} from '../../theme';
import {Button} from '../../components';

const AccountStatusScreen = () => {
  const {accountStatus, role, logout} = useAuth();
  const isBlocked = accountStatus === 'blocked';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.card}>
        <View style={[styles.iconCircle, isBlocked ? styles.blockedCircle : styles.pendingCircle]}>
          <Text style={styles.icon}>{isBlocked ? '🔒' : '⏳'}</Text>
        </View>

        <Text style={styles.title}>
          {isBlocked ? 'Account Blocked' : 'Awaiting Admin Approval'}
        </Text>

        <Text style={styles.message}>
          {isBlocked
            ? 'Your account is currently disabled. Please contact CAB support if you believe this is an error.'
            : role === 'driver'
            ? 'Your driver account details have been received and are pending document approval before you can start accepting rides.'
            : 'Your account is currently inactive. Contact CAB support to reactivate your access.'}
        </Text>

        <Button
          title="Sign Out"
          variant="outline"
          size="md"
          onPress={logout}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  blockedCircle: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1.5,
    borderColor: colors.dangerBorder,
  },
  pendingCircle: {
    backgroundColor: colors.warningLight,
    borderWidth: 1.5,
    borderColor: colors.warningBorder,
  },
  icon: {
    fontSize: 34,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontFamily: fonts.bold,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  button: {
    width: '100%',
  },
});

export default AccountStatusScreen;
