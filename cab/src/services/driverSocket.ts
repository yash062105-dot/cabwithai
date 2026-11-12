import {io, Socket} from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BACKEND_URL} from '../constants/variable';
import {Coordinates} from './location';

export async function connectDriverSocket(
  onError: (message: string) => void,
): Promise<{socket: Socket; sendLocation: (coordinates: Coordinates) => void}> {
  const token = await AsyncStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Driver session has expired. Sign in again.');
  }

  const socket = io(BACKEND_URL, {
    auth: {token},
    transports: ['websocket'],
    reconnection: true,
  });
  let latestCoordinates: Coordinates | null = null;
  const sendLocation = (coordinates: Coordinates) => {
    latestCoordinates = coordinates;
    if (!socket.connected) return;
    socket.emit(
      'driver_location_update',
      coordinates,
      (response: {ok?: boolean; error?: string}) => {
        if (!response?.ok) {
          onError(response?.error || 'Driver location update was rejected.');
        }
      },
    );
  };

  socket.on('connect', () => {
    if (latestCoordinates) sendLocation(latestCoordinates);
  });
  socket.on('connect_error', (error: Error) => onError(error.message));
  return {socket, sendLocation};
}
