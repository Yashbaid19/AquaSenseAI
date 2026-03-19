import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Bot, MapPin, Leaf, Camera, Activity } from 'lucide-react';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

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
      <div className="space-y-6">
        <Skeleton height={40} width={300} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} height={200} />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton height={400} />
          <Skeleton height={400} />
        </div>
      </div>
    );
  }

  const getHealthColor = (health) => {
    if (health === 'Healthy') return 'emerald';
    if (health === 'Stressed' || health === 'Mild Stress') return 'cyan';
    return 'red';
  };

  const healthColor = getHealthColor(cropHealth?.health);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">
          Rover Monitoring
        </h1>
        <p className="text-lg text-slate-600">
          Ground-level crop health analysis
        </p>
      </div>

      {/* Rover Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="text-emerald-600" size={24} />
            <h3 className="text-lg font-heading font-semibold text-slate-900">Rover Status</h3>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{roverData?.status}</p>
        </Card>

        <Card className="p-6 rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="text-sky-600" size={24} />
            <h3 className="text-lg font-heading font-semibold text-slate-900">Current Zone</h3>
          </div>
          <p className="text-2xl font-bold text-sky-700">{roverData?.position?.zone}</p>
        </Card>

        <Card className="p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-blue-600" size={24} />
            <h3 className="text-lg font-heading font-semibold text-slate-900">Battery Level</h3>
          </div>
          <p className="text-2xl font-bold text-blue-700">{roverData?.battery}%</p>
        </Card>
      </div>

      {/* Camera Feed and Crop Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl border-2 border-slate-200 overflow-hidden">
          <div className="relative mb-4">
            <img
              src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449"
              alt="Rover Camera Feed"
              className="w-full h-[300px] object-cover rounded-xl"
            />
            <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              LIVE FEED
            </div>
            <div className="absolute bottom-4 left-4 px-3 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-semibold text-slate-700">
              Simulated Camera Feed
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Camera className="text-slate-600" size={20} />
            <div>
              <h3 className="text-lg font-heading font-semibold text-slate-900">Camera Feed</h3>
              <p className="text-sm text-slate-600">Real-time ground-level crop monitoring</p>
            </div>
          </div>
        </Card>

        <Card className={`p-6 rounded-2xl border-2 border-${healthColor}-200 bg-gradient-to-br from-${healthColor}-50 to-white`}>
          <div className="flex items-center gap-2 mb-4">
            <Leaf className={`text-${healthColor}-600`} size={24} />
            <h3 className="text-xl font-heading font-semibold text-slate-900">Crop Health Analysis</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">Health Status</p>
              <p className={`text-3xl font-heading font-bold text-${healthColor}-700 mb-1`}>{cropHealth?.health}</p>
              <p className="text-sm text-slate-500">Confidence: {(cropHealth?.confidence * 100).toFixed(0)}%</p>
            </div>
            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-2">Indicators:</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Leaf Color:</span>
                  <span className="font-semibold text-slate-900">{cropHealth?.indicators?.leaf_color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Wilting:</span>
                  <span className="font-semibold text-slate-900">{cropHealth?.indicators?.wilting}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Growth Rate:</span>
                  <span className="font-semibold text-slate-900">{cropHealth?.indicators?.growth_rate}</span>
                </div>
              </div>
            </div>
            <div className={`pt-4 border-t border-${healthColor}-200`}>
              <p className="text-sm font-semibold text-slate-700 mb-2">Recommended Action:</p>
              <p className={`text-sm text-${healthColor}-700 font-medium`}>{cropHealth?.action}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Position Info */}
      <Card className="p-6 rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50">
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="text-cyan-600" size={24} />
          <h3 className="text-xl font-heading font-semibold text-slate-900">Rover Position</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-600 mb-2">X Coordinate</p>
            <p className="text-2xl font-bold text-cyan-700">{roverData?.position?.x}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-2">Y Coordinate</p>
            <p className="text-2xl font-bold text-cyan-700">{roverData?.position?.y}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-2">Current Zone</p>
            <p className="text-2xl font-bold text-cyan-700">{roverData?.position?.zone}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RoverMonitoringPage;