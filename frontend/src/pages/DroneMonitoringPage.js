import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Plane, AlertTriangle, MapPin } from 'lucide-react';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DroneMonitoringPage = () => {
  const [droneData, setDroneData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDroneData();
  }, []);

  const fetchDroneData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/drone/latest`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDroneData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton height={40} width={300} />
        <Skeleton height={400} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton height={300} />
          <Skeleton height={300} />
        </div>
      </div>
    );
  }

  const getZoneColor = (status) => {
    if (status === 'Healthy') return 'emerald';
    if (status === 'Dry') return 'red';
    if (status === 'Overwatered') return 'blue';
    return 'cyan';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">
            Drone Monitoring
          </h1>
          <p className="text-lg text-slate-600">
            Aerial imagery analysis and zone identification
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border-2 border-emerald-300">
          <Plane className="text-emerald-700" size={18} />
          <span className="text-sm font-semibold text-emerald-800">Last Scan: Just Now</span>
        </div>
      </div>

      {/* Drone Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6 rounded-2xl border-2 border-sky-200 overflow-hidden">
          <div className="relative">
            <img
              src={droneData?.image_url}
              alt="Drone Field View"
              className="w-full h-[400px] object-cover rounded-xl"
            />
            <div className="absolute top-4 right-4 px-4 py-2 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200">
              <p className="text-sm font-semibold text-slate-700">Simulated Drone Analysis</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Analysis Results */}
        <Card className="p-6 rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-cyan-600" size={24} />
            <h3 className="text-xl font-heading font-semibold text-slate-900">AI Analysis</h3>
          </div>
          <p className="text-slate-700 mb-6">{droneData?.analysis_result}</p>
          
          <div>
            <h4 className="text-lg font-semibold text-slate-900 mb-3">Dry Zones Detected</h4>
            <div className="space-y-2">
              {droneData?.dry_zones?.map((zone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg"
                >
                  <MapPin className="text-red-600" size={18} />
                  <span className="font-semibold text-red-700">{zone}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>

        {/* Zone Details */}
        <Card className="p-6 rounded-2xl border-2 border-slate-200">
          <h3 className="text-xl font-heading font-semibold text-slate-900 mb-4">Zone Details</h3>
          <div className="space-y-3">
            {droneData?.zones && Object.entries(droneData.zones).map(([name, data], index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border-2 border-${getZoneColor(data.status)}-200 bg-${getZoneColor(data.status)}-50`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-900">{name}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${getZoneColor(data.status)}-100 text-${getZoneColor(data.status)}-700`}>
                    {data.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  Moisture: <span className="font-semibold">{data.moisture_level}%</span>
                </p>
                <p className="text-sm text-slate-600">
                  Action: <span className="font-semibold">{data.action}</span>
                </p>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Heatmap Info */}
      <Card className="p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="mb-4">
          <h3 className="text-xl font-heading font-semibold text-slate-900">Irrigation Heatmap Legend</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-100 border-2 border-emerald-300 rounded-xl">
            <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
            <div>
              <p className="font-semibold text-emerald-900">Healthy Zones</p>
              <p className="text-sm text-emerald-700">Optimal moisture levels</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-cyan-100 border-2 border-cyan-300 rounded-xl">
            <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
            <div>
              <p className="font-semibold text-cyan-900">Moderate Zones</p>
              <p className="text-sm text-cyan-700">Requires monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-red-100 border-2 border-red-300 rounded-xl">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <div>
              <p className="font-semibold text-red-900">Critical Zones</p>
              <p className="text-sm text-red-700">Immediate irrigation needed</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DroneMonitoringPage;
