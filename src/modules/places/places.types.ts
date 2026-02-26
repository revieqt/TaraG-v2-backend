export interface IAddress {
  country: string;
  region: string;
  province: string;
  city: string;
  district: string;
  neighborhood: string;
  postal_code: string;
}

export interface ISchedule {
  opensOn: string; // time format (e.g., "09:00")
  closedOn: string; // time format (e.g., "17:00")
  days: string[]; // array of day names (e.g., ["Monday", "Tuesday", ...])
}

export interface ILink {
  name: string;
  url: string;
}

export interface IReview {
  reviewedBy: string;
  reviewedOn: Date;
  stars: number;
  note: string;
}

export interface ILocationPoint {
  _id?: string;
  locationName: string;
  address: IAddress;
  schedule: ISchedule;
  latitude: number;
  longitude: number;
  category: string;
  type: string;
  imageUrl: string; // empty string if no image
  description: string;
  updatedOn: Date;
  createdBy: string;
  status: "active" | "inactive" | "archived";
  links: ILink[];
  reviews: IReview[];
  createdOn?: Date;
}

export interface ILocationPointListItem {
  id: string;
  locationName: string;
  address: IAddress;
  latitude: number;
  longitude: number;
  schedule: ISchedule;
}
