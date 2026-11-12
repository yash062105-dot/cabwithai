import React, {useState} from 'react';
import {Alert} from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import {colors, fonts, spacing} from '../../theme';
import Api from '../../config/Api';

interface ForgotPasswordScreenProps {
  navigation: any;
}

const ForgotPasswordScreen = ({
  navigation,
}: ForgotPasswordScreenProps) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      Alert.alert('Check your number', 'Enter a valid 10-digit mobile number.');
      return;
    }
    const normalizedPhone = `+91${digits}`;
    setLoading(true);
    try {
      const response = await Api.post('/auth/request-otp', {
        phone: normalizedPhone,
        purpose: 'login',
      });
      navigation.navigate('OTP', {
        phone: normalizedPhone,
        flow: 'login',
        devOtp: response.data.dev_otp,
      });
    } catch (error: any) {
      Alert.alert('Could not send OTP', error.response?.data?.detail || 'Check that the backend is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        // backgroundColor={colors.background}
      />

      <View style={styles.content}>
        {/* Back */}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>

        {/* Logo */}

        <Text style={styles.logo}>CAB</Text>

        {/* Header */}

        <Text style={styles.title}>
          Forgot Password?
        </Text>

        <Text style={styles.description}>
          Enter your registered mobile number and we'll
          send you a verification code.
        </Text>

        {/* Input */}

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

        {/* Button */}

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={handleContinue}>
          <Text style={styles.buttonText}>
            {loading ? 'Sending OTP...' : 'Continue with OTP'}
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
    paddingHorizontal: spacing.xl,
    paddingTop: 25,
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
    marginBottom: 28,
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
    marginBottom: 30,
  },

  title: {
    color: colors.text,
    fontSize: 28,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginBottom: 10,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.regular,
    marginBottom: 32,
  },

  label: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '600',
    marginBottom: 8,
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

  button: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
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

export default ForgotPasswordScreen;