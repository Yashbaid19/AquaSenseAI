import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Pulses', 'Grains', 'Spices'];

const MandiPricingPage = () => {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [category, setCategory] = useState('All');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API}/mandi/states`).then(r => { setStates(r.data); if (r.data.length) setState(r.data[0]); });
  }, []);

  useEffect(() => {
    if (state) axios.get(`${API}/mandi/districts/${state}`).then(r => { setDistricts(r.data); if (r.data.length) setDistrict(r.data[0]); });
  }, [state]);

  const fetchPrices = async () => {
    if (!state || !district) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/mandi/prices?state=${state}&district=${district}&category=${category}`);
      setData(res.data);
    } catch { setData([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (district) fetchPrices(); }, [district, category]);

  const top10 = [...data].sort((a, b) => b.modal_price - a.modal_price).slice(0, 10);

  return (
    <div data-testid="mandi-pricing-page" className="space-y-6">
      <div>
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-1">Mandi Pricing</h1>
        <p className="text-base text-slate-600">Real-time market prices across mandis</p>
      </div>

      <Card className="p-5 rounded-2xl border-2 border-slate-200">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">State</label>
            <select value={state} onChange={e => setState(e.target.value)} className="px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-cyan-400 focus:outline-none text-sm" data-testid="select-state">
              {states.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">District</label>
            <select value={district} onChange={e => setDistrict(e.target.value)} className="px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-cyan-400 focus:outline-none text-sm" data-testid="select-district">
              {districts.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-cyan-400 focus:outline-none text-sm" data-testid="select-category">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {top10.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-5 rounded-2xl border-2 border-slate-200" data-testid="mandi-chart">
            <h3 className="text-base font-heading font-semibold text-slate-900 mb-4">Top Commodities by Price</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={top10} layout="vertical" margin={{ left: 70 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="commodity" tick={{ fontSize: 12 }} width={80} />
                <Tooltip formatter={v => [`Rs ${v}/qtl`, 'Modal Price']} />
                <Bar dataKey="modal_price" fill="#0891b2" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {data.length > 0 && (
        <Card className="rounded-2xl border-2 border-slate-200 overflow-hidden" data-testid="mandi-table">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-heading font-semibold text-slate-900">{category === 'All' ? 'All Commodities' : category} - {district}, {state}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Commodity', 'Category', 'Min Price', 'Max Price', 'Modal Price'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.commodity}</td>
                    <td className="px-4 py-3 text-slate-600">{item.category}</td>
                    <td className="px-4 py-3 text-slate-600">Rs {item.min_price}/qtl</td>
                    <td className="px-4 py-3 text-slate-600">Rs {item.max_price}/qtl</td>
                    <td className="px-4 py-3 font-semibold text-cyan-700">Rs {item.modal_price}/qtl</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {data.length === 0 && !loading && (
        <Card className="p-10 rounded-2xl border-2 border-slate-200 text-center">
          <Store className="mx-auto text-slate-400 mb-3" size={40} />
          <p className="text-slate-500">Select a state and district to view mandi prices</p>
        </Card>
      )}
    </div>
  );
};

export default MandiPricingPage;
