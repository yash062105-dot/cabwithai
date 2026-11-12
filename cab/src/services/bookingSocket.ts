import AsyncStorage from '@react-native-async-storage/async-storage';
import {io, Socket} from 'socket.io-client';
import {BACKEND_URL} from '../constants/variable';

export async function connectBookingSocket(
  bookingId: string,
  onUpdate: () => void,
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
        }
      },
    );
  };
  socket.on('connect', watchBooking);
  socket.on('connect_error', (error: Error) => onError(error.message));
  socket.on('driver_location', onUpdate);
  socket.on('booking_status', onUpdate);
  return socket;
}
