import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import {colors, fonts, spacing} from '../../theme';
import {UserRole} from '../../types/navigation';

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
      <StatusBar
        barStyle="dark-content"
      />

      <View style={styles.content}>

        {/* Success Icon */}

        <View style={styles.successCircle}>
          <Text style={styles.check}>
            ✓
          </Text>
        </View>

        <Text style={styles.title}>
          Account Created!
        </Text>

        <Text style={styles.description}>
          Your CAB {role === 'driver' ? 'driver' : ''} account has been created successfully.
          You can now start using CAB.
        </Text>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={handleContinue}>
          <Text style={styles.buttonText}>
            Continue to {role === 'driver' ? 'Driver Dashboard' : 'CAB App'}
          </Text>

          <Text style={styles.arrow}>
            →
          </Text>
        </TouchableOpacity>

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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },

  check: {
    color: colors.success,
    fontSize: 52,
    fontWeight: '700',
  },

  title: {
    color: colors.text,
    fontSize: 28,
    fontFamily: fonts.bold,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },

  button: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 35,
  },

  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  arrow: {
    color: colors.secondary,
    fontSize: 22,
    marginLeft: 10,
  },
});

export default RegisterSuccessScreen;