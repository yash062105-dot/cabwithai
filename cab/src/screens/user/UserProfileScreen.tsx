
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';

import {
  UserRound,
  Phone,
  Mail,
  ShieldCheck,
  CircleCheck,
  LogOut,
  UserCircle,
  CreditCard,
} from 'lucide-react-native';

import {
  colors,
  fonts,
  radii,
  spacing,
  shadows,
} from '../../theme';

import {useAuth} from '../../context/AuthContext';
import {Button, ScreenHeader} from '../../components';

type ProfileItemProps = {
  icon: React.ComponentType<any>;
  title: string;
  value: string;
};

const ProfileItem = ({
  icon: Icon,
  title,
  value,
}: ProfileItemProps) => (
  <View style={styles.infoItem}>
    <View style={styles.infoIcon}>
      <Icon size={19} color={colors.primary} strokeWidth={1.8} />
    </View>

    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{title}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>

    <CircleCheck
      size={17}
      color={colors.success}
      strokeWidth={1.8}
    />
  </View>
);

const UserProfileScreen = () => {
  const {user, logout} = useAuth();

  const phone = user?.phone
    ? `+91 ${user.phone.replace('+91', '').trim()}`
    : 'Not linked';

  const name = user?.name || 'Rider';


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScreenHeader title="My Profile" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        {/* Profile Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.avatar}>
              <UserRound
                size={36}
                color={colors.primary}
                strokeWidth={1.7}
              />
            </View>

            <View style={styles.verifiedBadge}>
              <ShieldCheck
                size={14}
                color={colors.success}
              />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          <Text style={styles.heroName}>{name}</Text>

          <Text style={styles.heroPhone}>{phone}</Text>

          <View style={styles.heroDivider} />

          <View style={styles.heroFooter}>
            <View>
              <Text style={styles.heroFooterLabel}>
                ACCOUNT STATUS
              </Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>

            
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Personal Details
            </Text>
            <Text style={styles.sectionSubtitle}>
              Your account information
            </Text>
          </View>

          <View style={styles.sectionIcon}>
            <UserRound
              size={19}
              color={colors.primary}
            />
          </View>
        </View>

       

        {/* Account Security Card */}
        <View style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <ShieldCheck
              size={24}
              color={colors.success}
              strokeWidth={1.8}
            />
          </View>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              Your Account is Protected
            </Text>
            <Text style={styles.securityDescription}>
              Your account information is managed securely.
            </Text>
          </View>
        </View>

        {/* Account Summary */}
        <Text style={styles.sectionTitle}>
          Account Summary
        </Text>

        

        {/* Sign Out */}
        <View style={styles.logoutSection}>
          <Button
            title="Sign Out"
            variant="outline"
            size="md"
            textStyle={{color: colors.danger}}
            style={{borderColor: colors.dangerBorder}}
            onPress={logout}
          />

          <Text style={styles.footerText}>
            Thank you for being with us.
          </Text>
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
    paddingTop: 8,
    paddingBottom: 40,
  },

  heroCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 20,
    marginTop: 12,
    marginBottom: 27,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },

  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.successLight,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },

  verifiedText: {
    fontSize: 11,
    color: colors.success,
    fontFamily: fonts.bold,
  },

  heroName: {
    color: colors.text,
    fontSize: 23,
    fontFamily: fonts.bold,
    fontWeight: '800',
    marginTop: 17,
  },

  heroPhone: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.medium,
    marginTop: 5,
  },

  heroDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18,
  },

  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  heroFooterLabel: {
    fontSize: 9,
    letterSpacing: 1,
    color: colors.textSecondary,
    fontFamily: fonts.bold,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 6,
  },

  statusText: {
    color: colors.success,
    fontSize: 12,
    fontFamily: fonts.bold,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.bold,
    fontWeight: '800',
    marginBottom: 5,
  },

  sectionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.medium,
  },

  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bold,
    marginTop: 4,
  },

  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 55,
  },

  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderRadius: radii.xl,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.successBorder,
    marginBottom: 25,
  },

  securityIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    color: colors.text,
    fontSize: 12,
    fontFamily: fonts.bold,
  },

  securityDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: fonts.regular,
    marginTop: 4,
    lineHeight: 15,
  },

  logoutSection: {
    marginTop: 28,

  },

  footerText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.medium,
    marginTop: 17,
  },
});

export default UserProfileScreen;
