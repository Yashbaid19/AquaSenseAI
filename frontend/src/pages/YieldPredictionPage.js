import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CROPS = ['rice','wheat','maize','cotton','sugarcane','soybean','groundnut','tomato','potato','onion','banana','mango','apple','coffee','tea'];
const SOIL_OPTS = ['poor','average','good','excellent'];

const YieldPredictionPage = () => {
  const [form, setForm] = useState({ crop_type: 'rice', area_hectares: 2, rainfall_mm: 800, avg_temp: 28, soil_quality: 'good' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/yield/predict`, form, { headers: { Authorization: `Bearer ${token}` } });
      setResult(res.data);
    } catch {
      toast.error('Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="yield-prediction-page" className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-1">Yield Prediction</h1>
        <p className="text-base text-slate-600">Estimate expected crop yield based on conditions</p>
      </div>

      <Card className="p-6 rounded-2xl border-2 border-slate-200">
        <h3 className="text-lg font-heading font-semibold text-slate-900 mb-5">Input Parameters</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Crop Type</label>
            <select value={form.crop_type} onChange={e => setForm(p => ({ ...p, crop_type: e.target.value }))} className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-cyan-400 focus:outline-none text-sm capitalize" data-testid="input-crop-type">
              {CROPS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Farm Area (hectares)</label>
            <input type="number" value={form.area_hectares} onChange={e => setForm(p => ({ ...p, area_hectares: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-cyan-400 focus:outline-none text-sm" data-testid="input-area" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Expected Rainfall (mm)</label>
            <input type="number" value={form.rainfall_mm} onChange={e => setForm(p => ({ ...p, rainfall_mm: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-cyan-400 focus:outline-none text-sm" data-testid="input-rainfall" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Avg Temperature (\u00B0C)</label>
            <input type="number" value={form.avg_temp} onChange={e => setForm(p => ({ ...p, avg_temp: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-cyan-400 focus:outline-none text-sm" data-testid="input-temp" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Soil Quality</label>
            <select value={form.soil_quality} onChange={e => setForm(p => ({ ...p, soil_quality: e.target.value }))} className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-cyan-400 focus:outline-none text-sm capitalize" data-testid="input-soil">
              {SOIL_OPTS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
        </div>
        <Button onClick={handlePredict} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl py-3" data-testid="predict-yield-btn">
          {loading ? 'Calculating...' : 'Predict Yield'}
        </Button>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50" data-testid="yield-result">
            <div className="text-center mb-5">
              <TrendingUp className="mx-auto text-cyan-600 mb-2" size={36} />
              <h2 className="text-4xl font-heading font-bold text-cyan-700">{result.yield_per_acre?.toLocaleString()} <span className="text-lg">kg/acre</span></h2>
              <p className="text-sm text-slate-600 mt-1">Total: {result.total_yield_kg?.toLocaleString()} kg from {result.area_hectares} hectares</p>
              <p className="text-xs text-slate-500 mt-1">{result.model_type}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Soil Factor', val: result.factors?.soil },
                { label: 'Rain Factor', val: result.factors?.rain },
                { label: 'Temp Factor', val: result.factors?.temp },
              ].map(f => (
                <div key={f.label} className="text-center p-3 bg-white/70 rounded-xl">
                  <p className="text-xs text-slate-500">{f.label}</p>
                  <p className="text-lg font-bold text-slate-800">{f.val}x</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default YieldPredictionPage;
