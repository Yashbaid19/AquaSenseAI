import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Droplets, Clock, AlertCircle, Cloud } from 'lucide-react';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const IrrigationPage = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrediction();
  }, []);

  const fetchPrediction = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/irrigation/predict`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrediction(response.data);
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
        <Skeleton height={150} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} height={200} />)}
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'optimal': return 'emerald';
      case 'schedule': return 'cyan';
      case 'critical': return 'red';
      default: return 'slate';
    }
  };

  const statusColor = getStatusColor(prediction?.status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">
          Irrigation Intelligence
        </h1>
        <p className="text-lg text-slate-600">
          AI-powered irrigation recommendations
        </p>
      </div>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={`p-8 rounded-2xl border-2 border-${statusColor}-300 bg-gradient-to-br from-${statusColor}-50 to-${statusColor}-100`}>
          <div className="flex items-center gap-4">
            <AlertCircle className={`text-${statusColor}-600`} size={48} />
            <div>
              <h2 className={`text-3xl font-heading font-bold text-${statusColor}-900 mb-2`}>
                {prediction?.status === 'optimal' && 'Optimal Conditions'}
                {prediction?.status === 'schedule' && 'Irrigation Recommended'}
                {prediction?.status === 'critical' && 'Immediate Action Required'}
              </h2>
              <p className={`text-lg text-${statusColor}-700`}>{prediction?.recommendation}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-sky-600" size={24} />
            <h3 className="text-lg font-heading font-semibold text-slate-900">Recommended Time</h3>
          </div>
          <p className="text-2xl font-bold text-sky-700">{prediction?.recommended_time}</p>
        </Card>

        <Card className="p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="text-blue-600" size={24} />
            <h3 className="text-lg font-heading font-semibold text-slate-900">Water Required</h3>
          </div>
          <p className="text-2xl font-bold text-blue-700">{prediction?.water_quantity} L/m²</p>
        </Card>

        <Card className="p-6 rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-cyan-600" size={24} />
            <h3 className="text-lg font-heading font-semibold text-slate-900">Crop Stress Level</h3>
          </div>
          <p className="text-2xl font-bold text-cyan-700">{prediction?.crop_stress_level}</p>
        </Card>

        <Card className="p-6 rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <Cloud className="text-slate-600" size={24} />
            <h3 className="text-lg font-heading font-semibold text-slate-900">Rain Forecast</h3>
          </div>
          <p className="text-2xl font-bold text-slate-700">{prediction?.rain_forecast}</p>
        </Card>
      </div>

      {/* Current Conditions */}
      <Card className="p-6 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
        <h3 className="text-xl font-heading font-semibold text-slate-900 mb-6">Current Conditions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-600 mb-2">Soil Moisture</p>
            <p className="text-4xl font-heading font-bold text-emerald-700">{prediction?.current_soil_moisture}%</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-2">Status</p>
            <p className={`text-2xl font-semibold text-${statusColor}-700`}>{prediction?.status.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-2">Recommendation</p>
            <p className="text-base text-slate-700">{prediction?.recommendation}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default IrrigationPage;