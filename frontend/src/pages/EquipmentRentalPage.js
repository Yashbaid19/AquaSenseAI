import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Phone, MapPin, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TYPES = ['Tractor', 'Harvester', 'Rotavator', 'Plough', 'Sprayer', 'Seed Drill', 'Thresher', 'Water Pump'];
const STATES_DISTRICTS = {
  'Maharashtra': ['Pune', 'Mumbai', 'Nagpur'],
  'Karnataka': ['Bangalore'],
  'Uttar Pradesh': ['Lucknow'],
  'Punjab': ['Ludhiana'],
};

const EquipmentRentalPage = () => {
  const [results, setResults] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchState, setSearchState] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [searchType, setSearchType] = useState('');
  const [form, setForm] = useState({ name: '', equipment_type: 'Tractor', description: '', price_per_day: '', state: 'Maharashtra', district: 'Pune', contact: '' });
  const [submitting, setSubmitting] = useState(false);

  const search = async () => {
    try {
      const params = new URLSearchParams();
      if (searchState) params.append('state', searchState);
      if (searchDistrict) params.append('district', searchDistrict);
      if (searchType) params.append('equipment_type', searchType);
      const res = await axios.get(`${API}/equipment/search?${params}`);
      setResults(res.data);
    } catch { setResults([]); }
  };

  useEffect(() => { search(); }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.price_per_day || !form.contact) { toast.error('Fill required fields'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/equipment/list`, { ...form, price_per_day: parseFloat(form.price_per_day) }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Equipment listed!');
      setShowForm(false);
      setForm({ name: '', equipment_type: 'Tractor', description: '', price_per_day: '', state: 'Maharashtra', district: 'Pune', contact: '' });
      search();
    } catch { toast.error('Failed to list equipment'); }
    finally { setSubmitting(false); }
  };

  return (
    <div data-testid="equipment-rental-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-heading font-bold text-slate-900 mb-1">Equipment Rental</h1>
          <p className="text-base text-slate-600">Find or list agricultural equipment for rent</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl" data-testid="list-equipment-btn">
          <Plus size={16} className="mr-1" /> List Equipment
        </Button>
      </div>

      {/* List Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 rounded-2xl border-2 border-cyan-200" data-testid="equipment-form">
            <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">List Your Equipment</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Equipment Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. John Deere 5050D" className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 text-sm" data-testid="eq-name" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Type</label>
                <select value={form.equipment_type} onChange={e => setForm(p => ({ ...p, equipment_type: e.target.value }))} className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 text-sm" data-testid="eq-type">
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Price/Day (Rs) *</label>
                <input type="number" value={form.price_per_day} onChange={e => setForm(p => ({ ...p, price_per_day: e.target.value }))} placeholder="500" className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 text-sm" data-testid="eq-price" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">State</label>
                <select value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value, district: Object.keys(STATES_DISTRICTS).includes(e.target.value) ? (STATES_DISTRICTS[e.target.value]?.[0] || '') : '' }))} className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 text-sm" data-testid="eq-state">
                  {Object.keys(STATES_DISTRICTS).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">District</label>
                <select value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 text-sm" data-testid="eq-district">
                  {(STATES_DISTRICTS[form.state] || []).map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Contact *</label>
                <input value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} placeholder="+91 9876543210" className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 text-sm" data-testid="eq-contact" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Condition, hours used, etc." className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 text-sm" data-testid="eq-desc" />
            </div>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8" data-testid="submit-equipment-btn">
              {submitting ? 'Listing...' : 'Submit Listing'}
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Search */}
      <Card className="p-5 rounded-2xl border-2 border-slate-200">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">State</label>
            <select value={searchState} onChange={e => setSearchState(e.target.value)} className="px-3 py-2 rounded-xl border-2 border-slate-200 text-sm" data-testid="search-state">
              <option value="">All States</option>
              {Object.keys(STATES_DISTRICTS).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Type</label>
            <select value={searchType} onChange={e => setSearchType(e.target.value)} className="px-3 py-2 rounded-xl border-2 border-slate-200 text-sm" data-testid="search-type">
              <option value="">All Types</option>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <Button onClick={search} className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl" data-testid="search-btn">
            <Search size={16} className="mr-1" /> Search
          </Button>
        </div>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((eq, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5 rounded-2xl border-2 border-slate-200 hover:border-cyan-300 transition-colors" data-testid={`equipment-card-${i}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-base font-semibold text-slate-900">{eq.name}</h4>
                  <span className="text-xs px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full">{eq.equipment_type}</span>
                </div>
                <Wrench className="text-slate-400" size={20} />
              </div>
              {eq.description && <p className="text-xs text-slate-600 mb-3">{eq.description}</p>}
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-cyan-700">Rs {eq.price_per_day}/day</span>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={12} /> {eq.district}, {eq.state}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-slate-600">
                <Phone size={12} /> {eq.contact}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {results.length === 0 && (
        <Card className="p-10 rounded-2xl border-2 border-slate-200 text-center">
          <Wrench className="mx-auto text-slate-400 mb-3" size={40} />
          <p className="text-slate-500">No equipment found. Be the first to list!</p>
        </Card>
      )}
    </div>
  );
};

export default EquipmentRentalPage;
