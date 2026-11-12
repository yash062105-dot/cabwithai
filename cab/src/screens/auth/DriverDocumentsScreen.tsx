import React, {useState} from 'react';
import {Alert} from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';

import {colors, fonts, spacing} from '../../theme';
import Api from '../../config/Api';
import {useLocation} from '../../context/LocationContext';

interface DriverDocumentsScreenProps {
  navigation: any;
  route: any;
}

const DriverDocumentsScreen = ({
  navigation,
  route,
}: DriverDocumentsScreenProps) => {
  const {currentLocation} = useLocation();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!currentLocation) {
      Alert.alert('Location unavailable', 'Allow location access and try again.');
      return;
    }
    setLoading(true);
    try {
      const phone = route?.params?.phone || '';
      const response = await Api.post('/auth/request-otp', {phone, purpose: 'signup'});
      navigation.navigate('OTP', {
        phone,
        name: route?.params?.name,
        flow: 'register',
        role: 'driver',
        devOtp: response.data.dev_otp,
        driverRegistration: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          vehicle_type: route?.params?.vehicleType,
          vehicle_model: route?.params?.vehicleModel,
          vehicle_number: route?.params?.vehicleNumber,
          license_number: route?.params?.licenseNumber,
        },
      });
    } catch (error: any) {
      Alert.alert('Could not send OTP', error.response?.data?.detail || 'Check the backend connection and try again.');
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        {/* Header */}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
        </View>

        <Text style={styles.stepText}>
          Step 3 of 3
        </Text>

        <Text style={styles.title}>Verify Driver Details</Text>

        <Text style={styles.subtitle}>
          Confirm your driving licence and vehicle registration numbers. Your current GPS location will be used to set your initial driver location.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>✓</Text>
          <Text style={styles.infoText}>Vehicle: {route?.params?.vehicleModel} ({route?.params?.vehicleNumber})</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>✓</Text>
          <Text style={styles.infoText}>Driving licence: {route?.params?.licenseNumber}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ</Text>
          <Text style={styles.infoText}>This project stores the entered licence and vehicle numbers; it does not upload document images or perform manual verification.</Text>
        </View>

        {/* Continue */}

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={handleContinue}>

          <Text style={styles.buttonText}>
            {loading ? 'Sending OTP...' : 'Verify phone & register'}
          </Text>

          <Text style={styles.arrow}>
            →
          </Text>
        </TouchableOpacity>

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
    marginBottom: 22,
  },

  backArrow: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 30,
    marginTop: -4,
  },

  progressContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },

  progressActive: {
    height: 5,
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 5,
  },

  stepText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.medium,
    marginBottom: 18,
  },

  title: {
    color: colors.text,
    fontSize: 28,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginBottom: 8,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.regular,
    lineHeight: 21,
    marginBottom: 25,
  },

  documentCard: {
    minHeight: 88,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    marginBottom: 12,
  },

  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  documentEmoji: {
    fontSize: 21,
  },

  documentContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  documentTitle: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginBottom: 4,
  },

  documentDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.regular,
    lineHeight: 16,
  },

  uploadButton: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },

  uploadedButton: {
    backgroundColor: '#DCFCE7',
  },

  uploadText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  uploadedText: {
    color: colors.success,
  },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    marginBottom: 25,
  },

  infoIcon: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
  },

  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 18,
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

export default DriverDocumentsScreen;