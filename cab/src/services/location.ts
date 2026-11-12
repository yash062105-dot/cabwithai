import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation, {
  GeoPosition,
  GeoWatchOptions,
  PositionError,
} from 'react-native-geolocation-service';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PlaceResult extends Coordinates {
  label: string;
}

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const permissions = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);
    return Object.values(permissions).some(
      result => result === PermissionsAndroid.RESULTS.GRANTED,
    );
  }

  const result = await Geolocation.requestAuthorization('whenInUse');
  return result === 'granted';
}

export function getCurrentLocation(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, {
      accuracy: { android: 'high', ios: 'best' },
      enableHighAccuracy: true,
      timeout: 20_000,
      maximumAge: 10_000,
      showLocationDialog: true,
      forceRequestLocation: true,
    });
  });
}

export function watchLocation(
  onLocation: (coordinates: Coordinates) => void,
  onError?: (message: string) => void,
  options: GeoWatchOptions = {},
): () => void {
  const watchId = Geolocation.watchPosition(
    position =>
      onLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
    error => onError?.(error.message),
    {
      accuracy: { android: 'high', ios: 'best' },
      enableHighAccuracy: true,
      distanceFilter: 10,
      interval: 8_000,
      fastestInterval: 5_000,
      ...options,
    },
  );
  return () => Geolocation.clearWatch(watchId);
}

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(
    query,
  )}`;
  const response = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'CABCollegeApp/1.0' },
  });
  if (!response.ok) {
    throw new Error('Location search is temporarily unavailable.');
  }
  const rows = await response.json();
  return rows.map((row: any) => ({
    latitude: Number(row.lat),
    longitude: Number(row.lon),
    label: String(row.display_name),
  }));
}

export async function reverseGeocode(
  coordinates: Coordinates,
): Promise<string> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(coordinates.latitude),
    lon: String(coordinates.longitude),
  });
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
    {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'CABCollegeApp/1.0' },
    },
  );
  if (!response.ok) {
    throw new Error('Could not find an address for this map location.');
  }
  const result = await response.json();
  return String(
    result.display_name ||
      `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`,
  );
}

export function isLocationPermissionError(code: number): boolean {
  return code === PositionError.PERMISSION_DENIED;
}
