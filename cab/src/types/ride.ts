export type CabType = 'Mini' | 'Sedan' | 'SUV' | 'Auto';

export interface CabOption {
  type: CabType;
  base_fare: number;
  fare_per_km: number;
  available_drivers: number;
}

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  vehicleModel: string;
  vehicleNumber: string;
  vehicleType: string;
}

export type RideStatus =
  | 'searching'
  | 'assigned'
  | 'arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Ride {
  id: string;
  date: string;
  time: string;
  pickup: string;
  destination: string;
  cabType: CabType;
  fare: number;
  status: RideStatus;
  driver?: DriverInfo;
  paymentMethod: 'Cash';
  distanceKm: number;
  predictedEtaSeconds?: number;
  pickupCoordinates?: {latitude: number; longitude: number};
  destinationCoordinates?: {latitude: number; longitude: number};
  driverLocation?: {latitude: number; longitude: number};
}
