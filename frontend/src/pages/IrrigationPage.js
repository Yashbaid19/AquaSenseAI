import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Droplets, Clock, AlertCircle, Cloud, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const IrrigationPage = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrediction();
    const interval = setInterval(fetchPrediction, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchPrediction = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/irrigation/predict`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Irrigation prediction:', response.data);
      setPrediction(response.data);
    } catch (error) {
      console.error('Error fetching irrigation prediction:', error);
      // Set demo data
      setPrediction({
        recommendation: "Light irrigation recommended",
        recommended_time: "In 4-6 hours",
        water_quantity: 15.0,
        crop_stress_level: "Moderate",
        rain_forecast: "30% chance",
        current_soil_moisture: 59.7,
        status: "schedule"
      });
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

  const getStatusConfig = (status) => {
    switch (status) {
      case 'optimal':
        return {
          color: 'emerald',
          bgClass: 'bg-gradient-to-br from-emerald-50 to-green-100',
          borderClass: 'border-emerald-300',
          textClass: 'text-emerald-700',
          iconClass: 'text-emerald-600',
          title: 'Optimal Conditions'
        };
      case 'schedule':
        return {
          color: 'cyan',
          bgClass: 'bg-gradient-to-br from-cyan-50 to-blue-100',
          borderClass: 'border-cyan-300',
          textClass: 'text-cyan-700',
          iconClass: 'text-cyan-600',
          title: 'Irrigation Recommended'
        };
      case 'critical':
        return {
          color: 'red',
          bgClass: 'bg-gradient-to-br from-red-50 to-rose-100',
          borderClass: 'border-red-300',
          textClass: 'text-red-700',
          iconClass: 'text-red-600',
          title: 'Immediate Action Required'
        };
      default:
        return {
          color: 'slate',
          bgClass: 'bg-gradient-to-br from-slate-50 to-gray-100',
          borderClass: 'border-slate-300',
          textClass: 'text-slate-700',
          iconClass: 'text-slate-600',
          title: 'Monitoring'
        };
    }
  };

  const statusConfig = getStatusConfig(prediction?.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">
            Irrigation Intelligence
          </h1>
          <p className="text-lg text-slate-600">
            AI-powered irrigation recommendations based on real-time sensor data
          </p>
        </div>
        <Button onClick={fetchPrediction} variant="outline" size="sm">
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={`p-8 rounded-2xl border-2 ${statusConfig.borderClass} ${statusConfig.bgClass}`}>
          <div className="flex items-center gap-4">
            <AlertCircle className={statusConfig.iconClass} size={48} />
            <div>
              <h2 className="text-3xl font-heading font-bold text-slate-900 mb-2">
                {statusConfig.title}
              </h2>
              <p className={`text-lg ${statusConfig.textClass}`}>
                {prediction?.recommendation || "Analyzing conditions..."}
              </p>
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
          <p className="text-2xl font-bold text-sky-700">
            {prediction?.recommended_time || "N/A"}
          </p>
        </Card>

        <Card className="p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="text-blue-600" size={24} />
            <h3 className="text-lg font-heading font-semibold text-slate-900">Water Required</h3>
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {prediction?.water_quantity || 0} L/m²
          </p>
        </Card>

        <Card className="p-6 rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-cyan-600" size={24} />
            <h3 className="text-lg font-heading font-semibold text-slate-900">Crop Stress Level</h3>
          </div>
          <p className="text-2xl font-bold text-cyan-700">
            {prediction?.crop_stress_level || "Low"}
          </p>
        </Card>

        <Card className="p-6 rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <Cloud className="text-slate-600" size={24} />
            <h3 className="text-lg font-heading font-semibold text-slate-900">Rain Forecast</h3>
          </div>
          <p className="text-2xl font-bold text-slate-700">
            {prediction?.rain_forecast || "0% chance"}
          </p>
        </Card>
      </div>

      {/* Current Conditions */}
      <Card className="p-6 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
        <h3 className="text-xl font-heading font-semibold text-slate-900 mb-6">Current Conditions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-600 mb-2">Soil Moisture</p>
            <p className="text-4xl font-heading font-bold text-emerald-700">
              {prediction?.current_soil_moisture || 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-2">Status</p>
            <p className={`text-2xl font-semibold ${statusConfig.textClass}`}>
              {(prediction?.status || "monitor").toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-2">AI Recommendation</p>
            <p className="text-base text-slate-700">
              {prediction?.recommendation || "Analyzing sensor data..."}
            </p>
          </div>
        </div>
      </Card>

      {/* Additional Info */}
      <Card className="p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <h3 className="text-xl font-heading font-semibold text-slate-900 mb-4">
          💡 Smart Insights
        </h3>
        <div className="space-y-2 text-slate-700">
          <p>
            • Based on real-time ESP32 sensor data
          </p>
          <p>
            • Considers current weather conditions and rain forecast
          </p>
          <p>
            • Updates automatically every 30 seconds
          </p>
          <p>
            • AI-powered decision making for optimal crop health
          </p>
        </div>
      </Card>
    </div>
  );
};

export default IrrigationPage;
