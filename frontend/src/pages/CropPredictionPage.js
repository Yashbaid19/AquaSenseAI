import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf, Zap, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CropPredictionPage = () => {
  const [form, setForm] = useState({ nitrogen: '', potassium: '', phosphorus: '', temperature: '', humidity: '', rainfall: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fillFromSensors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/sensors/latest`, { headers: { Authorization: `Bearer ${token}` } });
      const d = res.data;
      setForm(prev => ({
        ...prev,
        temperature: d.temperature || 28,
        humidity: d.humidity || 65,
        rainfall: d.soil_moisture || 35,
        nitrogen: prev.nitrogen || 80,
        potassium: prev.potassium || 40,
        phosphorus: prev.phosphorus || 40,
      }));
      toast.success('Sensor data loaded! NPK set to demo values (no NPK sensor).');
    } catch {
      setForm({ nitrogen: 80, potassium: 40, phosphorus: 40, temperature: 28, humidity: 65, rainfall: 200 });
      toast.info('Using demo sensor values');
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        nitrogen: parseFloat(form.nitrogen) || 80,
        potassium: parseFloat(form.potassium) || 40,
        phosphorus: parseFloat(form.phosphorus) || 40,
        temperature: parseFloat(form.temperature) || 28,
        humidity: parseFloat(form.humidity) || 65,
        rainfall: parseFloat(form.rainfall) || 200,
      };
      const res = await axios.post(`${API}/crop/predict`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setResult(res.data);
    } catch {
      toast.error('Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="crop-prediction-page" className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-1">Crop Prediction</h1>
        <p className="text-base text-slate-600">AI-powered crop recommendation based on soil and weather data</p>
      </div>

      <Card className="p-6 rounded-2xl border-2 border-slate-200">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-heading font-semibold text-slate-900">Input Parameters</h3>
          <Button onClick={fillFromSensors} variant="outline" className="text-sm rounded-xl border-cyan-300 text-cyan-700 hover:bg-cyan-50" data-testid="use-sensor-btn">
            <Zap size={16} className="mr-1" /> Use Sensor Data
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
          {[
            { key: 'nitrogen', label: 'Nitrogen (N)', placeholder: '80' },
            { key: 'phosphorus', label: 'Phosphorus (P)', placeholder: '40' },
            { key: 'potassium', label: 'Potassium (K)', placeholder: '40' },
            { key: 'temperature', label: 'Temperature (\u00B0C)', placeholder: '28' },
            { key: 'humidity', label: 'Humidity (%)', placeholder: '65' },
            { key: 'rainfall', label: 'Rainfall (mm)', placeholder: '200' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">{f.label}</label>
              <input
                type="number"
                value={form[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-cyan-400 focus:outline-none text-sm"
                data-testid={`input-${f.key}`}
              />
            </div>
          ))}
        </div>

        <Button onClick={handlePredict} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl py-3" data-testid="predict-crop-btn">
          {loading ? 'Analyzing...' : 'Predict Best Crop'}
        </Button>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50" data-testid="crop-result">
            <div className="text-center mb-5">
              <Leaf className="mx-auto text-emerald-600 mb-2" size={36} />
              <h2 className="text-3xl font-heading font-bold text-emerald-700 capitalize">{result.crop}</h2>
              <p className="text-sm text-slate-600 mt-1">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
              <p className="text-xs text-slate-500">{result.model_type}</p>
            </div>

            <h4 className="text-sm font-semibold text-slate-700 mb-3">Top 3 Recommendations</h4>
            <div className="space-y-2">
              {result.top_3.map(([crop, pct], i) => (
                <div key={crop} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize font-medium">{crop}</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full mt-1">
                      <div className={`h-full rounded-full ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-cyan-500' : 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default CropPredictionPage;
