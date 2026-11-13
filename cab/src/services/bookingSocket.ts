import AsyncStorage from '@react-native-async-storage/async-storage';
import {io, Socket} from 'socket.io-client';
import {BACKEND_URL} from '../constants/variable';

interface DriverLocationUpdate {
  booking_id: string;
  latitude: number;
  longitude: number;
}

type BookingStatus = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export async function connectBookingSocket(
  bookingId: string,
  onDriverLocation: (coordinates: {latitude: number; longitude: number}) => void,
  onBookingStatus: (status?: BookingStatus) => void,
  onError: (message: string) => void,
): Promise<Socket> {
  const token = await AsyncStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Your session has expired. Sign in again.');
  }

  const socket = io(BACKEND_URL, {
    auth: {token},
    transports: ['websocket'],
    reconnection: true,
  });
  const watchBooking = () => {
    socket.emit(
      'watch_booking',
      {booking_id: bookingId},
      (response: {ok?: boolean; error?: string}) => {
        if (!response?.ok) {
          onError(response?.error || 'Could not subscribe to ride updates.');
          return;
        }
        onBookingStatus();
      },
    );
  };
  socket.on('connect', watchBooking);
  socket.on('connect_error', (error: Error) => onError(error.message));
  socket.on('driver_location', (update: DriverLocationUpdate) => {
    if (update.booking_id === bookingId) {
      onDriverLocation({latitude: update.latitude, longitude: update.longitude});
    }
  });
  socket.on('booking_status', (update: {booking_id: string; status: BookingStatus}) => {
    if (update.booking_id === bookingId) onBookingStatus(update.status);
  });
  return socket;
}
