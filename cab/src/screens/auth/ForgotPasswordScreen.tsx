import React, {useState} from 'react';
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

import {colors, fonts, radii, spacing, shadows} from '../../theme';
import Api from '../../config/Api';
import {Button, ScreenHeader} from '../../components';

interface ForgotPasswordScreenProps {
  navigation: any;
}

const ForgotPasswordScreen = ({navigation}: ForgotPasswordScreenProps) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    const rawDigits = phone.replace(/\D/g, '');
    if (rawDigits.length !== 10) {
      Alert.alert('Check your number', 'Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const normalizedPhone = `+91${rawDigits}`;
      const response = await Api.post('/auth/request-otp', {phone: normalizedPhone, purpose: 'reset'});
      navigation.navigate('ResetPassword', {phone: normalizedPhone, devOtp: response.data.dev_otp});
    } catch (error: any) {
      Alert.alert('Could not start reset', error.response?.data?.detail || 'Try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" />

      <ScreenHeader onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.badgeContainer}>
          <Text style={styles.logo}>CAB</Text>
        </View>

        <Text style={styles.title}>Account Recovery</Text>
        <Text style={styles.description}>
          Enter your registered mobile number. We'll send a one-time verification code to reset your account.
        </Text>

        <View style={styles.cardContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Registered Mobile Number</Text>
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
            title={loading ? 'Sending Code...' : 'Send Verification Code'}
            icon="→"
            size="lg"
            loading={loading}
            onPress={handleSendCode}
            style={styles.actionBtn}
          />
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Remembered your login?</Text>
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
    paddingTop: 10,
    paddingBottom: 30,
  },

  badgeContainer: {
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
    marginBottom: 8,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
    lineHeight: 22,
    marginBottom: 24,
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

export default ForgotPasswordScreen;
