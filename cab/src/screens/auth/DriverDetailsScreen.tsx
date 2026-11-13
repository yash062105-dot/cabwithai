import React, {useState} from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';

import {colors, fonts, radii, spacing, shadows} from '../../theme';
import {Button, ScreenHeader} from '../../components';

type VehicleType = 'Mini' | 'Sedan' | 'SUV' | 'Auto';

interface DriverDetailsScreenProps {
  navigation: any;
  route: any;
}

const DriverDetailsScreen = ({
  navigation,
  route,
}: DriverDetailsScreenProps) => {
  const [vehicleType, setVehicleType] = useState<VehicleType>('Mini');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const phone = route?.params?.phone || '';
  const name = route?.params?.name || '';

  const handleContinue = () => {
    if (vehicleModel.trim().length < 2 || vehicleNumber.trim().length < 4 || licenseNumber.trim().length < 4) {
      Alert.alert('Complete vehicle details', 'Enter the vehicle model, registration number, and driving licence number.');
      return;
    }
    navigation.navigate('DriverDocuments', {
      phone,
      name,
      vehicleType,
      vehicleModel,
      vehicleNumber,
      licenseNumber,
    });
  };

  const vehicleTypes: {type: VehicleType; icon: string; desc: string}[] = [
    {type: 'Mini', icon: '🚗', desc: 'Compact'},
    {type: 'Sedan', icon: '🚙', desc: 'Comfort'},
    {type: 'SUV', icon: '🚐', desc: 'Spacious'},
    {type: 'Auto', icon: '🛺', desc: 'Quick 3-wheeler'},
  ];

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
          <View style={[styles.progressBar, styles.progressInactive]} />
        </View>

        <Text style={styles.stepBadge}>STEP 2 OF 3</Text>
        <Text style={styles.title}>Vehicle Details</Text>
        <Text style={styles.subtitle}>Tell us about the vehicle you'll drive with CAB</Text>

        {/* Vehicle Selection */}
        <Text style={styles.sectionTitle}>Select Vehicle Category</Text>
        <View style={styles.vehicleGrid}>
          {vehicleTypes.map(({type, icon, desc}) => {
            const selected = vehicleType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.vehicleCard,
                  selected && styles.selectedVehicleCard,
                ]}
                onPress={() => setVehicleType(type)}
                activeOpacity={0.8}>
                <View style={[styles.vehicleIconCircle, selected && styles.selectedVehicleIcon]}>
                  <Text style={styles.vehicleIcon}>{icon}</Text>
                </View>

                <Text style={[styles.vehicleText, selected && styles.selectedVehicleText]}>
                  {type}
                </Text>
                <Text style={styles.vehicleDesc}>{desc}</Text>

                {selected && (
                  <View style={styles.selectedDot}>
                    <Text style={styles.check}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Vehicle Information Fields */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Model</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Maruti Suzuki Dzire / Swift"
                placeholderTextColor={colors.textMuted}
                value={vehicleModel}
                onChangeText={setVehicleModel}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Registration Number</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g. RJ14 AB 1234"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Driving Licence Number</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g. DL-1420110012345"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
              />
            </View>
          </View>

          <Button
            title="Continue to Documents"
            icon="→"
            size="lg"
            onPress={handleContinue}
            style={styles.continueBtn}
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

  progressInactive: {
    backgroundColor: colors.border,
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
    marginBottom: 24,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },

  vehicleCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 14,
    position: 'relative',
    ...shadows.sm,
  },

  selectedVehicleCard: {
    borderColor: colors.primary,
    backgroundColor: '#FAFBFD',
  },

  vehicleIconCircle: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  selectedVehicleIcon: {
    backgroundColor: colors.secondaryLight,
  },

  vehicleIcon: {
    fontSize: 22,
  },

  vehicleText: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  selectedVehicleText: {
    color: colors.primary,
  },

  vehicleDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.regular,
    marginTop: 2,
  },

  selectedDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  check: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '800',
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
    paddingHorizontal: 14,
    justifyContent: 'center',
  },

  input: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.medium,
    paddingVertical: 0,
  },

  continueBtn: {
    marginTop: 8,
  },
});

export default DriverDetailsScreen;
