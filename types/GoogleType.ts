export interface GooglePlaceLocation {
  lat: number;
  lng: number;
}

export interface GooglePlaceViewport {
  northeast: GooglePlaceLocation;
  southwest: GooglePlaceLocation;
}

export interface GooglePlaceGeometry {
  location: GooglePlaceLocation;
  viewport: GooglePlaceViewport;
}

export interface GooglePlacePhoto {
  height: number;
  width: number;
  photo_reference: string;
  html_attributions: string[];
}

export interface GooglePlaceOpeningHours {
  open_now: boolean;
}

export interface GooglePlacePlusCode {
  compound_code: string;
  global_code: string;
}

export interface GooglePlaceResult {
  business_status: string;
  formatted_address: string;
  geometry: GooglePlaceGeometry;
  icon: string;
  icon_background_color: string;
  icon_mask_base_uri: string;
  name: string;
  opening_hours?: GooglePlaceOpeningHours;
  photos?: GooglePlacePhoto[];
  place_id: string;
  plus_code?: GooglePlacePlusCode;
  rating?: number;
  reference: string;
  types: string[];
  user_ratings_total?: number;
  vicinity?: string;
}

export interface GooglePlaceResponse {
  results: GooglePlaceResult[];
  status: string;
}

export interface FormattedPlaceResult {
  name: string;
  address: string;
  rating: number | string;
  user_ratings_total: number;
  business_status?: string;
  types?: string[];
  opening_hours?: {
    open_now: boolean;
  };
  photos?: GooglePlacePhoto[];
}