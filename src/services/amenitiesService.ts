import axios from 'axios';

export interface Amenity {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string | null;
  website: string | null;
}

export async function findNearestAmenity(
  amenity?: string,
  latitude?: number,
  longitude?: number,
  tourism?: string,
  aeroway?: string
): Promise<Amenity[]> {
  if (!latitude || !longitude) {
    throw new Error('Latitude and longitude are required');
  }

  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  
  let queryConditions = '';
  if (amenity) {
    queryConditions = `["amenity"="${amenity}"]`;
  } else if (tourism) {
    queryConditions = `["tourism"="${tourism}"]`;
  } else if (aeroway) {
    queryConditions = `["aeroway"="${aeroway}"]`;
  } else {
    throw new Error('At least one of amenity, tourism, or aeroway must be provided');
  }

  const query = `
    [out:json][timeout:25];
    (
      node${queryConditions}(around:5000,${latitude},${longitude});
      way${queryConditions}(around:5000,${latitude},${longitude});
      relation${queryConditions}(around:5000,${latitude},${longitude});
    );
    out center tags;
  `;

  const response = await axios.post(overpassUrl, query, {
    headers: { 'Content-Type': 'text/plain' }
  });

  const elements = response.data.elements || [];
  return elements.map((el: any) => {
    const category = amenity || tourism || aeroway || 'location';
    return {
      id: el.id?.toString(),
      name: el.tags?.name || `Unknown ${category.charAt(0).toUpperCase() + category.slice(1)}`,
      latitude: el.lat || el.center?.lat,
      longitude: el.lon || el.center?.lon,
      address:
        el.tags?.['addr:full'] ||
        `${el.tags?.['addr:street'] || ''} ${el.tags?.['addr:city'] || ''}`.trim(),
      phone: el.tags?.phone || el.tags?.contact_phone || null,
      website: el.tags?.website || el.tags?.contact_website || null,
    };
  });
}
