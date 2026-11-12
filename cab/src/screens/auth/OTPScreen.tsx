import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import {colors, fonts, spacing} from '../../theme';
import {Alert} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import Api from '../../config/Api';

interface OTPScreenProps {
  navigation: any;
  route: any;
}

const OTP_LENGTH = 6;

const OTPScreen = ({navigation, route}: OTPScreenProps) => {
  const [otp, setOtp] = useState<string[]>([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);

  const inputRefs = useRef<Array<any>>([]);
  const {signIn} = useAuth();
  const [loading, setLoading] = useState(false);

  const phone = route?.params?.phone || '';
  const flow = route?.params?.flow || 'login';

  const handleChange = (value: string, index: number) => {
    const numericValue = value.replace(/[^0-9]/g, '');

    if (!numericValue) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = numericValue.charAt(0);
    setOtp(newOtp);

    if (
      numericValue &&
      index < OTP_LENGTH - 1
    ) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    event: any,
    index: number,
  ) => {
    if (
      event.nativeEvent.key === 'Backspace' &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== OTP_LENGTH) {
      Alert.alert('Enter your OTP', 'Fill in all six digits to continue.');
      return;
    }
    setLoading(true);
    try {
      let response;
      if (flow === 'register') {
        const registration = route?.params?.driverRegistration;
        response = registration
          ? await Api.post('/auth/driver-signup', {
              ...registration,
              name: route?.params?.name,
              phone,
              otp: enteredOtp,
            })
          : await Api.post('/auth/signup', {
              name: route?.params?.name,
              phone,
              otp: enteredOtp,
            });
      } else {
        response = await Api.post('/auth/login', {phone, otp: enteredOtp});
      }
      await signIn(response.data.access_token, response.data.user);
    } catch (error: any) {
      Alert.alert('Verification failed', error.response?.data?.detail || 'The OTP is invalid or expired. Request a new one and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const purpose = flow === 'register' ? 'signup' : 'login';
      const response = await Api.post('/auth/request-otp', {phone, purpose});
      Alert.alert('OTP requested', response.data.dev_otp ? `Local testing OTP: ${response.data.dev_otp}` : response.data.message);
    } catch (error: any) {
      Alert.alert('Could not resend OTP', error.response?.data?.detail || 'Try again shortly.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
      />

      <View style={styles.content}>
        {/* Back */}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>

        {/* Header */}

        <Text style={styles.logo}>CAB</Text>

        <Text style={styles.title}>
          Verify Your Number
        </Text>

        <Text style={styles.description}>
          We've sent a 6-digit verification code to
        </Text>

        <Text style={styles.phone}>
          {phone}
        </Text>

        {/* OTP */}

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref: any) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                digit !== '' && styles.otpInputActive,
              ]}
              value={digit}
              onChangeText={value =>
                handleChange(value, index)
              }
              onKeyPress={event =>
                handleKeyPress(event, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Resend */}

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            Didn't receive the code?
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleResend}>
            <Text style={styles.resendLink}>
              {' '}Resend
            </Text>
          </TouchableOpacity>
        </View>

        {/* Verify */}

        <TouchableOpacity
          style={styles.verifyButton}
          activeOpacity={0.8}
          onPress={handleVerify}>
          <Text style={styles.verifyText}>
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </Text>

          <Text style={styles.arrow}>
            →
          </Text>
        </TouchableOpacity>

        {/* Testing hint */}

        <Text style={styles.testText}>
          {route?.params?.devOtp ? `Local testing OTP: ${route.params.devOtp}` : 'Enter the code sent to your phone.'}
        </Text>
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
    fontFamily: fonts.regular,
    lineHeight: 21,
  },

  phone: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginTop: 4,
  },

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 35,
    marginBottom: 22,
  },

  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    color: colors.text,
    fontSize: 20,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  otpInputActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },

  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },

  resendText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
  },

  resendLink: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  verifyButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 35,
  },

  verifyText: {
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

  testText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: fonts.regular,
  },
});

export default OTPScreen;