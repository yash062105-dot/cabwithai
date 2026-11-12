import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';

import {colors, fonts} from '../../theme';

interface SplashScreenProps {
  navigation: any;
}

const SplashScreen = ({navigation}: SplashScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        // backgroundColor={colors.primary}
        
      />

      <View style={styles.logoContainer}>
        <Text style={styles.logo}>CAB</Text>

        <View style={styles.logoLine} />

        <Text style={styles.tagline}>
          Your ride, your way.
        </Text>
      </View>

      <Text style={styles.bottomText}>
        Safe • Fast • Reliable
      </Text>
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

  logo: {
    color: colors.secondary,
    fontSize: 52,
    fontFamily: fonts.bold,
    fontWeight: '800',
    letterSpacing: 4,
  },

  logoLine: {
    width: 55,
    height: 4,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    marginTop: 8,
    marginBottom: 12,
  },

  tagline: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.medium,
  },

  bottomText: {
    position: 'absolute',
    bottom: 35,
    color: '#94A3B8',
    fontSize: 13,
    fontFamily: fonts.regular,
  },
});

export default SplashScreen;