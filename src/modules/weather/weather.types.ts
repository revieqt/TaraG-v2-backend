export interface WeatherData {
  temperature: number | null;
  windSpeed: number | null;
  humidity: number | null;
  precipitation: number | null;
  weatherCode: number | null;
  weatherType: string | null;
}

export interface WeatherResponse {
  success: boolean;
  data: WeatherData;
}
