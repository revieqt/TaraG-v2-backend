// Format date to YYYY-MM-DD format
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Weather code to description mapping (WMO Weather interpretation codes)
const getWeatherDescription = (code: number): string => {
  // Clear sky
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Cloudy';
  
  // Fog and mist
  if (code === 45) return 'Foggy';
  if (code === 48) return 'Depositing rime fog';
  
  // Drizzle
  if (code === 51) return 'Light drizzle';
  if (code === 53) return 'Moderate drizzle';
  if (code === 55) return 'Dense drizzle';
  
  // Freezing drizzle
  if (code === 56) return 'Light freezing drizzle';
  if (code === 57) return 'Dense freezing drizzle';
  
  // Rain
  if (code === 61) return 'Slight rain';
  if (code === 63) return 'Moderate rain';
  if (code === 65) return 'Heavy rain';
  
  // Freezing rain
  if (code === 66) return 'Light freezing rain';
  if (code === 67) return 'Heavy freezing rain';
  
  // Snow
  if (code === 71) return 'Slight snow';
  if (code === 73) return 'Moderate snow';
  if (code === 75) return 'Heavy snow';
  if (code === 77) return 'Snow grains';
  
  // Showers
  if (code === 80) return 'Slight rain showers';
  if (code === 81) return 'Moderate rain showers';
  if (code === 82) return 'Violent rain showers';
  
  // Snow showers
  if (code === 85) return 'Slight snow showers';
  if (code === 86) return 'Heavy snow showers';
  
  // Thunderstorm
  if (code === 80) return 'Thunderstorm with slight rain';
  if (code === 81) return 'Thunderstorm with moderate rain';
  if (code === 82) return 'Thunderstorm with heavy rain';
  if (code === 95) return 'Thunderstorm';
  if (code === 96) return 'Thunderstorm with slight hail';
  if (code === 99) return 'Thunderstorm with heavy hail';
  
  return 'Unknown';
};

interface WeatherData {
  date: string;
  temperature: number | null;
  windSpeed: number | null;
  humidity: number | null;
  precipitation: number | null;
  weatherCode: number | null;
  weatherType: string | null;
}

interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    temperature_2m?: number[];
    wind_speed_10m_max?: number[];
    relative_humidity_2m?: number[];
    precipitation_sum?: number[];
    weather_code?: number[];
  };
}

export const getWeather = async (
  latitude: number,
  longitude: number,
  date?: string
): Promise<WeatherData> => {
  try {
    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error('Invalid latitude or longitude');
    }

    // Determine the target date
    let targetDate: Date;
    if (date) {
      // Parse the provided date
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
      }
      targetDate = parsedDate;
    } else {
      // Use current date
      targetDate = new Date();
    }

    const formattedDate = formatDate(targetDate);

    // Call OpenMeteo API
    // We fetch a range to ensure we get data for the requested date
    const startDate = formatDate(new Date(targetDate.getTime() - 1000 * 60 * 60 * 24)); // 1 day before
    const endDate = formatDate(new Date(targetDate.getTime() + 1000 * 60 * 60 * 24)); // 1 day after

    // Call OpenMeteo API with properly formatted URL
    const dailyParams = 'temperature_2m_max,temperature_2m_min,wind_speed_10m_max,relative_humidity_2m,precipitation_sum,weather_code';
    const openMeteoUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=${encodeURIComponent(dailyParams)}&timezone=auto`;

    console.log('Fetching weather data from OpenMeteo:', openMeteoUrl);

    const response = await fetch(openMeteoUrl);

    if (!response.ok) {
      const responseText = await response.text();
      console.error('OpenMeteo API Response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      });
      throw new Error(`OpenMeteo API error: ${response.statusText}`);
    }

    const data: OpenMeteoResponse = await response.json();

    // Find the data for the requested date
    const dateIndex = data.daily.time.indexOf(formattedDate);

    if (dateIndex === -1) {
      console.warn(`Weather data not found for date ${formattedDate}`);
      return {
        date: formattedDate,
        temperature: null,
        windSpeed: null,
        humidity: null,
        precipitation: null,
        weatherCode: null,
        weatherType: null,
      };
    }

    // Extract weather data for the requested date
    const temperature = data.daily.temperature_2m_max?.[dateIndex] ?? null;
    const windSpeed = data.daily.wind_speed_10m_max?.[dateIndex] ?? null;
    const humidity = data.daily.relative_humidity_2m?.[dateIndex] ?? null;
    const precipitation = data.daily.precipitation_sum?.[dateIndex] ?? null;
    const weatherCode = data.daily.weather_code?.[dateIndex] ?? null;
    const weatherType = weatherCode !== null ? getWeatherDescription(weatherCode) : null;

    const weatherData: WeatherData = {
      date: formattedDate,
      temperature: temperature !== null ? parseFloat(temperature.toFixed(2)) : null,
      windSpeed: windSpeed !== null ? parseFloat(windSpeed.toFixed(2)) : null,
      humidity: humidity !== null ? Math.round(humidity) : null,
      precipitation: precipitation !== null ? parseFloat(precipitation.toFixed(2)) : null,
      weatherCode: weatherCode,
      weatherType: weatherType,
    };

    console.log('Weather data retrieved:', weatherData);
    return weatherData;
  } catch (error: any) {
    console.error('Error fetching weather data:', error);
    throw new Error(error.message || 'Failed to fetch weather data');
  }
};
