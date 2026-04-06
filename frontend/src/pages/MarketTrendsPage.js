import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CROPS = ['rice','wheat','tomato','onion','cotton','soybean','coffee','mango','potato','banana'];

const MarketTrendsPage = () => {
  const [crop, setCrop] = useState('rice');
  const [frequency, setFrequency] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/market/trends?crop=${crop}&frequency=${frequency}`);
      setData(res.data);
    } catch { toast.error('Failed to load trends'); }
    finally { setLoading(false); }
  };

  const chartData = data ? [
    ...data.history.map(h => ({ ...h, type: 'history' })),
    ...data.predictions.map(p => ({ ...p, predicted: p.price, type: 'prediction' }))
  ] : [];

  return (
    <div data-testid="market-trends-page" className="space-y-6">
      <div>
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-1">Market Trends</h1>
        <p className="text-base text-slate-600">Price history and predictions for agricultural commodities</p>
      </div>

      <Card className="p-5 rounded-2xl border-2 border-slate-200">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Crop</label>
            <select value={crop} onChange={e => setCrop(e.target.value)} className="px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-cyan-400 focus:outline-none text-sm capitalize" data-testid="select-crop">
              {CROPS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Frequency</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value)} className="px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-cyan-400 focus:outline-none text-sm" data-testid="select-frequency">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <Button onClick={fetchTrends} disabled={loading} className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl px-6" data-testid="fetch-trends-btn">
            {loading ? 'Loading...' : 'Get Trends'}
          </Button>
        </div>
      </Card>

      {data && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 rounded-2xl border-2 border-slate-200 text-center">
              <p className="text-xs text-slate-500 mb-1">Current Price</p>
              <p className="text-3xl font-heading font-bold text-slate-900">Rs {data.current_price?.toLocaleString()}</p>
              <p className="text-xs text-slate-500">per quintal</p>
            </Card>
            <Card className="p-5 rounded-2xl border-2 border-slate-200 text-center">
              <p className="text-xs text-slate-500 mb-1">30-Day Average</p>
              <p className="text-3xl font-heading font-bold text-cyan-700">Rs {data.average_price?.toLocaleString()}</p>
              <p className="text-xs text-slate-500">per quintal</p>
            </Card>
            <Card className={`p-5 rounded-2xl border-2 text-center ${data.predicted_change >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
              <p className="text-xs text-slate-500 mb-1">Predicted Change (7d)</p>
              <div className="flex items-center justify-center gap-2">
                {data.predicted_change >= 0 ? <TrendingUp className="text-emerald-600" size={24} /> : <TrendingDown className="text-red-600" size={24} />}
                <p className={`text-3xl font-heading font-bold ${data.predicted_change >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{data.predicted_change > 0 ? '+' : ''}{data.predicted_change}%</p>
              </div>
            </Card>
          </div>

          <Card className="p-5 rounded-2xl border-2 border-slate-200" data-testid="trends-chart">
            <h3 className="text-base font-heading font-semibold text-slate-900 mb-4">Last 30 Days + 7-Day Prediction</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`Rs ${v}`, 'Price']} />
                <Area type="monotone" dataKey="price" stroke="#0891b2" fill="url(#histGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="predicted" stroke="#10b981" fill="url(#predGrad)" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-3 text-xs text-slate-500">
              <div className="flex items-center gap-1"><span className="w-4 h-0.5 bg-cyan-600" />History</div>
              <div className="flex items-center gap-1"><span className="w-4 h-0.5 bg-emerald-500 border-dashed" style={{borderTop:'2px dashed #10b981',height:0}} />Prediction</div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default MarketTrendsPage;
