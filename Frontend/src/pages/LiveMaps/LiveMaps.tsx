import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';
import { Loader } from '../../components/Loader/Loader';
import { Breadcrumb } from '../../components/Tables/Tables';
import { FiTruck, FiNavigation } from 'react-icons/fi';

declare const L: any;

const CITY_COORDINATES: Record<string, [number, number]> = {
  'Mumbai': [19.0760, 72.8777],
  'Delhi': [28.7041, 77.1025],
  'Bangalore': [12.9716, 77.5946],
  'Chennai': [13.0827, 80.2707],
  'Kolkata': [22.5726, 88.3639],
  'Hyderabad': [17.3850, 78.4867],
  'Pune': [18.5204, 73.8567],
  'Ahmedabad': [23.0225, 72.5714],
  'Jaipur': [26.9124, 75.7873],
  'Surat': [21.1702, 72.8311],
  'Lucknow': [26.8467, 80.9462],
  'Nagpur': [21.1458, 79.0882],
  'Indore': [22.7196, 75.8577],
  'Bhopal': [23.2599, 77.4126],
  'Patna': [25.5941, 85.1376],
  'Vadodara': [22.3072, 73.1812],
  'Ludhiana': [30.9010, 75.8573],
  'Agra': [27.1767, 78.0081],
  'Kochi': [9.9312, 76.2673]
};

// Fallback coordinate generator for seed cities that are not explicitly matched
const getCityCoords = (cityName: string): [number, number] => {
  const normalized = cityName.trim();
  if (CITY_COORDINATES[normalized]) {
    return CITY_COORDINATES[normalized];
  }
  // Generate semi-random coordinates inside India based on name characters hash
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = 15 + Math.abs((hash % 1500) / 100);
  const lng = 72 + Math.abs(((hash >> 3) % 1500) / 100);
  return [lat, lng];
};

interface ActiveTrip {
  id: number;
  source: string;
  destination: string;
  status: string;
  planned_distance_km: string;
  vehicle?: {
    registration_number: string;
    name_model: string;
  };
  driver?: {
    name: string;
    contact_number: string;
  };
}

export const LiveMaps: React.FC = () => {
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<ActiveTrip | null>(null);
  
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<number, any>>({});
  const polylinesRef = useRef<Record<number, any>>({});
  const progressIntervalRef = useRef<any>(null);
  
  const [progressTracker, setProgressTracker] = useState<Record<number, number>>({});

  const breadcrumbItems = [
    { label: 'TransitOps', href: '/' },
    { label: 'Live Telemetry Map', active: true }
  ];

  const fetchActiveTrips = async () => {
    try {
      const res = await api.get('/trips');
      const active = (res.data.data || []).filter((t: any) => t.status === 'Dispatched');
      setTrips(active);
      
      // Initialize progress percentage for active trips
      setProgressTracker(prev => {
        const next: Record<number, number> = { ...prev };
        active.forEach((t: any) => {
          if (next[t.id] === undefined) {
            // Start at a semi-random starting point or 10%
            next[t.id] = 10 + (t.id % 4) * 15; 
          }
        });
        return next;
      });
    } catch (err) {
      console.error('Error fetching active dispatches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTrips();
    const interval = setInterval(fetchActiveTrips, 15000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (loading) return;

    if (!mapRef.current) {
      // Map center on India
      mapRef.current = L.map('live-telemetry-map', {
        center: [22.9734, 78.6569],
        zoom: 5
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);
    }

    return () => {
      // Clean up map instance on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loading]);

  // Animate and update vehicle markers
  useEffect(() => {
    if (!mapRef.current || trips.length === 0) return;

    const map = mapRef.current;

    // Remove obsolete markers and lines
    const activeTripIds = new Set(trips.map(t => t.id));
    Object.keys(markersRef.current).forEach(idKey => {
      const id = Number(idKey);
      if (!activeTripIds.has(id)) {
        if (markersRef.current[id]) map.removeLayer(markersRef.current[id]);
        if (polylinesRef.current[id]) map.removeLayer(polylinesRef.current[id]);
        delete markersRef.current[id];
        delete polylinesRef.current[id];
      }
    });

    // Draw active trips
    trips.forEach(t => {
      const sourceCoords = getCityCoords(t.source);
      const destCoords = getCityCoords(t.destination);
      const progress = (progressTracker[t.id] || 25) / 100;

      // Calculate current location along the line
      const lat = sourceCoords[0] + (destCoords[0] - sourceCoords[0]) * progress;
      const lng = sourceCoords[1] + (destCoords[1] - sourceCoords[1]) * progress;

      // 1. Draw Polyline
      if (!polylinesRef.current[t.id]) {
        polylinesRef.current[t.id] = L.polyline([sourceCoords, destCoords], {
          color: '#3b82f6',
          weight: 2.5,
          dashArray: '5, 8',
          opacity: 0.6
        }).addTo(map);
      }

      // 2. Draw Marker
      const popupText = `
        <div style="font-family: inherit; font-size: 11px;">
          <h4 style="font-weight: 800; margin: 0; color: #1e293b;">Trip ID: #${t.id}</h4>
          <p style="margin: 3px 0; font-weight: bold; color: #2563eb;">${t.source} &rarr; ${t.destination}</p>
          <p style="margin: 2px 0;"><b>Vehicle:</b> ${t.vehicle?.registration_number || 'N/A'}</p>
          <p style="margin: 2px 0;"><b>Driver:</b> ${t.driver?.name || 'N/A'}</p>
          <p style="margin: 2px 0;"><b>Progress:</b> ${(progress * 100).toFixed(0)}%</p>
        </div>
      `;

      if (!markersRef.current[t.id]) {
        // Red dot inside circle to mimic tracking beacon
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="relative flex items-center justify-center w-5 h-5 bg-blue-500/20 border border-blue-500 rounded-full shadow-lg shadow-blue-500/40">
                  <div class="w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping absolute"></div>
                  <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                 </div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        markersRef.current[t.id] = L.marker([lat, lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(popupText);
      } else {
        markersRef.current[t.id].setLatLng([lat, lng]);
        markersRef.current[t.id].setPopupContent(popupText);
      }
    });

  }, [trips, progressTracker]);

  // Handle Incremental position tracking animation
  useEffect(() => {
    progressIntervalRef.current = setInterval(() => {
      setProgressTracker(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          const id = Number(key);
          if (next[id] < 100) {
            next[id] = Math.min(100, next[id] + 0.5); // move 0.5% every second
          } else {
            next[id] = 0; // reset/loop simulated route coordinates
          }
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(progressIntervalRef.current);
  }, []);

  const handleCenterTrip = (t: ActiveTrip) => {
    setSelectedTrip(t);
    const sourceCoords = getCityCoords(t.source);
    const destCoords = getCityCoords(t.destination);
    const progress = (progressTracker[t.id] || 25) / 100;

    const lat = sourceCoords[0] + (destCoords[0] - sourceCoords[0]) * progress;
    const lng = sourceCoords[1] + (destCoords[1] - sourceCoords[1]) * progress;

    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 7);
      if (markersRef.current[t.id]) {
        markersRef.current[t.id].openPopup();
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Breadcrumb items={breadcrumbItems} />
          <h2 className="text-xl font-bold text-slate-800">Live Asset Tracking Map</h2>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <Loader />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden p-3.5 min-h-[550px]">
          
          {/* Sidebar Active Trips list */}
          <div className="lg:col-span-1 border-r border-slate-100 pr-3 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <FiNavigation className="text-blue-500 animate-pulse w-4 h-4" />
                <span>Active Dispatches ({trips.length})</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Click dispatch card to focus map telemetry</p>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {trips.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                  No active dispatches are currently in transit.
                </div>
              ) : (
                trips.map(t => {
                  const isActive = selectedTrip?.id === t.id;
                  const prog = progressTracker[t.id] || 0;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleCenterTrip(t)}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer transition duration-150 text-left ${
                        isActive 
                          ? 'bg-blue-50/50 border-blue-200 text-blue-900 shadow-sm' 
                          : 'bg-slate-50 hover:bg-slate-100/70 border-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-extrabold text-[10px] text-slate-400">ID: #{t.id}</span>
                        <span className="text-[8px] bg-blue-100/70 text-blue-700 font-bold px-1.5 py-0.2 rounded-full uppercase">
                          {t.status}
                        </span>
                      </div>
                      
                      <p className="font-bold text-slate-800">
                        {t.source} &rarr; {t.destination}
                      </p>

                      <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-200/50 text-[9px] text-slate-550">
                        <div>
                          <span className="font-bold text-slate-400 block uppercase">Plate</span>
                          <span className="font-extrabold text-slate-700 truncate block">{t.vehicle?.registration_number}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-400 block uppercase">Driver</span>
                          <span className="font-extrabold text-slate-700 truncate block">{t.driver?.name}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-2.5 space-y-1">
                        <div className="flex justify-between text-[8px] font-bold text-slate-400">
                          <span>Progress</span>
                          <span>{prog.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Map display */}
          <div className="lg:col-span-3 h-[500px] lg:h-full rounded-2xl overflow-hidden relative border border-slate-150">
            <div id="live-telemetry-map" className="w-full h-full z-10" />
            
            {/* Legend card overlay */}
            <div className="absolute bottom-4 left-4 z-20 bg-white/95 border border-slate-200 backdrop-blur p-3.5 rounded-2xl shadow-lg flex items-center space-x-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                <span className="font-bold">Beacons Active</span>
              </div>
              <div className="border-l border-slate-200 h-4" />
              <div className="flex items-center gap-1.5 text-slate-450">
                <FiTruck className="w-4 h-4 text-blue-500" />
                <span className="font-semibold">Transit Ops Fleet</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
