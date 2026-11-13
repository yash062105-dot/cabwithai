import React, {createContext, useCallback, useContext, useEffect, useState, ReactNode} from 'react';
import {Alert} from 'react-native';
import Api from '../config/Api';
import {useAuth} from './AuthContext';
import {Ride, RideStatus} from '../types/ride';

interface RideContextType {
  currentRide: Ride | null;
  ridesHistory: Ride[];
  setBooking: (booking: Record<string, any>) => Ride;
  refreshRides: () => Promise<void>;
  refreshBooking: (bookingId: string) => Promise<void>;
  updateRideStatus: (bookingId: string, status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled') => void;
  updateDriverLocation: (bookingId: string, coordinates: {latitude: number; longitude: number}) => void;
  finishCurrentRide: () => void;
  cancelCurrentRide: () => Promise<boolean>;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export const RideProvider = ({children}: {children: ReactNode}) => {
  const {isLoggedIn, role} = useAuth();
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [ridesHistory, setRidesHistory] = useState<Ride[]>([]);

  const mapBooking = useCallback((booking: Record<string, any>): Ride => {
    const statusMap: Record<string, RideStatus> = {
      requested: 'searching', accepted: 'assigned', in_progress: 'in_progress',
      completed: 'completed', cancelled: 'cancelled',
    };
    const date = new Date(booking.created_at);
    const driver = booking.driver_id ? {
      id: String(booking.driver_id),
      name: String(booking.driver_name ?? ''),
      phone: String(booking.driver_phone ?? ''),
      vehicleModel: String(booking.vehicle_model ?? ''),
      vehicleNumber: String(booking.vehicle_number ?? ''),
      vehicleType: String(booking.vehicle_type ?? booking.cab_type),
    } : undefined;
    const status = statusMap[booking.status];
    if (!status) {
      throw new Error(`Unknown booking status: ${String(booking.status)}`);
    }
    return {
      id: String(booking._id),
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
      pickup: booking.pickup_address || `${booking.pickup_lat}, ${booking.pickup_lon}`,
      destination: booking.destination_address || `${booking.destination_lat}, ${booking.destination_lon}`,
      cabType: booking.cab_type,
      fare: Number(booking.fare_amount ?? booking.estimated_fare),
      status,
      driver,
      paymentMethod: booking.payment_method || 'Cash',
      distanceKm: Number(booking.distance_miles) * 1.60934,
      predictedEtaSeconds: booking.predicted_eta_seconds == null
        ? undefined
        : Number(booking.predicted_eta_seconds),
      pickupCoordinates: {latitude: Number(booking.pickup_lat), longitude: Number(booking.pickup_lon)},
      destinationCoordinates: {latitude: Number(booking.destination_lat), longitude: Number(booking.destination_lon)},
      driverLocation: booking.driver_location?.latitude != null && booking.driver_location?.longitude != null
        ? {latitude: Number(booking.driver_location.latitude), longitude: Number(booking.driver_location.longitude)}
        : undefined,
    };
  }, []);

  const setBooking = (booking: Record<string, any>) => {
    const ride = mapBooking(booking);
    setCurrentRide(ride);
    return ride;
  };

  const refreshRides = useCallback(async () => {
    try {
      const response = await Api.get('/bookings');
      const rides = response.data.map(mapBooking) as Ride[];
      const active = rides.find(ride => ['searching', 'assigned', 'in_progress'].includes(ride.status));
      setCurrentRide(active || null);
      setRidesHistory(rides.filter(ride => ride.id !== active?.id));
    } catch (error: any) {
      setCurrentRide(null);
      setRidesHistory([]);
      Alert.alert('Could not load rides', error.response?.data?.detail || 'Check your connection and try again.');
    }
  }, [mapBooking]);

  const refreshBooking = useCallback(async (bookingId: string) => {
    const response = await Api.get(`/bookings/${bookingId}`);
    const ride = mapBooking(response.data);
    setCurrentRide(ride);
    if (ride.status === 'completed' || ride.status === 'cancelled') {
      setRidesHistory(previous => previous.filter(item => item.id !== ride.id));
    }
  }, [mapBooking]);

  const updateRideStatus = useCallback((bookingId: string, status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled') => {
    const statusMap: Record<typeof status, RideStatus> = {
      requested: 'searching',
      accepted: 'assigned',
      in_progress: 'in_progress',
      completed: 'completed',
      cancelled: 'cancelled',
    };
    setCurrentRide(previous =>
      previous?.id === bookingId ? {...previous, status: statusMap[status]} : previous,
    );
  }, []);

  const updateDriverLocation = useCallback((bookingId: string, coordinates: {latitude: number; longitude: number}) => {
    setCurrentRide(previous =>
      previous?.id === bookingId ? {...previous, driverLocation: coordinates} : previous,
    );
  }, []);

  const finishCurrentRide = () => {
    if (!currentRide) return;
    setRidesHistory(previous => [currentRide, ...previous.filter(item => item.id !== currentRide.id)]);
    setCurrentRide(null);
  };

  useEffect(() => {
    if (isLoggedIn && role === 'user') {
      refreshRides();
    } else {
      setCurrentRide(null);
      setRidesHistory([]);
    }
  }, [isLoggedIn, role, refreshRides]);

  const cancelCurrentRide = async (): Promise<boolean> => {
    if (!currentRide) return false;
    try {
      await Api.post(`/bookings/${currentRide.id}/cancel`);
      const cancelledRide = {...currentRide, status: 'cancelled' as const};
      setRidesHistory(previous => [cancelledRide, ...previous.filter(item => item.id !== currentRide.id)]);
      setCurrentRide(null);
      return true;
    } catch (error: any) {
      Alert.alert('Could not cancel ride', error.response?.data?.detail || 'Try again shortly.');
      return false;
    }
  };

  return (
    <RideContext.Provider
      value={{
        currentRide,
        ridesHistory,
        setBooking,
        refreshRides,
        refreshBooking,
        updateRideStatus,
        updateDriverLocation,
        finishCurrentRide,
        cancelCurrentRide,
      }}>
      {children}
    </RideContext.Provider>
  );
};

export const useRide = (): RideContextType => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
};
