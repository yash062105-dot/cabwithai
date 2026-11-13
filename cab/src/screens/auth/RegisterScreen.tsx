import React, {useState} from 'react';
import {Alert} from 'react-native';
import {
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

import {colors, fonts, radii, spacing, shadows} from '../../theme';
import Api from '../../config/Api';
import {Button, ScreenHeader} from '../../components';

type UserRole = 'user' | 'driver';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen = ({navigation}: RegisterScreenProps) => {
  const [role, setRole] = useState<UserRole>('user');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const rawDigits = phone.replace(/\D/g, '');
    if (name.trim().length < 2 || rawDigits.length !== 10) {
      Alert.alert('Check your details', 'Enter your full name and a valid 10-digit mobile number.');
      return;
    }

    const normalizedPhone = `+91${rawDigits}`;

    // If registering as a driver, move to vehicle details step directly
    if (role === 'driver') {
      navigation.navigate('DriverDetails', {
        phone: normalizedPhone,
        name: name.trim(),
      });
      return;
    }

    setLoading(true);
    try {
      const response = await Api.post('/auth/request-otp', {phone: normalizedPhone, purpose: 'signup'});
      navigation.navigate('OTP', {
        phone: normalizedPhone,
        name: name.trim(),
        flow: 'register',
        role: 'user',
        devOtp: response.data.dev_otp,
      });
    } catch (error: any) {
      Alert.alert('Could not start registration', error.response?.data?.detail || 'Check that the backend is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}>
        
        {/* Navigation & Header */}
        <ScreenHeader
          onBack={() => navigation.goBack()}
          style={styles.header}
        />

        <View style={styles.introContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logo}>CAB</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join CAB and experience seamless cab rides</Text>
        </View>

        {/* Role Selection */}
        <Text style={styles.sectionTitle}>I want to</Text>
        <View style={styles.roleContainer}>
          {/* User Option */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              role === 'user' && styles.selectedRoleCard,
            ]}
            onPress={() => setRole('user')}
            activeOpacity={0.8}>
            <View
              style={[
                styles.roleIcon,
                role === 'user' && styles.selectedRoleIcon,
              ]}>
              <Text style={styles.roleEmoji}>👤</Text>
            </View>

            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>Book a Cab</Text>
              <Text style={styles.roleDescription}>I want to travel with comfort</Text>
            </View>

            <View
              style={[
                styles.radio,
                role === 'user' && styles.radioSelected,
              ]}>
              {role === 'user' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {/* Driver Option */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              role === 'driver' && styles.selectedRoleCard,
            ]}
            onPress={() => setRole('driver')}
            activeOpacity={0.8}>
            <View
              style={[
                styles.roleIcon,
                role === 'driver' && styles.selectedRoleIcon,
              ]}>
              <Text style={styles.roleEmoji}>🚗</Text>
            </View>

            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>Drive with CAB</Text>
              <Text style={styles.roleDescription}>I want to earn flexible income</Text>
            </View>

            <View
              style={[
                styles.radio,
                role === 'driver' && styles.radioSelected,
              ]}>
              {role === 'driver' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

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

          <Button
            title={loading ? 'Creating...' : role === 'driver' ? 'Continue with Vehicle Details' : 'Continue with OTP'}
            icon="→"
            size="lg"
            loading={loading}
            onPress={handleRegister}
            style={styles.actionBtn}
          />
        </View>

        {/* Footer Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}>
            <Text style={styles.loginLink}> Log In</Text>
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
    paddingBottom: 35,
  },

  header: {
    paddingHorizontal: 0,
    paddingTop: 12,
  },

  introContainer: {
    marginTop: 10,
    marginBottom: 24,
  },

  logoBadge: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.sm,
    marginBottom: 16,
  },

  logo: {
    color: colors.secondary,
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '800',
    letterSpacing: 2,
  },

  title: {
    color: colors.text,
    fontSize: 28,
    fontFamily: fonts.bold,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  roleContainer: {
    gap: 10,
    marginBottom: 20,
  },

  roleCard: {
    minHeight: 74,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    ...shadows.sm,
  },

  selectedRoleCard: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },

  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  selectedRoleIcon: {
    backgroundColor: colors.secondaryLight,
  },

  roleEmoji: {
    fontSize: 22,
  },

  roleContent: {
    flex: 1,
    marginLeft: 14,
  },

  roleTitle: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginBottom: 2,
  },

  roleDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.regular,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  radioSelected: {
    borderColor: colors.primary,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  formCard: {
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
    height: 52,
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
    height: 20,
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

  actionBtn: {
    marginTop: 8,
  },

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },

  loginText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
  },

  loginLink: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});

export default RegisterScreen;
