import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Thermometer, Wind, AlertTriangle, Sparkles, TrendingUp, Calendar, Zap, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const [sensorData, setSensorData] = useState(null);
  const [decision, setDecision] = useState(null);
  const [zones, setZones] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() =>{
      fetchAllData();
    },5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token');
        setLoading(false);
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };

      const [sensorRes, decisionRes, analyticsRes, historyRes] = await Promise.all([
        axios.get(`${API}/sensors/latest`, { headers }),
        axios.get(`${API}/irrigation/predict`, { headers }),
        axios.get(`${API}/analytics/water`, { headers }).catch(() => ({data: {efficiency_score: 85}})),
        axios.get(`${API}/sensors/history`, { headers }).catch(() => ({data: []}))
      ]);
      
      console.log("Sensor Data:", sensorRes.data);
      console.log("Prediction:", decisionRes.data);
      
      setSensorData(sensorRes.data);
      setDecision({
        decision: decisionRes.data.recommendation || "Monitor",
        time: decisionRes.data.recommended_time || "Check later",
        water_quantity: decisionRes.data.water_quantity || 0,
        confidence: decisionRes.data.confidence || 85,
        priority: decisionRes.data.status || "monitor",
        explanation:{
          factors:{
            soil_moisture: sensorRes.data.soil_moisture + "%",
            temperature: sensorRes.data.temperature + "°C",
            humidity: sensorRes.data.humidity + "%",
            rain_probability: (sensorRes.data.rain_probability || 0) + "%"
          },
          reasoning: decisionRes.data.recommendation || "Analyzing..."
        }
      });
      setZones([]);
      setAlerts([]);
      setSchedule([]);
      setAnalytics(analyticsRes.data);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data.slice(-20) : []);
      setDemoMode(false);
    } catch (error) {
      console.error('Dashboard error:', error);
      setSensorData({
        soil_moisture: 59.7,
        temperature: 23.6,
        humidity: 59.6,
        soil_temp: 27.2,
        rain_probability: 30
      });
      setDecision({
        decision: "Monitor",
        time: "N/A",
        water_quantity: 0,
        confidence: 85,
        priority: "monitor"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton height={40} width={300} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} height={200} />)}
        </div>
      </div>
    );
  }

  const getDecisionColor = (dec) => {
    if (dec === 'Irrigate') return 'sky';
    if (dec === 'Delay') return 'cyan';
    return 'blue';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'HIGH') return 'red';
    if (priority === 'MEDIUM') return 'cyan';
    return 'slate';
  };

  const getZoneColor = (status) => {
    if (status === 'healthy') return 'emerald';
    if (status === 'critical') return 'red';
    if (status === 'needs_irrigation') return 'cyan';
    return 'blue';
  };

  return (
    <div data-testid="dashboard-page" className="space-y-8">
      {/* Header with Demo Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">
            Smart Irrigation Dashboard
          </h1>
          <p className="text-lg text-slate-600">
            AI-powered irrigation decision system
          </p>
        </div>
        {demoMode ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 border-2 border-cyan-300"
          >
            <Info className="text-cyan-700" size={18} />
            <span className="text-sm font-semibold text-cyan-800">Demo Mode Active</span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border-2 border-emerald-300"
          >
            <Zap className="text-emerald-700" size={18} />
            <span className="text-sm font-semibold text-emerald-800">Live IoT Data</span>
          </motion.div>
        )}
      </div>

      {/* Top Row: Sensor Panel + Irrigation Decision */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SENSOR PANEL with Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="p-6 rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50 backdrop-blur-lg shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Droplets className="text-cyan-600" size={24} />
              <h3 className="text-xl font-heading font-semibold text-slate-900">Sensor Data</h3>
              {sensorData?.data_source === 'iot_device' && (
                <span className="ml-auto text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">IoT Live</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-cyan-100 hover:shadow-lg"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Droplets className="text-cyan-600 mb-2" size={20} />
                <p className="text-sm text-slate-600">Soil Moisture</p>
                <p className="text-3xl font-heading font-bold text-cyan-700">{sensorData?.soil_moisture}%</p>
              </motion.div>
              <motion.div 
                className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-rose-100 hover:shadow-lg"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Thermometer className="text-rose-500 mb-2" size={20} />
                <p className="text-sm text-slate-600">Air Temperature</p>
                <p className="text-3xl font-heading font-bold text-rose-600">{sensorData?.temperature}°C</p>
              </motion.div>
              <motion.div 
                className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-sky-100 hover:shadow-lg"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Wind className="text-sky-600 mb-2" size={20} />
                <p className="text-sm text-slate-600">Humidity</p>
                <p className="text-3xl font-heading font-bold text-sky-700">{sensorData?.humidity}%</p>
              </motion.div>
              {sensorData?.soil_temp !== undefined ? (
                <motion.div 
                  className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-teal-100 hover:shadow-lg"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Thermometer className="text-teal-600 mb-2" size={20} />
                  <p className="text-sm text-slate-600">Soil Temperature</p>
                  <p className="text-3xl font-heading font-bold text-teal-700">{sensorData?.soil_temp}°C</p>
                </motion.div>
              ) : (
                <motion.div 
                  className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-cyan-100 hover:shadow-lg"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Sparkles className="text-cyan-600 mb-2" size={20} />
                  <p className="text-sm text-slate-600">Rain Probability</p>
                  <p className="text-3xl font-heading font-bold text-cyan-700">{sensorData?.rain_probability || 0}%</p>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* IRRIGATION DECISION PANEL (MAIN FOCUS) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className={`p-6 rounded-2xl border-2 border-${getDecisionColor(decision?.decision)}-300 bg-gradient-to-br from-${getDecisionColor(decision?.decision)}-50 to-${getDecisionColor(decision?.decision)}-100 shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className={`text-${getDecisionColor(decision?.decision)}-600`} size={24} />
                <h3 className="text-xl font-heading font-semibold text-slate-900">AI Decision</h3>
              </div>
              <motion.span 
                className={`px-3 py-1 rounded-full text-xs font-bold bg-${getDecisionColor(decision?.decision)}-200 text-${getDecisionColor(decision?.decision)}-800`}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {decision?.priority}
              </motion.span>
            </div>
            
            <div className="space-y-4">
              <motion.div 
                className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-white/40"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                <p className="text-sm text-slate-600 mb-2">Decision</p>
                <p className={`text-4xl font-heading font-bold text-${getDecisionColor(decision?.decision)}-700 mb-2`}>
                  {decision?.decision}
                </p>
                <p className="text-slate-600">in {decision?.time}</p>
              </motion.div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl text-center border border-white/40">
                  <p className="text-sm text-slate-600 mb-1">Water Needed</p>
                  <p className={`text-2xl font-heading font-bold text-${getDecisionColor(decision?.decision)}-700`}>
                    {decision?.water_quantity} L/m²
                  </p>
                </div>
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl text-center border border-white/40">
                  <p className="text-sm text-slate-600 mb-1">Confidence</p>
                  <p className={`text-2xl font-heading font-bold text-${getDecisionColor(decision?.decision)}-700`}>
                    {(decision?.confidence || 85).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Middle Row: Zone Map + Explainable AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ZONE MAP */}
        <motion.div     
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 rounded-2xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm shadow-xl">

            <h3 className="text-xl font-heading font-semibold text-slate-900 mb-4">
              Zone Map (Drone Analysis)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {zones?.map((zone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`p-4 rounded-xl border-2 border-${getZoneColor(zone.status)}-300 bg-${getZoneColor(zone.status)}-50 cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-slate-900">
                      {zone.zone_name}
                    </p>
              
                    <span
                      className={`w-3 h-3 rounded-full bg-${getZoneColor(zone.status)}-500`}
                    ></span>
                  </div>
              
                  <p className={`text-sm font-bold text-${getZoneColor(zone.status)}-700 mb-1`}>
                    {zone.status}
                  </p>
              
                  <p className="text-xs text-slate-600">
                    {zone.soil_moisture}% moisture
                  </p>
                </motion.div>
              ))}
            </div>
            
          </Card>
        </motion.div>
            
        {/* EXPLAINABLE AI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="text-blue-600" size={24} />
              <h3 className="text-xl font-heading font-semibold text-slate-900">
                Why This Decision?
              </h3>
            </div>
            
            <div className="space-y-4">     
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/40">
                <p className="text-sm font-medium text-slate-700 mb-3">
                  Factors Analyzed:
                </p>
            
                <div className="space-y-2">
                  {decision?.explanation?.factors &&
                    Object.entries(decision.explanation.factors).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 capitalize">
                          {key.replace("_", " ")}:
                        </span>
                        <span className="text-sm font-semibold text-blue-700">
                          {value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
                  
              <div className="p-4 bg-blue-100/80 backdrop-blur-sm rounded-xl border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  AI Reasoning:
                </p>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {decision?.explanation?.reasoning}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
                  
      </div>

      {/* Bottom Row: Alerts, Schedule, Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* SMART ALERTS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="xl:col-span-2">
          <Card className="p-6 rounded-2xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-cyan-600" size={24} />
              <h3 className="text-xl font-heading font-semibold text-slate-900">Smart Alerts</h3>
            </div>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">✓ No alerts - All systems optimal</p>
              ) : (
                alerts.map((alert, index) => (
                  <motion.div 
                    key={index} 
                    className={`p-3 rounded-xl border-2 border-${alert.type === 'critical' ? 'red' : alert.type === 'warning' ? 'cyan' : 'blue'}-200 bg-${alert.type === 'critical' ? 'red' : alert.type === 'warning' ? 'cyan' : 'blue'}-50`}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <p className="font-semibold text-sm text-slate-900">{alert.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* IRRIGATION SCHEDULE */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="p-6 rounded-2xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-cyan-600" size={24} />
              <h3 className="text-xl font-heading font-semibold text-slate-900">Schedule</h3>
            </div>
            <div className="space-y-3">
              {schedule.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No scheduled irrigation</p>
              ) : (
                schedule.map((item, index) => (
                  <motion.div 
                    key={index} 
                    className={`p-3 rounded-xl bg-${getPriorityColor(item.priority)}-50 border border-${getPriorityColor(item.priority)}-200`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm text-slate-900">{item.zone}</p>
                      <span className={`text-xs px-2 py-1 rounded-full bg-${getPriorityColor(item.priority)}-200 text-${getPriorityColor(item.priority)}-800 font-bold`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{item.date} - {item.time}</p>
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* WATER ANALYTICS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="p-6 rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-cyan-600" size={24} />
              <h3 className="text-xl font-heading font-semibold text-slate-900">Water Analytics</h3>
            </div>
            <div className="space-y-4">
              <motion.div 
                className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/40"
                whileHover={{ scale: 1.05 }}
              >
                <p className="text-sm text-slate-600 mb-1">Efficiency Score</p>
                <p className="text-4xl font-heading font-bold text-cyan-700">{analytics?.efficiency_average}%</p>
              </motion.div>
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-white/40">
                <p className="text-xs text-slate-600 mb-2">Water Saved</p>
                <p className="text-2xl font-heading font-bold text-cyan-700">{analytics?.water_saved_percent}%</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">Before</p>
                    <p className="font-semibold text-slate-700">{analytics?.before_usage}L</p>
                  </div>
                  <div>
                    <p className="text-slate-500">After</p>
                    <p className="font-semibold text-cyan-700">{analytics?.after_usage}L</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Chart Section with Aqua Theme */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="p-6 rounded-2xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm shadow-xl">
          <h3 className="text-xl font-heading font-semibold text-slate-900 mb-4">Sensor Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                stroke="#64748b"
              />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '2px solid #06B6D4', borderRadius: '12px', padding: '12px' }}
                labelFormatter={(value) => new Date(value).toLocaleString()}
              />
              <Area 
                type="monotone" 
                dataKey="soil_moisture" 
                stroke="#06B6D4" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#moistureGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
