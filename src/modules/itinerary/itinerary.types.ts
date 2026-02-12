export type ItineraryStatus = 'active' | 'cancelled' | 'done';
export type PlanMode = 'daily' | 'general';

export interface Location {
  latitude: number;
  longitude: number;
  locationName: string;
  note: string;
}

export interface DailyItinerary {
  date: Date;
  locations: Location[];
}

export interface CreateItineraryRequest {
  title: string;
  type: string;
  description: string;
  startDate: Date;
  endDate: Date;
  planDaily: boolean;
  locations: Location[] | DailyItinerary[];
}

export interface UpdateItineraryRequest {
  title?: string;
  type?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  planDaily?: boolean;
  locations?: Location[] | DailyItinerary[];
  status?: ItineraryStatus;
}
