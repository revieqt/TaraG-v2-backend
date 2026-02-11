export interface EnableSOSRequest {
  accessToken: string;
  emergencyType: string;
  message?: string;
  userID: string;
  emergencyContact?: string;
  latitude: number;
  longitude: number;
}

export interface DisableSOSRequest {
  accessToken: string;
  userID: string;
}

export interface LocationInfo {
  name: string;
  address: string;
  city: string;
  country: string;
}

export interface Amenity {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string | null;
  website: string | null;
}