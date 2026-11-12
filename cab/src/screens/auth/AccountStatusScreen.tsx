import React from 'react';
import {StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {colors, fonts, spacing} from '../../theme';

const AccountStatusScreen = () => {
  const {accountStatus, role, logout} = useAuth();
  const isBlocked = accountStatus === 'blocked';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.icon}>{isBlocked ? '🔒' : '⏳'}</Text>
      <Text style={styles.title}>
        {isBlocked ? 'Account blocked' : 'Account awaiting approval'}
      </Text>
      <Text style={styles.message}>
        {isBlocked
          ? 'Your account is currently blocked. Contact support if you think this is a mistake.'
          : role === 'driver'
          ? 'Your driver account is inactive and needs admin approval before you can go online or accept rides.'
          : 'Your account is inactive. Contact an administrator to reactivate it.'}
      </Text>
      <TouchableOpacity style={styles.button} onPress={logout} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Sign out</Text>
      </TouchableOpacity>
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
  icon: {
    fontSize: 44,
    marginBottom: 18,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: fonts.regular,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 26,
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
});

export default AccountStatusScreen;
