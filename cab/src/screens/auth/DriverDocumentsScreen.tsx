import React, {useState} from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';

import {colors, fonts, radii, spacing, shadows} from '../../theme';
import Api from '../../config/Api';
import {Button, ScreenHeader} from '../../components';

interface DriverDocumentsScreenProps {
  navigation: any;
  route: any;
}

const DriverDocumentsScreen = ({
  navigation,
  route,
}: DriverDocumentsScreenProps) => {
  const [rcUploaded, setRcUploaded] = useState(false);
  const [dlUploaded, setDlUploaded] = useState(false);
  const [insuranceUploaded, setInsuranceUploaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const phone = route?.params?.phone || '';
  const name = route?.params?.name || '';
  const vehicleType = route?.params?.vehicleType || '';
  const vehicleModel = route?.params?.vehicleModel || '';
  const vehicleNumber = route?.params?.vehicleNumber || '';
  const licenseNumber = route?.params?.licenseNumber || '';

  const handleUpload = (type: string) => {
    Alert.alert(
      'Document Added',
      `${type} has been saved for verification.`,
    );

    if (type === 'Registration Certificate') setRcUploaded(true);
    if (type === 'Driving Licence') setDlUploaded(true);
    if (type === 'Vehicle Insurance') setInsuranceUploaded(true);
  };

  const handleComplete = async () => {
    if (!rcUploaded || !dlUploaded || !insuranceUploaded) {
      Alert.alert(
        'Upload all documents',
        'Upload your RC, driving licence, and vehicle insurance to proceed.',
      );
      return;
    }
    setLoading(true);
    try {
      const response = await Api.post('/auth/request-otp', {phone, purpose: 'signup'});
      navigation.navigate('OTP', {
        phone,
        name,
        flow: 'register',
        role: 'driver',
        devOtp: response.data.dev_otp,
        driverRegistration: {
          vehicle_type: vehicleType,
          vehicle_model: vehicleModel,
          vehicle_number: vehicleNumber,
          license_number: licenseNumber,
          documents: {
            rc_uploaded: rcUploaded,
            dl_uploaded: dlUploaded,
            insurance_uploaded: insuranceUploaded,
          },
        },
      });
    } catch (error: any) {
      Alert.alert('Could not start driver verification', error.response?.data?.detail || 'Try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScreenHeader onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        
        {/* Progress Tracker */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
        </View>

        <Text style={styles.stepBadge}>STEP 3 OF 3</Text>
        <Text style={styles.title}>Document Verification</Text>
        <Text style={styles.subtitle}>
          Upload clear photos of your required transport documents
        </Text>

        {/* Document Cards */}
        <View style={styles.documentsList}>
          <DocumentItem
            title="Registration Certificate (RC)"
            desc="Front photo of vehicle registration card"
            icon="📄"
            uploaded={rcUploaded}
            onUpload={() => handleUpload('Registration Certificate')}
          />

          <DocumentItem
            title="Driving Licence (Commercial/Private)"
            desc="Valid licence matching your full name"
            icon="🪪"
            uploaded={dlUploaded}
            onUpload={() => handleUpload('Driving Licence')}
          />

          <DocumentItem
            title="Vehicle Insurance"
            desc="Active comprehensive or commercial policy"
            icon="🛡️"
            uploaded={insuranceUploaded}
            onUpload={() => handleUpload('Vehicle Insurance')}
          />
        </View>

        {/* Security Note */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>🔒</Text>
          <Text style={styles.infoText}>
            Your documents are securely encrypted and used strictly for driver safety checks.
          </Text>
        </View>

        <Button
          title={loading ? 'Submitting...' : 'Submit & Verify with OTP'}
          icon="→"
          size="lg"
          loading={loading}
          onPress={handleComplete}
        />
      </ScrollView>
    </View>
  );
};

interface DocumentItemProps {
  title: string;
  desc: string;
  icon: string;
  uploaded: boolean;
  onUpload: () => void;
}

const DocumentItem = ({title, desc, icon, uploaded, onUpload}: DocumentItemProps) => {
  return (
    <View style={styles.documentCard}>
      <View style={[styles.docIconCircle, uploaded && styles.docIconCircleUploaded]}>
        <Text style={styles.docEmoji}>{icon}</Text>
      </View>

      <View style={styles.docContent}>
        <Text style={styles.docTitle}>{title}</Text>
        <Text style={styles.docDesc}>{desc}</Text>
      </View>

      <TouchableOpacity
        style={[styles.uploadButton, uploaded && styles.uploadedButton]}
        onPress={onUpload}
        activeOpacity={0.8}>
        <Text style={[styles.uploadText, uploaded && styles.uploadedText]}>
          {uploaded ? '✓ Added' : '+ Add'}
        </Text>
      </TouchableOpacity>
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
    paddingBottom: 40,
  },

  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },

  progressBar: {
    height: 4,
    flex: 1,
    borderRadius: radii.pill,
  },

  progressActive: {
    backgroundColor: colors.primary,
  },

  stepBadge: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
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
    marginBottom: 24,
  },

  documentsList: {
    gap: 12,
    marginBottom: 20,
  },

  documentCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },

  docIconCircle: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  docIconCircleUploaded: {
    backgroundColor: colors.successLight,
  },

  docEmoji: {
    fontSize: 22,
  },

  docContent: {
    flex: 1,
    marginRight: 10,
  },

  docTitle: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  docDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 3,
  },

  uploadButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },

  uploadedButton: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.successBorder,
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
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },

  infoIcon: {
    fontSize: 16,
    marginRight: 10,
  },

  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
});

export default DriverDocumentsScreen;
