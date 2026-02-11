import { Request, Response } from 'express';
import { getWeather } from './weather.service';

export async function getWeatherController(req: Request, res: Response) {
  try {
    const { city, latitude, longitude, date } = req.query;

    if (!city || !latitude || !longitude) {
      return res
        .status(400)
        .json({ success: false, data: null, message: 'Missing required params' });
    }

    const weather = await getWeather(
      city.toString(),
      parseFloat(latitude.toString()),
      parseFloat(longitude.toString()),
      date?.toString()
    );

    return res.json(weather);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      data: {
        temperature: null,
        windSpeed: null,
        humidity: null,
        precipitation: null,
        weatherCode: null,
        weatherType: null,
      },
    });
  }
}
