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

import { colors, fonts, spacing } from '../../theme';
import { UserRole } from '../../types/navigation';
import Api from '../../config/Api';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [role, setRole] = useState<UserRole>('user');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const normalizedPhone = `+91${phone.replace(/\D/g, '')}`;
    if (phone.replace(/\D/g, '').length !== 10) {
      Alert.alert('Check your number', 'Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const response = await Api.post('/auth/request-otp', {phone: normalizedPhone, purpose: 'login'});
      navigation.navigate('OTP', {phone: normalizedPhone, flow: 'login', role, devOtp: response.data.dev_otp});
    } catch (error: any) {
      Alert.alert('Could not send OTP', error.response?.data?.detail || 'Check that the backend is running and try again.');
      console.error('Error sending OTP:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar
        barStyle="dark-content"
        // backgroundColor={colors.background}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}

        <View style={styles.header}>
          <Text style={styles.logo}>CAB</Text>

          <Text style={styles.welcome}>Welcome back 👋</Text>

          <Text style={styles.subtitle}>Login to continue your ride</Text>
        </View>

        {/* Role Toggle */}
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

        {/* Form */}

        <View style={styles.form}>
          {/* Phone */}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.countryCode}>+91</Text>

              <View style={styles.verticalLine} />

              <TextInput
                style={styles.input}
                placeholder="Enter mobile number"
                placeholderTextColor={colors.textSecondary}
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
            activeOpacity={0.7}>
            <Text style={styles.forgotText}>Trouble signing in?</Text>
          </TouchableOpacity>

          {/* Login Button */}

          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.8}
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>{loading ? 'Sending OTP...' : 'Continue with OTP'}</Text>

            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          {/* Register */}

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account?</Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}> Register</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 55,
    paddingBottom: 30,
  },

  header: {
    marginBottom: 42,
  },

  logo: {
    color: colors.secondary,
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    fontSize: 22,
    fontFamily: fonts.bold,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 35,
  },

  welcome: {
    color: colors.text,
    fontSize: 30,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginBottom: 8,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: fonts.regular,
  },

  form: {
    width: '100%',
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '600',
    marginBottom: 8,
  },

  inputContainer: {
    height: 56,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },

  countryCode: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.medium,
    fontWeight: '600',
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
    fontFamily: fonts.regular,
    paddingVertical: 0,
  },

  passwordInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.regular,
    paddingVertical: 0,
  },

  showPassword: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -5,
    marginBottom: 25,
  },

  forgotText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },

  loginButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  arrow: {
    color: colors.secondary,
    fontSize: 22,
    marginLeft: 10,
    marginTop: -2,
  },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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

  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 15,
    marginBottom: 20,
  },

  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },

  activeRoleTab: {
    backgroundColor: colors.primary,
  },

  roleTabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },

  activeRoleTabText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});

export default LoginScreen;
