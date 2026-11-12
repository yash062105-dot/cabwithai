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

import {colors, fonts, spacing} from '../../theme';
import Api from '../../config/Api';

type UserRole = 'user' | 'driver';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen = ({navigation}: RegisterScreenProps) => {
  const [role, setRole] = useState<UserRole>('user');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleRegister = async () => {
  if (name.trim().length < 2 || phone.replace(/\D/g, '').length !== 10) {
    Alert.alert('Check your details', 'Enter your name and a valid 10-digit mobile number.');
    return;
  }
  try {
    const normalizedPhone = `+91${phone.replace(/\D/g, '')}`;
    const response = await Api.post('/auth/request-otp', {phone: normalizedPhone, purpose: 'signup'});
    navigation.navigate('OTP', {
      phone: normalizedPhone,
      name: name.trim(),
      flow: 'register',
      role,
      devOtp: response.data.dev_otp,
      ...(role === 'driver' ? {registrationStep: 'driver-details'} : {}),
    });
  } catch (error: any) {
    Alert.alert('Could not start registration', error.response?.data?.detail || 'Check that the backend is running and try again.');
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios' ? 'padding' : undefined
      }>
      
      <StatusBar
        barStyle="dark-content"
        // backgroundColor={colors.background}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}>

        {/* Header */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.logo}>CAB</Text>

          <Text style={styles.title}>
            Create Account
          </Text>

          <Text style={styles.subtitle}>
            Join CAB and start your journey
          </Text>
        </View>

        {/* Role Selection */}

        <Text style={styles.sectionTitle}>
          I want to
        </Text>

        <View style={styles.roleContainer}>

          {/* User */}

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
              <Text style={styles.roleEmoji}>
                👤
              </Text>
            </View>

            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>
                Book a Cab
              </Text>

              <Text style={styles.roleDescription}>
                I want to travel
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                role === 'user' && styles.radioSelected,
              ]}>
              {role === 'user' && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>

          {/* Driver */}

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
              <Text style={styles.roleEmoji}>
                🚗
              </Text>
            </View>

            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>
                Drive with CAB
              </Text>

              <Text style={styles.roleDescription}>
                I want to earn
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                role === 'driver' && styles.radioSelected,
              ]}>
              {role === 'driver' && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>

        </View>

        {/* Form */}

        <View style={styles.form}>

          {/* Full Name */}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Full Name
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Mobile */}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Mobile Number
            </Text>

            <View style={styles.phoneContainer}>
              <Text style={styles.countryCode}>
                +91
              </Text>

              <View style={styles.verticalLine} />

              <TextInput
                style={styles.phoneInput}
                placeholder="Enter mobile number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* Register */}

          <TouchableOpacity
            style={styles.registerButton}
            activeOpacity={0.8}
            onPress={() => {
              if (role === 'driver') {
                if (name.trim().length < 2 || phone.replace(/\D/g, '').length !== 10) {
                  Alert.alert('Check your details', 'Enter your name and a valid 10-digit mobile number.');
                  return;
                }
                navigation.navigate('DriverDetails', {
                  name: name.trim(),
                  phone: `+91${phone.replace(/\D/g, '')}`,
                });
                return;
              }
              handleRegister();
            }}>

            <Text style={styles.registerButtonText}>
              Create Account
            </Text>

            <Text style={styles.arrow}>
              →
            </Text>
          </TouchableOpacity>

          {/* Login */}

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Already have an account?
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}>
              <Text style={styles.loginLink}>
                {' '}Login
              </Text>
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
    paddingTop: 25,
    paddingBottom: 35,
  },

  header: {
    marginBottom: 25,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },

  backArrow: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 30,
    marginTop: -4,
  },

  logo: {
    color: colors.secondary,
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 22,
  },

  title: {
    color: colors.text,
    fontSize: 28,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginBottom: 7,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '600',
    marginBottom: 10,
  },

  roleContainer: {
    marginBottom: 25,
  },

  roleCard: {
    minHeight: 78,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 10,
  },

  selectedRoleCard: {
    borderColor: colors.secondary,
    borderWidth: 2,
  },

  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  selectedRoleIcon: {
    backgroundColor: '#FEF3C7',
  },

  roleEmoji: {
    fontSize: 23,
  },

  roleContent: {
    flex: 1,
    marginLeft: 12,
  },

  roleTitle: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginBottom: 3,
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
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  form: {
    width: '100%',
  },

  inputGroup: {
    marginBottom: 17,
  },

  label: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '600',
    marginBottom: 8,
  },

  input: {
    height: 56,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.regular,
  },

  phoneContainer: {
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

  phoneInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.regular,
    paddingVertical: 0,
  },

  passwordContainer: {
    height: 56,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
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

  registerButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  registerButtonText: {
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

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
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