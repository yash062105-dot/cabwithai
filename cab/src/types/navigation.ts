export type UserRole = 'user' | 'driver';

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  OTP: {
    phone: string;
    flow: 'register' | 'login';
    role?: UserRole;
    name?: string;
    devOtp?: string;
    driverRegistration?: {
      latitude: number;
      longitude: number;
      vehicle_type: string;
      vehicle_model: string;
      vehicle_number: string;
      license_number: string;
    };
  };
  DriverDetails: {
    phone: string;
    name: string;
  };
  RegisterSuccess: {
    role?: UserRole;
  };
};

export type UserTabParamList = {
  Home: undefined;
  BookRide: {
    pickup?: string;
    destination?: string;
  };
  RideTracking: {
    rideId?: string;
  };
  Rides: undefined;
  Wallet: undefined;
  Profile: undefined;
};

export type DriverTabParamList = {
  Home: undefined;
  Bookings: undefined;
  RideDetails: {
    rideId?: string;
  };
  Earnings: undefined;
  Profile: undefined;
};
