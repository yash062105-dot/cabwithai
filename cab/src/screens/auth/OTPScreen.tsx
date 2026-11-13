import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';

import {colors, fonts, radii, spacing, shadows} from '../../theme';
import {Alert} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import Api from '../../config/Api';
import {Button, ScreenHeader} from '../../components';

interface OTPScreenProps {
  navigation: any;
  route: any;
}

const OTP_LENGTH = 6;

const OTPScreen = ({navigation, route}: OTPScreenProps) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
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

    if (numericValue && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
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
        response = await Api.post('/auth/login', {
          phone,
          otp: enteredOtp,
          role: route?.params?.role,
        });
      }
      await signIn(response.data.access_token, response.data.user);
    } catch (error: any) {
      Alert.alert(
        'Verification failed',
        error.response?.data?.detail || 'The OTP is invalid or expired. Request a new one and try again.',
      );
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
      <StatusBar barStyle="dark-content" />

      <ScreenHeader onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        
        <View style={styles.badgeContainer}>
          <Text style={styles.logo}>CAB</Text>
        </View>

        <Text style={styles.title}>Verify Your Number</Text>
        <Text style={styles.description}>
          We sent a 6-digit verification code to
        </Text>
        <Text style={styles.phone}>{phone || 'Your mobile number'}</Text>

        {/* OTP Input Boxes */}
        <View style={styles.cardContainer}>
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
                onChangeText={value => handleChange(value, index)}
                onKeyPress={event => handleKeyPress(event, index)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Resend Link */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
              <Text style={styles.resendButton}> Resend Code</Text>
            </TouchableOpacity>
          </View>

          <Button
            title={loading ? 'Verifying...' : 'Verify & Continue'}
            icon="→"
            size="lg"
            loading={loading}
            onPress={handleVerify}
            style={styles.verifyBtn}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
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
    marginBottom: 20,
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

  description: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
  },

  phone: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 26,
  },

  cardContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  otpInput: {
    width: 44,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    fontSize: 20,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.text,
  },

  otpInputActive: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },

  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  resendText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.regular,
  },

  resendButton: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  verifyBtn: {
    marginTop: 4,
  },
});

export default OTPScreen;
