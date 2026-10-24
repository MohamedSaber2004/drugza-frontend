export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
}

export interface Address {
  id: string;
  name: string;
  city: string;
  region: string;
  street: string;
  building?: string;
  floor?: string;
  notes?: string;
  phoneNumber?: string;
  isDefault: boolean;
  location?: DeliveryLocation;
  hasColdChainStorage?: boolean;
}
