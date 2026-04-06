import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Calendar, Droplets, Thermometer, Wind, Download, TrendingUp, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HistoricalReportsPage = () => {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [irrigationReport, setIrrigationReport] = useState(null);
  const [waterReport, setWaterReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sensor');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchReports(); }, [days]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [sensorRes, irrigRes, waterRes] = await Promise.all([
        axios.get(`${API}/reports/historical?days=${days}`, { headers }),
        axios.get(`${API}/reports/irrigation-history?days=${days}`, { headers }),
        axios.get(`${API}/reports/water-efficiency?days=${days}`, { headers }),
      ]);
      setReport(sensorRes.data);
      setIrrigationReport(irrigRes.data);
      setWaterReport(waterRes.data);
    } catch (e) { console.error('Report fetch error:', e); }
    finally { setLoading(false); }
  };

  const handleExport = () => {
    const data = { sensor: report, irrigation: irrigationReport, water: waterReport };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aquasense_report_${days}days.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'sensor', label: 'Sensor Data', icon: Activity },
    { id: 'irrigation', label: 'Irrigation', icon: Droplets },
    { id: 'water', label: 'Water Efficiency', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">Historical Reports</h1>
          <p className="text-lg text-slate-600">Analyze trends and patterns over time</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-xl p-1" data-testid="days-selector">
            {[7, 30, 90, 180].map(d => (
              <Button key={d} variant={days === d ? "default" : "ghost"} size="sm"
                className={`rounded-lg ${days === d ? 'bg-sky-600 text-white' : 'text-slate-600'}`}
                onClick={() => setDays(d)} data-testid={`days-${d}`}>
                {d}d
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="rounded-xl" data-testid="export-btn">
            <Download size={16} className="mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {tabs.map(tab => (
          <Button key={tab.id} variant="ghost" size="sm"
            className={`rounded-lg flex items-center gap-2 ${activeTab === tab.id ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-500'}`}
            onClick={() => setActiveTab(tab.id)} data-testid={`tab-${tab.id}`}>
            <tab.icon size={16} />{tab.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading reports...</div>
      ) : (
        <>
          {/* Sensor Data Tab */}
          {activeTab === 'sensor' && report && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Soil Moisture', data: report.summary?.soil_moisture, icon: Droplets, color: 'cyan', unit: '%' },
                  { label: 'Temperature', data: report.summary?.temperature, icon: Thermometer, color: 'rose', unit: '\u00B0C' },
                  { label: 'Humidity', data: report.summary?.humidity, icon: Wind, color: 'sky', unit: '%' },
                ].map(({ label, data, icon: Icon, color, unit }) => (
                  <Card key={label} className={`p-5 rounded-2xl border-2 border-${color}-200 bg-gradient-to-br from-${color}-50 to-white`} data-testid={`summary-${label.toLowerCase().replace(' ', '-')}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`text-${color}-600`} size={20} />
                      <span className="font-semibold text-slate-900">{label}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><p className="text-xs text-slate-500">Min</p><p className="text-lg font-bold text-slate-900">{data?.min ?? 0}{unit}</p></div>
                      <div><p className="text-xs text-slate-500">Avg</p><p className={`text-lg font-bold text-${color}-700`}>{data?.avg ?? 0}{unit}</p></div>
                      <div><p className="text-xs text-slate-500">Max</p><p className="text-lg font-bold text-slate-900">{data?.max ?? 0}{unit}</p></div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Chart */}
              <Card className="p-6 rounded-2xl border-2 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Averages ({days} days)</h3>
                {report.daily_chart?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={report.daily_chart}>
                      <defs>
                        <linearGradient id="smGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} /><stop offset="95%" stopColor="#06B6D4" stopOpacity={0} /></linearGradient>
                        <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} /><stop offset="95%" stopColor="#F43F5E" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '2px solid #e2e8f0' }} />
                      <Legend />
                      <Area type="monotone" dataKey="soil_moisture" name="Soil Moisture %" stroke="#06B6D4" strokeWidth={2} fill="url(#smGrad)" />
                      <Area type="monotone" dataKey="temperature" name="Temperature C" stroke="#F43F5E" strokeWidth={2} fill="url(#tempGrad)" />
                      <Area type="monotone" dataKey="humidity" name="Humidity %" stroke="#0EA5E9" strokeWidth={2} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center py-12 text-slate-400">No data available for this period</p>
                )}
                <p className="text-xs text-slate-500 mt-2">Total readings: {report.summary?.total_readings ?? 0}</p>
              </Card>
            </motion.div>
          )}

          {/* Irrigation Tab */}
          {activeTab === 'irrigation' && irrigationReport && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 rounded-2xl border-2 border-sky-200 bg-sky-50 text-center">
                  <p className="text-sm text-slate-600 mb-1">Total Irrigations</p>
                  <p className="text-3xl font-bold text-sky-700">{irrigationReport.summary?.total_irrigations ?? 0}</p>
                </Card>
                <Card className="p-5 rounded-2xl border-2 border-cyan-200 bg-cyan-50 text-center">
                  <p className="text-sm text-slate-600 mb-1">Total Water Used</p>
                  <p className="text-3xl font-bold text-cyan-700">{irrigationReport.summary?.total_water_used ?? 0} L/m\u00B2</p>
                </Card>
                <Card className="p-5 rounded-2xl border-2 border-red-200 bg-red-50 text-center">
                  <p className="text-sm text-slate-600 mb-1">Critical Events</p>
                  <p className="text-3xl font-bold text-red-700">{irrigationReport.summary?.critical_events ?? 0}</p>
                </Card>
              </div>

              <Card className="p-6 rounded-2xl border-2 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Irrigation Logs</h3>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {irrigationReport.logs?.length > 0 ? irrigationReport.logs.map((log, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${log.status === 'critical' ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-900">{log.recommendation?.substring(0, 60)}...</span>
                        <span className="text-xs text-slate-500">{log.timestamp?.substring(0, 16)}</span>
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-slate-600">
                        <span>Water: {log.water_quantity} L/m\u00B2</span>
                        <span>Stress: {log.crop_stress_level}</span>
                        <span className={`font-semibold ${log.status === 'critical' ? 'text-red-600' : 'text-slate-600'}`}>{log.status}</span>
                      </div>
                    </div>
                  )) : <p className="text-center py-8 text-slate-400">No irrigation logs for this period</p>}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Water Efficiency Tab */}
          {activeTab === 'water' && waterReport && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-5 rounded-2xl border-2 border-cyan-200 bg-cyan-50 text-center">
                  <p className="text-sm text-slate-600 mb-1">Avg Efficiency</p>
                  <p className="text-3xl font-bold text-cyan-700">{waterReport.summary?.avg_efficiency ?? 0}%</p>
                </Card>
                <Card className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 text-center">
                  <p className="text-sm text-slate-600 mb-1">Water Saved</p>
                  <p className="text-3xl font-bold text-emerald-700">{waterReport.summary?.savings_percent ?? 0}%</p>
                </Card>
                <Card className="p-5 rounded-2xl border-2 border-sky-200 bg-sky-50 text-center">
                  <p className="text-sm text-slate-600 mb-1">Total Used</p>
                  <p className="text-3xl font-bold text-sky-700">{waterReport.summary?.total_water_used ?? 0} L</p>
                </Card>
                <Card className="p-5 rounded-2xl border-2 border-teal-200 bg-teal-50 text-center">
                  <p className="text-sm text-slate-600 mb-1">Total Saved</p>
                  <p className="text-3xl font-bold text-teal-700">{waterReport.summary?.total_water_saved ?? 0} L</p>
                </Card>
              </div>

              <Card className="p-6 rounded-2xl border-2 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Water Efficiency</h3>
                {waterReport.analytics?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={waterReport.analytics.slice(0, 30).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.substring(5, 10)} />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '2px solid #e2e8f0' }} />
                      <Legend />
                      <Bar dataKey="water_used" name="Water Used (L)" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="water_saved" name="Water Saved (L)" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center py-12 text-slate-400">No water efficiency data for this period</p>}
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoricalReportsPage;
