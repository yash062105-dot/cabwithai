import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';

import {colors, fonts, radii, spacing, shadows} from '../../theme';
import {UserRole} from '../../types/navigation';
import {Button} from '../../components';

interface RegisterSuccessScreenProps {
  navigation: any;
  route: any;
}

const RegisterSuccessScreen = ({
  navigation,
  route,
}: RegisterSuccessScreenProps) => {
  const role: UserRole = route?.params?.role || 'user';

  const handleContinue = () => {
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        <View style={styles.successCircle}>
          <Text style={styles.check}>✓</Text>
        </View>

        <Text style={styles.title}>Account Created!</Text>

        <Text style={styles.description}>
          Your CAB {role === 'driver' ? 'driver ' : ''}account is now active and ready.
          You can proceed to login and begin your journey.
        </Text>

        <View style={styles.cardInfo}>
          <Text style={styles.cardInfoTitle}>What's next?</Text>
          <Text style={styles.cardInfoText}>
            {role === 'driver'
              ? '• Log in with your phone number\n• Verify incoming booking requests\n• Track daily earnings on your dashboard'
              : '• Search pickup and destination\n• Select your preferred cab type\n• Track your ride in real-time'}
          </Text>
        </View>

        <Button
          title={role === 'driver' ? 'Continue to Driver Login' : 'Continue to User Login'}
          icon="→"
          size="lg"
          onPress={handleContinue}
          style={styles.actionBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.successLight,
    borderWidth: 2,
    borderColor: colors.successBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...shadows.sm,
  },

  check: {
    color: colors.success,
    fontSize: 46,
    fontWeight: '800',
  },

  title: {
    color: colors.text,
    fontSize: 28,
    fontFamily: fonts.bold,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 24,
  },

  cardInfo: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 28,
  },

  cardInfoTitle: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginBottom: 6,
  },

  cardInfoText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },

  actionBtn: {
    width: '100%',
  },
});

export default RegisterSuccessScreen;
