import axios from 'axios';

// Simple polyline decoder for encoded geometry
function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}

export async function getRoutes(data: {
  location: Array<{ latitude: number; longitude: number }>;
  mode: string;
}) {
  try {
    const apiKey = process.env.ORS_API_KEY;
    const coordinates = data.location.map(loc => [loc.longitude, loc.latitude]);
    
    // Map mode to correct OpenRouteService profile
    const profileMap: { [key: string]: string } = {
      'driving-car': 'driving-car',
      'cycling-regular': 'cycling-regular', 
      'foot-walking': 'foot-walking',
      'foot-hiking': 'foot-hiking'
    };
    
    const profile = profileMap[data.mode] || 'driving-car';
    const url = `https://api.openrouteservice.org/v2/directions/${profile}`;
    const params = {
      coordinates,
      instructions: true,
      geometry: true,
      elevation: false,
      continue_straight: false
    };

    console.log('🗺️ Calling OpenRouteService:', { url, coordinates, mode: data.mode, params });

    const response = await axios.post(url, params, {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
    }).catch(error => {
      console.error('❌ OpenRouteService API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url,
        params
      });
      throw error;
    });

    console.log('✅ OpenRouteService response:', response.status);
    console.log('📍 Available routes:', response.data.routes?.length || 0);

    // Get all available routes (up to 3)
    const routes = response.data.routes || (response.data.route ? [response.data.route] : []);
    
    if (!routes || routes.length === 0) {
      throw new Error('No routes found in response');
    }

    // Process each route and return up to 3 alternatives
    const processRoute = (route: any) => {
      const segments = route.segments?.map((segment: any) => ({
        distance: segment.distance,
        duration: segment.duration,
        steps: segment.steps?.map((step: any) => ({
          distance: step.distance,
          duration: step.duration,
          instruction: step.instruction,
          name: step.name || undefined,
          way_points: step.way_points
        })) || []
      })) || [];

      // Handle geometry - could be coordinates array or encoded string
      let geometryCoordinates: [number, number, number?][] = [];
      
      if (route.geometry?.coordinates && Array.isArray(route.geometry.coordinates)) {
        geometryCoordinates = route.geometry.coordinates;
      } else if (typeof route.geometry === 'string') {
        const decoded = decodePolyline(route.geometry);
        geometryCoordinates = decoded.map(coord => [coord[0], coord[1]]);
      } else if (route.geometry && typeof route.geometry === 'object' && 'coordinates' in route.geometry) {
        geometryCoordinates = route.geometry.coordinates || [];
      }

      return {
        geometry: {
          coordinates: geometryCoordinates,
          type: 'LineString'
        },
        distance: route.summary.distance, // meters
        duration: route.summary.duration, // seconds
        bbox: route.bbox || undefined,
        segments
      };
    };

    // Process up to 3 routes
    const results = routes.slice(0, 3).map(processRoute);
    console.log('🎯 Routes generated:', {
      totalRoutes: results.length,
      routes: results.map((r: any) => ({
        distance: `${(r.distance / 1000).toFixed(2)} km`,
        duration: `${Math.round(r.duration / 60)} min`,
        segments: r.segments.length
      }))
    });
    
    return results;
  } catch (error) {
    console.error('❌ OpenRouteService error:', error);
    throw error;
  }
}