import NodeCache from 'node-cache';
import fetch from 'node-fetch';
import { WeatherData } from './weather.types';

const weatherCache = new NodeCache({ stdTTL: 60 * 60 * 6 });

const weatherCodeMap: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Drizzle: Light',
  53: 'Drizzle: Moderate',
  55: 'Drizzle: Dense',
  56: 'Freezing Drizzle: Light',
  57: 'Freezing Drizzle: Dense',
  61: 'Rain: Slight',
  63: 'Rain: Moderate',
  65: 'Rain: Heavy',
  66: 'Freezing Rain: Light',
  67: 'Freezing Rain: Heavy',
  71: 'Snow fall: Slight',
  73: 'Snow fall: Moderate',
  75: 'Snow fall: Heavy',
  77: 'Snow grains',
  80: 'Rain showers: Slight',
  81: 'Rain showers: Moderate',
  82: 'Rain showers: Violent',
  85: 'Snow showers: Slight',
  86: 'Snow showers: Heavy',
  95: 'Thunderstorm: Slight or moderate',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

interface OpenMeteoDailyResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    windspeed_10m_max: number[];
    precipitation_sum: number[];
    weathercode: number[];
  };
  hourly: {
    time: string[];
    relativehumidity_2m: number[];
  };
}

export async function getWeather(
  city: string,
  latitude: number,
  longitude: number,
  date?: string
) {
  try {
    const today = new Date();
    const targetDate = date || today.toISOString().split('T')[0];

    const normalizedCity = city.toLowerCase();
    const key = `weather:${normalizedCity}:${targetDate}`;

    const cached = weatherCache.get<WeatherData>(key);
    if (cached) return { success: true, data: cached };

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode&hourly=relativehumidity_2m&timezone=auto`;
    const res = await fetch(url);
    const data = (await res.json()) as OpenMeteoDailyResponse;

    const dayIndex = data.daily.time.findIndex((d) => d === targetDate);
    if (dayIndex === -1) throw new Error('Weather data for the given date not available');

    const hourIndices = data.hourly.time
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => t.startsWith(targetDate))
      .map(({ i }) => i);

    const humidityValues = hourIndices.map((i) => data.hourly.relativehumidity_2m[i]);
    const averageHumidity =
      humidityValues.length > 0
        ? humidityValues.reduce((a, b) => a + b, 0) / humidityValues.length
        : null;

    const weather: WeatherData = {
      temperature: data.daily.temperature_2m_max[dayIndex] ?? null,
      windSpeed: data.daily.windspeed_10m_max[dayIndex] ?? null,
      humidity: averageHumidity,
      precipitation: data.daily.precipitation_sum[dayIndex] ?? null,
      weatherCode: data.daily.weathercode[dayIndex] ?? null,
      weatherType:
        data.daily.weathercode[dayIndex] != null
          ? weatherCodeMap[data.daily.weathercode[dayIndex]] ?? null
          : null,
    };

    weatherCache.set(key, weather);

    return { success: true, data: weather };
  } catch (err) {
    console.error('Weather service error:', err);
    return {
      success: false,
      data: {
        temperature: null,
        windSpeed: null,
        humidity: null,
        precipitation: null,
        weatherCode: null,
        weatherType: null,
      },
    };
  }
}
