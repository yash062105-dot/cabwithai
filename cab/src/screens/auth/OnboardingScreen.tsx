import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';

import {colors, fonts, radii, spacing} from '../../theme';
import {Button} from '../../components';

const {width} = Dimensions.get('window');

interface OnboardingScreenProps {
  navigation: any;
}

const onboardingData = [
  {
    title: 'Book Your Ride',
    description:
      'Book a cab quickly and comfortably from your current location to your destination with upfront pricing.',
    icon: '🚕',
    accent: '#FEF9C3',
  },
  {
    title: 'Track Your Driver',
    description:
      'See your driver location in real time and monitor estimated arrival time directly on the map.',
    icon: '📍',
    accent: '#EFF6FF',
  },
  {
    title: 'Ride With Confidence',
    description:
      'Enjoy verified drivers, cash payment options, and transparent rides across every booking.',
    icon: '🛡️',
    accent: '#ECFDF5',
  },
];

const OnboardingScreen = ({navigation}: OnboardingScreenProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentItem = onboardingData[currentIndex];
  const isLast = currentIndex === onboardingData.length - 1;

  const transitionTo = (newIndex: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setCurrentIndex(newIndex);
  };

  const handleNext = () => {
    if (isLast) {
      navigation.replace('Login');
      return;
    }
    transitionTo(currentIndex + 1);
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header Skip */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>CAB</Text>
          </View>
        </View>

        {!isLast && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dynamic Content */}
      <Animated.View style={[styles.mainContent, {opacity: fadeAnim}]}>
        <View style={[styles.iconCircle, {backgroundColor: currentItem.accent}]}>
          <Text style={styles.icon}>{currentItem.icon}</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{currentItem.title}</Text>
          <Text style={styles.description}>{currentItem.description}</Text>
        </View>
      </Animated.View>

      {/* Footer Dots and Button */}
      <View style={styles.footer}>
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

        <Button
          title={isLast ? 'Get Started' : 'Continue'}
          icon="→"
          size="lg"
          onPress={handleNext}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    minHeight: 50,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.sm,
  },

  logoText: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 2,
  },

  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },

  skipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },

  mainContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },

  iconCircle: {
    width: width * 0.52,
    height: width * 0.52,
    borderRadius: (width * 0.52) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  icon: {
    fontSize: 76,
  },

  textContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },

  title: {
    color: colors.text,
    fontSize: 28,
    fontFamily: fonts.bold,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 12,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: fonts.regular,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 320,
  },

  footer: {
    paddingBottom: 36,
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },

  activeDot: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
});

export default OnboardingScreen;
