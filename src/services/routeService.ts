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

    // Handle single route only
    const route = response.data.routes ? response.data.routes[0] : response.data.route;
    
    if (!route) {
      throw new Error('No route found in response');
    }

    // Process segments with steps
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

    // Log the raw geometry to debug
    console.log('🔍 Raw geometry from ORS:', {
      type: typeof route.geometry,
      hasCoordinates: !!route.geometry?.coordinates,
      coordinateCount: route.geometry?.coordinates?.length || 0,
      geometryType: route.geometry?.type,
      firstCoord: route.geometry?.coordinates?.[0],
      isString: typeof route.geometry === 'string'
    });

    // Handle geometry - could be coordinates array or encoded string
    let geometryCoordinates: [number, number, number?][] = [];
    
    if (route.geometry?.coordinates && Array.isArray(route.geometry.coordinates)) {
      // Already decoded coordinates
      geometryCoordinates = route.geometry.coordinates;
      console.log('✅ Using decoded coordinates from API');
    } else if (typeof route.geometry === 'string') {
      // Encoded polyline string
      console.log('🔧 Decoding polyline string');
      const decoded = decodePolyline(route.geometry);
      geometryCoordinates = decoded.map(coord => [coord[0], coord[1]]);
    } else if (route.geometry && typeof route.geometry === 'object' && 'coordinates' in route.geometry) {
      // GeoJSON format
      geometryCoordinates = route.geometry.coordinates || [];
    }

    const result = {
      geometry: {
        coordinates: geometryCoordinates,
        type: 'LineString'
      },
      distance: route.summary.distance, // meters
      duration: route.summary.duration, // seconds
      bbox: route.bbox || undefined,
      segments
    };

    console.log('🎯 Route result with segments:', {
      distance: `${(result.distance / 1000).toFixed(2)} km`,
      duration: `${Math.round(result.duration / 60)} min`,
      segmentCount: segments.length,
      totalSteps: segments.reduce((acc: number, seg: any) => acc + (seg.steps?.length || 0), 0),
      coordinateCount: result.geometry.coordinates.length
    });
    
    return result;
  } catch (error) {
    console.error('❌ OpenRouteService error:', error);
    throw error;
  }
}