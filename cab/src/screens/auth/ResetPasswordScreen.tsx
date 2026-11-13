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

interface ResetPasswordScreenProps {
  navigation: any;
  route: any;
}

const ResetPasswordScreen = ({
  navigation,
  route,
}: ResetPasswordScreenProps) => {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const phone = route?.params?.phone || '';

  const handleReset = async () => {
    if (otp.length !== 6) {
      Alert.alert('Check OTP', 'Enter the complete 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'Create a password with at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Check that both password fields match.');
      return;
    }
    setLoading(true);
    try {
      await Api.post('/auth/reset-password', {
        phone,
        otp,
        password: newPassword,
      });
      Alert.alert('Password reset successfully', 'You can now log in with your new password.', [
        {text: 'Log In', onPress: () => navigation.replace('Login')},
      ]);
    } catch (error: any) {
      Alert.alert('Reset failed', error.response?.data?.detail || 'Verify your OTP and try again.');
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

        <Text style={styles.title}>Set New Password</Text>
        <Text style={styles.description}>
          Enter the verification code sent to {phone} and create a new password.
        </Text>

        <View style={styles.cardContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>6-Digit OTP</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit code"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 characters"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}>
                <Text style={styles.showPasswordText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          <Button
            title={loading ? 'Updating Password...' : 'Save & Continue to Login'}
            icon="→"
            size="lg"
            loading={loading}
            onPress={handleReset}
            style={styles.actionBtn}
          />
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
    paddingBottom: 35,
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

  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.medium,
    paddingVertical: 0,
  },

  showPasswordText: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: fonts.bold,
  },

  actionBtn: {
    marginTop: 8,
  },
});

export default ResetPasswordScreen;
