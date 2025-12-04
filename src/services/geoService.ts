import type { Therapist } from '../types';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes cache
    });
  });
};

export const searchNearbyTherapists = async (
  lat: number,
  lng: number,
  radius: number = 10000 // 10km default
): Promise<Therapist[]> => {
  // NOTE:
  // The original implementation attempted to call a backend proxy at `/api/places/nearby`.
  // In the current setup there is no such backend route, so the browser receives HTML
  // (the index.html file) instead of JSON, causing the `Unexpected token '<'` error.
  //
  // For this demo app we always use high‑quality mock therapist data on the client side,
  // which avoids backend requirements and API key exposure. In production you can
  // replace this with a real Places API call from a secure backend.

  return getMockTherapists(lat, lng);
};

export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => deg * (Math.PI / 180);

const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
};

const formatPlacesResults = (results: any[], userLat: number, userLng: number): Therapist[] => {
  return results.map((place: any, index: number) => {
    const distance = calculateDistance(
      userLat,
      userLng,
      place.geometry.location.lat,
      place.geometry.location.lng
    );
    
    return {
      id: place.place_id || `place-${index}`,
      name: place.name,
      specialty: getSpecialty(place.types),
      address: place.vicinity || place.formatted_address,
      phone: place.formatted_phone_number || 'Call for appointment',
      rating: place.rating || 4.0,
      distance: formatDistance(distance),
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      openNow: place.opening_hours?.open_now,
      photoUrl: place.photos?.[0]?.photo_reference 
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
        : undefined
    };
  });
};

const getSpecialty = (types: string[]): string => {
  if (types?.includes('psychologist')) return 'Clinical Psychologist';
  if (types?.includes('psychiatrist')) return 'Psychiatrist';
  if (types?.includes('counselor')) return 'Licensed Counselor';
  return 'Mental Health Professional';
};

// Mock data for demo mode
const getMockTherapists = (userLat: number, userLng: number): Therapist[] => {
  const mockTherapists = [
    {
      id: '1',
      name: 'Dr. Sarah Mitchell',
      specialty: 'Clinical Psychologist - CBT Specialist',
      address: '123 Wellness Center, Main Street',
      phone: '+1 (555) 123-4567',
      rating: 4.9,
      location: { lat: userLat + 0.008, lng: userLng + 0.005 },
      openNow: true
    },
    {
      id: '2',
      name: 'Dr. James Chen',
      specialty: 'Psychiatrist - Anxiety & Depression',
      address: '456 Mental Health Clinic, Oak Avenue',
      phone: '+1 (555) 234-5678',
      rating: 4.8,
      location: { lat: userLat - 0.012, lng: userLng + 0.008 },
      openNow: true
    },
    {
      id: '3',
      name: 'Dr. Emily Rodriguez',
      specialty: 'Licensed Marriage & Family Therapist',
      address: '789 Healing Space, Elm Street',
      phone: '+1 (555) 345-6789',
      rating: 4.7,
      location: { lat: userLat + 0.015, lng: userLng - 0.010 },
      openNow: false
    },
    {
      id: '4',
      name: 'Dr. Michael Thompson',
      specialty: 'DBT Certified Therapist',
      address: '321 Mindful Center, Pine Road',
      phone: '+1 (555) 456-7890',
      rating: 4.9,
      location: { lat: userLat - 0.005, lng: userLng - 0.015 },
      openNow: true
    },
    {
      id: '5',
      name: 'Dr. Amanda Foster',
      specialty: 'Trauma & PTSD Specialist',
      address: '654 Recovery Institute, Cedar Lane',
      phone: '+1 (555) 567-8901',
      rating: 4.6,
      location: { lat: userLat + 0.020, lng: userLng + 0.018 },
      openNow: true
    },
    {
      id: '6',
      name: 'Serenity Mental Health Clinic',
      specialty: 'Comprehensive Mental Health Services',
      address: '987 Tranquil Way, Birch Boulevard',
      phone: '+1 (555) 678-9012',
      rating: 4.5,
      location: { lat: userLat - 0.018, lng: userLng + 0.022 },
      openNow: false
    },
    {
      id: '7',
      name: 'Dr. Robert Kim',
      specialty: 'Child & Adolescent Psychiatrist',
      address: '147 Youth Wellness Center, Maple Drive',
      phone: '+1 (555) 789-0123',
      rating: 4.8,
      location: { lat: userLat + 0.025, lng: userLng - 0.008 },
      openNow: true
    },
    {
      id: '8',
      name: 'Mindful Living Counseling',
      specialty: 'Mindfulness-Based Therapy',
      address: '258 Zen Plaza, Willow Street',
      phone: '+1 (555) 890-1234',
      rating: 4.7,
      location: { lat: userLat - 0.010, lng: userLng - 0.025 },
      openNow: true
    }
  ];

  return mockTherapists.map(t => ({
    ...t,
    distance: formatDistance(calculateDistance(userLat, userLng, t.location.lat, t.location.lng))
  })).sort((a, b) => {
    const distA = parseFloat(a.distance || '0');
    const distB = parseFloat(b.distance || '0');
    return distA - distB;
  });
};

// Get directions URL
export const getDirectionsUrl = (
  destLat: number,
  destLng: number,
  destName: string
): string => {
  const destination = encodeURIComponent(`${destLat},${destLng}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${encodeURIComponent(destName)}`;
};

// Geocode address to coordinates
export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  if (!GOOGLE_MAPS_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].geometry.location;
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

