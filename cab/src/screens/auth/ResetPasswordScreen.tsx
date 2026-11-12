import React, {useState} from 'react';
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

interface ResetPasswordScreenProps {
  navigation: any;
  route: any;
}

const ResetPasswordScreen = ({
  navigation,
  route,
}: ResetPasswordScreenProps) => {
  const phone = route?.params?.phone || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const handleReset = () => {
    if (!password || !confirmPassword) {
      console.log('Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      console.log('Passwords do not match');
      return;
    }

    // API integration baad mein yahan hogi

    navigation.replace('Login');
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
        contentContainerStyle={styles.content}>

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
          Create New Password
        </Text>

        <Text style={styles.description}>
          Create a new password for your CAB account.
        </Text>

        {phone ? (
          <Text style={styles.phone}>
            +91 {phone}
          </Text>
        ) : null}

        {/* Password */}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            New Password
          </Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter new password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              onPress={() =>
                setShowPassword(prev => !prev)
              }
              activeOpacity={0.7}>
              <Text style={styles.showPassword}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Confirm Password
          </Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              onPress={() =>
                setShowConfirmPassword(prev => !prev)
              }
              activeOpacity={0.7}>
              <Text style={styles.showPassword}>
                {showConfirmPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Hint */}

        <View style={styles.hintContainer}>
          <Text style={styles.hintTitle}>
            Password should contain:
          </Text>

          <Text style={styles.hint}>
            • At least 8 characters
          </Text>

          <Text style={styles.hint}>
            • A combination of letters and numbers
          </Text>
        </View>

        {/* Button */}

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={handleReset}>
          <Text style={styles.buttonText}>
            Reset Password
          </Text>

          <Text style={styles.arrow}>
            →
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 25,
    paddingBottom: 35,
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
  },

  phone: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 32,
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

  hintContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 15,
    marginTop: 2,
    marginBottom: 25,
  },

  hintTitle: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginBottom: 6,
  },

  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 19,
  },

  button: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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

export default ResetPasswordScreen;