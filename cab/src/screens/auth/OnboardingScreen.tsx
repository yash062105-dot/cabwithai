import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';

import {colors, fonts, spacing} from '../../theme';

const {width} = Dimensions.get('window');

interface OnboardingScreenProps {
  navigation: any;
}

const onboardingData = [
  {
    title: 'Book Your Ride',
    description:
      'Book a cab quickly and comfortably from your current location to your destination.',
    icon: '🚕',
  },
  {
    title: 'Track Your Driver',
    description:
      'See your driver location and estimated arrival time directly on the map.',
    icon: '📍',
  },
  {
    title: 'Ride With Confidence',
    description:
      'Enjoy a safe, reliable and transparent cab booking experience with CAB.',
    icon: '🛡️',
  },
];

const OnboardingScreen = ({
  navigation,
}: OnboardingScreenProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentItem = onboardingData[currentIndex];

  const isLast = currentIndex === onboardingData.length - 1;

  const handleNext = () => {
    if (isLast) {
      navigation.replace('Login');
      return;
    }

    setCurrentIndex(prev => prev + 1);
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        // backgroundColor={colors.background}
      />

      {/* Skip */}

      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Illustration */}

      <View style={styles.illustrationContainer}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>{currentItem.icon}</Text>
        </View>
      </View>

      {/* Content */}

      <View style={styles.content}>
        <Text style={styles.title}>
          {currentItem.title}
        </Text>

        <Text style={styles.description}>
          {currentItem.description}
        </Text>
      </View>

      {/* Dots */}

      <View style={styles.dotsContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.activeDot,
            ]}
          />
        ))}
      </View>

      {/* Button */}

      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleNext}
        activeOpacity={0.8}>
        <Text style={styles.nextButtonText}>
          {isLast ? 'Get Started' : 'Continue'}
        </Text>

        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },

  skipButton: {
    alignSelf: 'flex-end',
    marginTop: 20,
    padding: 8,
  },

  skipText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.medium,
  },

  illustrationContainer: {
    height: width * 0.85,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  icon: {
    fontSize: 80,
  },

  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },

  title: {
    color: colors.text,
    fontSize: 28,
    fontFamily: fonts.bold,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: fonts.regular,
    lineHeight: 23,
    textAlign: 'center',
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },

  activeDot: {
    width: 24,
    backgroundColor: colors.secondary,
  },

  nextButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },

  nextButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  arrow: {
    color: colors.secondary,
    fontSize: 22,
    marginLeft: 10,
    marginTop: -2,
  },
});

export default OnboardingScreen;