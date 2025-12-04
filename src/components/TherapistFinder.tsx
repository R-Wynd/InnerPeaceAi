import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Star, 
  Navigation, 
  Clock, 
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { getCurrentLocation, searchNearbyTherapists, getDirectionsUrl } from '../services/geoService';
import type { Therapist } from '../types';
import './TherapistFinder.css';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
    { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
    { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
  ]
};

const TherapistFinder: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchRadius] = useState(10); // km
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ['places']
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map);
  }, []);

  useEffect(() => {
    fetchLocationAndTherapists();
  }, []);

  const fetchLocationAndTherapists = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const position = await getCurrentLocation();
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      setUserLocation(location);
      
      const nearbyTherapists = await searchNearbyTherapists(
        location.lat, 
        location.lng, 
        searchRadius * 1000
      );
      setTherapists(nearbyTherapists);
      
      if (mapRef) {
        mapRef.panTo(location);
        mapRef.setZoom(13);
      }
    } catch (err: any) {
      console.error('Location error:', err);
      if (err.code === 1) {
        setError('Location access denied. Please enable location services to find nearby therapists.');
      } else {
        setError('Unable to get your location. Using default location.');
      }
      // Use default location
      setUserLocation(defaultCenter);
      const nearbyTherapists = await searchNearbyTherapists(
        defaultCenter.lat,
        defaultCenter.lng,
        searchRadius * 1000
      );
      setTherapists(nearbyTherapists);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTherapistClick = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    if (mapRef) {
      mapRef.panTo(therapist.location);
      mapRef.setZoom(15);
    }
  };

  const handleGetDirections = (therapist: Therapist) => {
    const url = getDirectionsUrl(therapist.location.lat, therapist.location.lng, therapist.name);
    window.open(url, '_blank');
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        fill={i < Math.floor(rating) ? '#fbbf24' : 'transparent'}
        stroke={i < Math.floor(rating) ? '#fbbf24' : 'rgba(255,255,255,0.3)'}
      />
    ));
  };

  if (loadError) {
    return (
      <div className="therapist-finder-container">
        <div className="error-state">
          <AlertCircle size={48} />
          <h3>Map loading error</h3>
          <p>Unable to load Google Maps. Please check your API key.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="therapist-finder-container">
      <div className="finder-header">
        <div className="header-content">
          <h2><MapPin size={28} /> Find Therapists</h2>
          <p>Connect with licensed professionals near you</p>
        </div>
        <button 
          className="refresh-btn"
          onClick={fetchLocationAndTherapists}
          disabled={isLoading}
        >
          <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
        </button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="error-banner"
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </motion.div>
      )}

      <div className="finder-content">
        {/* Map Section */}
        <div className="map-section">
          {!isLoaded ? (
            <div className="map-loading">
              <Loader2 className="spinning" size={32} />
              <span>Loading map...</span>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={userLocation || defaultCenter}
              zoom={13}
              options={mapOptions}
              onLoad={onMapLoad}
            >
              {/* User Location Marker */}
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#6366f1',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 3
                  }}
                />
              )}

              {/* Therapist Markers */}
              {therapists.map((therapist) => (
                <Marker
                  key={therapist.id}
                  position={therapist.location}
                  onClick={() => handleTherapistClick(therapist)}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: selectedTherapist?.id === therapist.id ? '#22c55e' : '#ec4899',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2
                  }}
                />
              ))}

              {/* Info Window */}
              {selectedTherapist && (
                <InfoWindow
                  position={selectedTherapist.location}
                  onCloseClick={() => setSelectedTherapist(null)}
                >
                  <div className="info-window">
                    <h4>{selectedTherapist.name}</h4>
                    <p>{selectedTherapist.specialty}</p>
                    <div className="info-rating">
                      {renderStars(selectedTherapist.rating)}
                      <span>{selectedTherapist.rating}</span>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>

        {/* Therapists List */}
        <div className="therapists-list">
          <div className="list-header">
            <h3>Nearby Therapists</h3>
            <span className="count">{therapists.length} found</span>
          </div>

          {isLoading ? (
            <div className="list-loading">
              <Loader2 className="spinning" size={24} />
              <span>Finding therapists...</span>
            </div>
          ) : therapists.length === 0 ? (
            <div className="empty-list">
              <Search size={36} />
              <p>No therapists found in your area</p>
              <span>Try increasing the search radius</span>
            </div>
          ) : (
            <div className="therapist-cards">
              <AnimatePresence>
                {therapists.map((therapist, index) => (
                  <motion.div
                    key={therapist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`therapist-card ${selectedTherapist?.id === therapist.id ? 'selected' : ''}`}
                    onClick={() => handleTherapistClick(therapist)}
                  >
                    <div className="card-header">
                      <div className="therapist-avatar">
                        {therapist.name.charAt(0)}
                      </div>
                      <div className="therapist-info">
                        <h4>{therapist.name}</h4>
                        <p className="specialty">{therapist.specialty}</p>
                        <div className="rating">
                          {renderStars(therapist.rating)}
                          <span>{therapist.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-details">
                      <div className="detail-item">
                        <MapPin size={14} />
                        <span>{therapist.address}</span>
                      </div>
                      <div className="detail-item">
                        <Navigation size={14} />
                        <span>{therapist.distance} away</span>
                      </div>
                      {therapist.openNow !== undefined && (
                        <div className={`status-badge ${therapist.openNow ? 'open' : 'closed'}`}>
                          <Clock size={12} />
                          <span>{therapist.openNow ? 'Open Now' : 'Closed'}</span>
                        </div>
                      )}
                    </div>

                    <div className="card-actions">
                      <button 
                        className="action-btn call"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(therapist.phone);
                        }}
                      >
                        <Phone size={16} />
                        <span>Call</span>
                      </button>
                      <button 
                        className="action-btn directions"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGetDirections(therapist);
                        }}
                      >
                        <ExternalLink size={16} />
                        <span>Directions</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Crisis Banner */}
      <div className="crisis-banner">
        <AlertCircle size={18} />
        <span>
          If you're in crisis, call <strong>988</strong> (Suicide & Crisis Lifeline) or text <strong>HOME</strong> to <strong>741741</strong>
        </span>
      </div>
    </div>
  );
};

export default TherapistFinder;

