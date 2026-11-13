import React, { useState } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';

import { colors, fonts, radii, spacing, shadows } from '../../theme';
import { UserRole } from '../../types/navigation';
import Api from '../../config/Api';
import { Button } from '../../components';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [role, setRole] = useState<UserRole>('user');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const rawDigits = phone.replace(/\D/g, '');
    const normalizedPhone = `+91${rawDigits}`;
    if (rawDigits.length !== 10) {
      Alert.alert('Check your number', 'Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const response = await Api.post('/auth/request-otp', { phone: normalizedPhone, purpose: 'login' });
      navigation.navigate('OTP', { phone: normalizedPhone, flow: 'login', role, devOtp: response.data.dev_otp });
    } catch (error: any) {
      Alert.alert('Could not send OTP', error.response?.data?.detail || 'Check that the backend is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logo}>CAB</Text>
          </View>

          <Text style={styles.welcome}>Welcome back 👋</Text>
          <Text style={styles.subtitle}>Log in to book a ride or manage your trips</Text>
        </View>

        {/* Role Toggle Switch */}
        <View style={styles.roleToggleContainer}>
          <TouchableOpacity
            style={[styles.roleTab, role === 'user' && styles.activeRoleTab]}
            onPress={() => setRole('user')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.roleTabText,
                role === 'user' && styles.activeRoleTabText,
              ]}
            >
              👤 Book a Cab
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, role === 'driver' && styles.activeRoleTab]}
            onPress={() => setRole('driver')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.roleTabText,
                role === 'driver' && styles.activeRoleTabText,
              ]}
            >
              🚗 Drive with CAB
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
        <View style={styles.cardContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>

            <View style={styles.inputContainer}>
              <View style={styles.countryCodeContainer}>
                <Text style={styles.flag}>🇮🇳</Text>
                <Text style={styles.countryCode}>+91</Text>
              </View>

              <View style={styles.verticalLine} />

              <TextInput
                style={styles.input}
                placeholder="Enter 10-digit number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.forgotText}>Trouble signing in?</Text>
          </TouchableOpacity>

          {/* Action Button */}
          <Button
            title={loading ? 'Sending OTP...' : 'Continue with OTP'}
            icon="→"
            size="lg"
            loading={loading}
            onPress={handleLogin}
          />
        </View>

        {/* Register Footer */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
          >
            <Text style={styles.registerLink}> Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 45,
    paddingBottom: 30,
    justifyContent: 'center',
  },

  header: {
    marginBottom: 28,
  },

  logoBadge: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.md,
    marginBottom: 24,
  },

  logo: {
    color: colors.secondary,
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '800',
    letterSpacing: 3,
  },

  welcome: {
    color: colors.text,
    fontSize: 30,
    fontFamily: fonts.bold,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: fonts.regular,
    lineHeight: 22,
  },

  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },

  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radii.sm,
  },

  activeRoleTab: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },

  roleTabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },

  activeRoleTabText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  cardContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },

  inputGroup: {
    marginBottom: 16,
  },

  label: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
    marginBottom: 8,
  },

  inputContainer: {
    height: 54,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  flag: {
    fontSize: 16,
    marginRight: 6,
  },

  countryCode: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.medium,
    fontWeight: '700',
  },

  verticalLine: {
    width: 1,
    height: 22,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },

  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.medium,
    paddingVertical: 0,
  },

  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },

  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },

  registerText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
  },

  registerLink: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});

export default LoginScreen;
