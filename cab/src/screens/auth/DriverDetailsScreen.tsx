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

import {colors, fonts, spacing} from '../../theme';

type VehicleType = 'Mini' | 'Sedan' | 'SUV' | 'Auto';

interface DriverDetailsScreenProps {
  navigation: any;
  route: any;
}

const DriverDetailsScreen = ({
  navigation,
  route,
}: DriverDetailsScreenProps) => {
  const [vehicleType, setVehicleType] =
    useState<VehicleType>('Mini');

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

  const vehicleTypes: VehicleType[] = [
    'Mini',
    'Sedan',
    'SUV',
    'Auto',
  ];

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

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            <View style={styles.progressActive} />
            <View style={styles.progressActive} />
            <View style={styles.progressInactive} />
          </View>

          <Text style={styles.stepText}>
            Step 2 of 3
          </Text>

          <Text style={styles.title}>
            Vehicle Details
          </Text>

          <Text style={styles.subtitle}>
            Tell us about the vehicle you'll use with CAB.
          </Text>
        </View>

        {/* Vehicle Type */}

        <Text style={styles.sectionTitle}>
          Vehicle Type
        </Text>

        <View style={styles.vehicleGrid}>
          {vehicleTypes.map(type => {
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

                <Text style={styles.vehicleIcon}>
                  {type === 'Auto'
                    ? '🛺'
                    : type === 'SUV'
                    ? '🚙'
                    : '🚗'}
                </Text>

                <Text
                  style={[
                    styles.vehicleText,
                    selected && styles.selectedVehicleText,
                  ]}>
                  {type}
                </Text>

                {selected && (
                  <View style={styles.selectedDot}>
                    <Text style={styles.check}>
                      ✓
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Vehicle Model */}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Vehicle Model
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Maruti Suzuki Dzire"
            placeholderTextColor={colors.textSecondary}
            value={vehicleModel}
            onChangeText={setVehicleModel}
          />
        </View>

        {/* Vehicle Number */}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Vehicle Number
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. RJ14AB1234"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
          />
        </View>

        {/* License */}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Driving License Number
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter driving license number"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
          />
        </View>

        {/* Continue */}

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={handleContinue}>

          <Text style={styles.buttonText}>
            Continue
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

  header: {
    marginBottom: 28,
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

  progressInactive: {
    height: 5,
    flex: 1,
    backgroundColor: colors.border,
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
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    marginBottom: 12,
  },

  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  vehicleCard: {
    width: '48%',
    height: 100,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },

  selectedVehicleCard: {
    borderColor: colors.secondary,
    borderWidth: 2,
  },

  vehicleIcon: {
    fontSize: 30,
    marginBottom: 6,
  },

  vehicleText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },

  selectedVehicleText: {
    color: colors.text,
  },

  selectedDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  check: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },

  inputGroup: {
    marginBottom: 18,
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

  button: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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

export default DriverDetailsScreen;