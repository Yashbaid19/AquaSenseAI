import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Droplets, TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WaterAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/analytics/water`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
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
          {[1, 2, 3].map(i => <Skeleton key={i} height={150} />)}
        </div>
        <Skeleton height={400} />
        <Skeleton height={400} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">
          Water Analytics
        </h1>
        <p className="text-lg text-slate-600">
          Track irrigation efficiency and water savings
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50">
            <div className="flex items-center gap-2 mb-4">
              <Droplets className="text-sky-600" size={24} />
              <h3 className="text-lg font-heading font-semibold text-slate-900">Total Water Saved</h3>
            </div>
            <p className="text-4xl font-heading font-bold text-sky-700 mb-2">
              {analytics?.water_saved_total?.toFixed(0)} L
            </p>
            <p className="text-sm text-emerald-600 font-medium">↑ 28% vs last month</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-emerald-600" size={24} />
              <h3 className="text-lg font-heading font-semibold text-slate-900">Efficiency Average</h3>
            </div>
            <p className="text-4xl font-heading font-bold text-emerald-700 mb-2">
              {analytics?.efficiency_average?.toFixed(1)}%
            </p>
            <p className="text-sm text-emerald-600 font-medium">↑ 35% improvement</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="text-blue-600" size={24} />
              <h3 className="text-lg font-heading font-semibold text-slate-900">Days Tracked</h3>
            </div>
            <p className="text-4xl font-heading font-bold text-blue-700 mb-2">
              {analytics?.history?.length || 0}
            </p>
            <p className="text-sm text-blue-600 font-medium">Continuous monitoring</p>
          </Card>
        </motion.div>
      </div>

      {/* Water Usage Chart */}
      <Card className="p-6 rounded-2xl border-2 border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <Droplets className="text-sky-600" size={24} />
          <h3 className="text-xl font-heading font-semibold text-slate-900">Water Usage Trend</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics?.history || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              stroke="#64748b"
            />
            <YAxis stroke="#64748b" />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Line
              type="monotone"
              dataKey="water_used"
              stroke="#0ea5e9"
              strokeWidth={3}
              dot={{ fill: '#0ea5e9', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Efficiency Chart */}
      <Card className="p-6 rounded-2xl border-2 border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-emerald-600" size={24} />
          <h3 className="text-xl font-heading font-semibold text-slate-900">Irrigation Efficiency</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics?.history || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              stroke="#64748b"
            />
            <YAxis stroke="#64748b" />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Bar
              dataKey="efficiency"
              fill="#10b981"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default WaterAnalyticsPage;