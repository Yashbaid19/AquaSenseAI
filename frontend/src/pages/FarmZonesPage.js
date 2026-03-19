import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FarmZonesPage = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/zones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setZones(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getZoneColor = (status) => {
    switch (status) {
      case 'healthy': case 'optimal': return 'emerald';
      case 'needs_irrigation': return 'cyan';
      case 'critical': return 'red';
      default: return 'slate';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton height={40} width={300} />
        <Skeleton height={400} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} height={200} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">
          Farm Zone Monitoring
        </h1>
        <p className="text-lg text-slate-600">
          Interactive farm map with zone health status
        </p>
      </div>

      {/* Farm Map Visualization */}
      <Card className="p-6 rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50">
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="text-sky-600" size={24} />
          <h3 className="text-xl font-heading font-semibold text-slate-900">Farm Map</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {zones.map((zone, index) => {
            const color = getZoneColor(zone.status);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-xl border-2 border-${color}-300 bg-${color}-50 hover:shadow-lg transition-shadow`}
              >
                <h4 className="font-heading font-semibold text-slate-900 mb-2">{zone.zone_name}</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-600">Soil Moisture</p>
                    <p className={`text-2xl font-bold text-${color}-700`}>{zone.soil_moisture}%</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-${color}-100 text-${color}-700 text-center`}>
                    {zone.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Zone Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {zones.map((zone, index) => {
          const color = getZoneColor(zone.status);
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-6 rounded-2xl border-2 border-${color}-200 bg-gradient-to-br from-${color}-50 to-white`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-heading font-semibold text-slate-900">{zone.zone_name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${color}-100 text-${color}-700`}>
                    {zone.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600">Soil Moisture Level</p>
                    <p className={`text-3xl font-heading font-bold text-${color}-700`}>{zone.soil_moisture}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Coordinates</p>
                    <p className="text-sm font-mono text-slate-700">
                      {zone.coordinates?.lat?.toFixed(4)}, {zone.coordinates?.lng?.toFixed(4)}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default FarmZonesPage;