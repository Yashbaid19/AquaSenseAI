import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Bot, MapPin, Leaf, Camera, Activity } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RoverMonitoringPage = () => {
  const [roverData, setRoverData] = useState(null);
  const [cropHealth, setCropHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoverData();
  }, []);

  const fetchRoverData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const healthResponse = await axios.get(`${API}/rover/health`, { headers });
      setCropHealth(healthResponse.data);
      
      // Mock rover position data
      setRoverData({
        position: { x: 45.2, y: 23.8, zone: "Zone B" },
        status: "Active",
        battery: 87
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-500 border-t-transparent"></div>
      </div>
    );
  }

  const getHealthColor = (health) => {
    if (health === 'Healthy') return 'emerald';
    if (health === 'Stressed' || health === 'Mild Stress') return 'cyan';
    return 'red';
  };

  return (
    <div data-testid="rover-page" className="space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">
          Rover Monitoring
        </h1>
        <p className="text-lg text-slate-600">
          Ground-level crop health analysis
        </p>
      </div>

      {/* Rover Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50">
            <Bot className="text-sky-600 mb-3" size={24} />
            <h3 className="text-sm font-medium text-slate-600 mb-2">Rover Status</h3>
            <p className="text-2xl font-heading font-bold text-sky-700">{roverData?.status}</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50">
            <MapPin className="text-cyan-600 mb-3" size={24} />
            <h3 className="text-sm font-medium text-slate-600 mb-2">Current Zone</h3>
            <p className="text-2xl font-heading font-bold text-cyan-700">{roverData?.position?.zone}</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
            <Activity className="text-blue-600 mb-3" size={24} />
            <h3 className="text-sm font-medium text-slate-600 mb-2">Battery Level</h3>
            <p className="text-2xl font-heading font-bold text-blue-700">{roverData?.battery}%</p>
          </Card>
        </motion.div>
      </div>

      {/* Camera Feed and Crop Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="overflow-hidden rounded-2xl border-2 border-slate-200">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449"
                alt="Rover Camera Feed"
                className="w-full h-80 object-cover"
              />
              <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-cyan-500 text-white text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  LIVE FEED
                </div>
              </div>
              <div className="absolute bottom-4 right-4 px-3 py-1 rounded-lg bg-black/60 text-white text-xs">
                Simulated Camera Feed
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="text-cyan-600" size={20} />
                <h3 className="text-xl font-heading font-semibold text-slate-900">Camera Feed</h3>
              </div>
              <p className="text-sm text-slate-600">Real-time ground-level crop monitoring</p>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className={`p-6 rounded-2xl border-2 border-${getHealthColor(cropHealth?.health)}-200 bg-gradient-to-br from-${getHealthColor(cropHealth?.health)}-50 to-${getHealthColor(cropHealth?.health)}-100`}>
            <div className="flex items-center gap-2 mb-6">
              <Leaf className={`text-${getHealthColor(cropHealth?.health)}-600`} size={24} />
              <h3 className="text-xl font-heading font-semibold text-slate-900">Crop Health Analysis</h3>
            </div>
            
            <div className="space-y-6">
              <div className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-xl">
                <p className="text-sm text-slate-600 mb-2">Health Status</p>
                <p className={`text-4xl font-heading font-bold text-${getHealthColor(cropHealth?.health)}-700 mb-2`}>
                  {cropHealth?.health}
                </p>
                <p className="text-sm text-slate-600">
                  Confidence: <span className="font-semibold">{(cropHealth?.confidence * 100).toFixed(0)}%</span>
                </p>
              </div>

              <div className="p-4 bg-white/70 backdrop-blur-sm rounded-xl">
                <p className="text-sm font-medium text-slate-700 mb-3">Indicators:</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Leaf Color:</span>
                    <span className="text-sm font-semibold text-slate-900">{cropHealth?.indicators?.leaf_color}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Wilting:</span>
                    <span className="text-sm font-semibold text-slate-900">{cropHealth?.indicators?.wilting}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Growth Rate:</span>
                    <span className="text-sm font-semibold text-slate-900">{cropHealth?.indicators?.growth_rate}</span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl bg-${getHealthColor(cropHealth?.health)}-100 border border-${getHealthColor(cropHealth?.health)}-200`}>
                <p className="text-sm font-medium text-slate-900 mb-2">Recommended Action:</p>
                <p className="text-sm text-slate-700">{cropHealth?.action}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Position Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6 rounded-2xl border-2 border-slate-200">
          <h3 className="text-xl font-heading font-semibold text-slate-900 mb-4">Rover Position</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200">
              <p className="text-sm text-slate-600 mb-1">X Coordinate</p>
              <p className="text-2xl font-heading font-bold text-cyan-700">{roverData?.position?.x}</p>
            </div>
            <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200">
              <p className="text-sm text-slate-600 mb-1">Y Coordinate</p>
              <p className="text-2xl font-heading font-bold text-cyan-700">{roverData?.position?.y}</p>
            </div>
            <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200">
              <p className="text-sm text-slate-600 mb-1">Current Zone</p>
              <p className="text-2xl font-heading font-bold text-cyan-700">{roverData?.position?.zone}</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default RoverMonitoringPage;
