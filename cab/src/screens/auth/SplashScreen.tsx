import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';

import {colors, fonts, radii} from '../../theme';

interface SplashScreenProps {
  navigation: any;
}

const SplashScreen = ({navigation}: SplashScreenProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2200);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        <View style={styles.badgeContainer}>
          <Text style={styles.logo}>CAB</Text>
        </View>

        <View style={styles.logoLine} />

        <Text style={styles.tagline}>Your ride, your way.</Text>
      </Animated.View>

      <Text style={styles.bottomText}>Safe • Fast • Reliable</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoContainer: {
    alignItems: 'center',
  },

  badgeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: 'rgba(250, 204, 21, 0.3)',
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
  },

  logo: {
    color: colors.secondary,
    fontSize: 48,
    fontFamily: fonts.bold,
    fontWeight: '800',
    letterSpacing: 6,
  },

  logoLine: {
    width: 48,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.secondary,
    marginTop: 16,
    marginBottom: 14,
  },

  tagline: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    fontFamily: fonts.medium,
    letterSpacing: 0.3,
  },

  bottomText: {
    position: 'absolute',
    bottom: 40,
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.medium,
    letterSpacing: 1.2,
  },
});

export default SplashScreen;
