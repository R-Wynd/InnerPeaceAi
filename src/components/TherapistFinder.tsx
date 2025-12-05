import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getCurrentLocation, 
  searchNearbyTherapists, 
  formatDistance,
  getDirectionsUrl 
} from '../services/geoService';
import type { Therapist } from '../types';
import './TherapistFinder.css';

const TherapistFinder: React.FC = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [searchRadius, setSearchRadius] = useState(10000);

  useEffect(() => {
    fetchLocationAndTherapists();
  }, []);

  const fetchLocationAndTherapists = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const position = await getCurrentLocation();
      const coords = position.coords;
      setLocation({ lat: coords.latitude, lng: coords.longitude });
      
      const results = await searchNearbyTherapists(
        coords.latitude,
        coords.longitude,
        searchRadius
      );
      setTherapists(results);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('denied')) {
          setError('Please enable location access to find therapists near you 📍');
        } else {
          setError('Unable to get location. Showing sample results.');
        }
      }
      // Still show mock data on error
      const results = await searchNearbyTherapists(40.7128, -74.006, searchRadius);
      setTherapists(results);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRadiusChange = async (newRadius: number) => {
    setSearchRadius(newRadius);
    if (location) {
      setIsLoading(true);
      const results = await searchNearbyTherapists(
        location.lat,
        location.lng,
        newRadius
      );
      setTherapists(results);
      setIsLoading(false);
    }
  };

  const getSpecialtyColor = (specialty: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      'Anxiety & Depression': { bg: '#dbeafe', text: '#1e40af' },
      'Trauma & PTSD': { bg: '#fce7f3', text: '#9d174d' },
      'Relationships': { bg: '#d1fae5', text: '#065f46' },
      'Stress Management': { bg: '#fef3c7', text: '#92400e' },
      'CBT Specialist': { bg: '#e0e7ff', text: '#3730a3' },
      'Family Therapy': { bg: '#ede9fe', text: '#5b21b6' }
    };
    return colors[specialty] || { bg: '#f3f4f6', text: '#374151' };
  };

  const radiusOptions = [
    { value: 5000, label: '5 km' },
    { value: 10000, label: '10 km' },
    { value: 20000, label: '20 km' },
    { value: 50000, label: '50 km' }
  ];

  return (
    <div className="therapist-finder">
      {/* Header */}
      <div className="finder-header">
        <div className="header-content">
          <h1>Find Support 🏥</h1>
          <p>Licensed therapists near you</p>
        </div>
        <button 
          className="refresh-btn"
          onClick={fetchLocationAndTherapists}
          disabled={isLoading}
        >
          🔄
        </button>
      </div>

      {/* Radius Filter */}
      <div className="filter-section">
        <span className="filter-label">📍 Search radius</span>
        <div className="radius-options">
          {radiusOptions.map((option) => (
            <button
              key={option.value}
              className={`radius-btn ${searchRadius === option.value ? 'active' : ''}`}
              onClick={() => handleRadiusChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="error-banner"
        >
          <span>⚠️</span>
          <span>{error}</span>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Finding therapists near you...</p>
        </div>
      )}

      {/* Therapist List */}
      {!isLoading && (
        <div className="therapists-list">
          <AnimatePresence>
            {therapists.map((therapist, index) => (
              <motion.div
                key={therapist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`therapist-card ${selectedTherapist?.id === therapist.id ? 'expanded' : ''}`}
                onClick={() => setSelectedTherapist(
                  selectedTherapist?.id === therapist.id ? null : therapist
                )}
              >
                <div className="therapist-main">
                  <div className="therapist-avatar">
                    <span>👨‍⚕️</span>
                  </div>
                  <div className="therapist-info">
                    <h3>{therapist.name}</h3>
                    <p className="therapist-title">{therapist.specialties[0]}</p>
                    <div className="therapist-meta">
                      {therapist.rating && (
                        <span className="rating">
                          ⭐ {therapist.rating.toFixed(1)}
                        </span>
                      )}
                      {therapist.distance && (
                        <span className="distance">
                          📍 {formatDistance(therapist.distance)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="expand-icon">
                    {selectedTherapist?.id === therapist.id ? '▲' : '▼'}
                  </span>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedTherapist?.id === therapist.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="therapist-details"
                    >
                      <div className="details-section">
                        <h4>Specialties</h4>
                        <div className="specialties-list">
                          {therapist.specialties.map((specialty, i) => {
                            const colors = getSpecialtyColor(specialty);
                            return (
                              <span 
                                key={i} 
                                className="specialty-tag"
                                style={{ 
                                  backgroundColor: colors.bg, 
                                  color: colors.text 
                                }}
                              >
                                {specialty}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="details-section">
                        <h4>📍 Address</h4>
                        <p>{therapist.address}</p>
                      </div>

                      {therapist.phone && (
                        <div className="details-section">
                          <h4>📞 Phone</h4>
                          <p>{therapist.phone}</p>
                        </div>
                      )}

                      {therapist.website && (
                        <div className="details-section">
                          <h4>🌐 Website</h4>
                          <a 
                            href={therapist.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="website-link"
                          >
                            Visit website →
                          </a>
                        </div>
                      )}

                      <div className="action-buttons">
                        {therapist.phone && (
                          <a 
                            href={`tel:${therapist.phone}`}
                            className="action-btn call-btn"
                          >
                            📞 Call
                          </a>
                        )}
                        <a 
                          href={getDirectionsUrl(
                            therapist.location.lat,
                            therapist.location.lng,
                            therapist.name
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn directions-btn"
                        >
                          🗺️ Directions
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          {therapists.length === 0 && !isLoading && (
            <div className="empty-state">
              <span className="empty-emoji">🔍</span>
              <h3>No therapists found</h3>
              <p>Try expanding your search radius</p>
            </div>
          )}
        </div>
      )}

      {/* Help Footer */}
      <div className="help-footer">
        <div className="help-card">
          <span className="help-emoji">🆘</span>
          <div className="help-content">
            <h4>Need immediate help?</h4>
            <p>Call <strong>988</strong> for crisis support</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistFinder;
