import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, MapPin, Bell, Camera, Bot, Save, Trash2, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SettingsPage = () => {
  const [user, setUser] = useState({});
  const [settings, setSettings] = useState({
    rover_feed_url: '', drone_feed_url: '', ollama_url: '', ollama_model: 'llama3',
    notifications: { irrigation: true, weather: true, system: false }
  });
  const [farms, setFarms] = useState([]);
  const [newFarm, setNewFarm] = useState({ name: '', location: '', size_acres: '', primary_crop: '' });
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchSettings();
    fetchFarms();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/config/settings`, { headers });
      setSettings(prev => ({ ...prev, ...res.data }));
    } catch (e) { console.error('Settings fetch error:', e); }
  };

  const fetchFarms = async () => {
    try {
      const res = await axios.get(`${API}/farms`, { headers });
      setFarms(res.data);
    } catch (e) { console.error('Farms fetch error:', e); }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/config/settings`, {
        rover_feed_url: settings.rover_feed_url,
        drone_feed_url: settings.drone_feed_url,
        ollama_url: settings.ollama_url,
        ollama_model: settings.ollama_model,
      }, { headers });
      localStorage.setItem('user', JSON.stringify(user));
      toast.success('Settings saved!');
    } catch (e) { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const handleAddFarm = async () => {
    if (!newFarm.name || !newFarm.location) return toast.error('Farm name and location required');
    try {
      await axios.post(`${API}/farms`, { ...newFarm, size_acres: parseFloat(newFarm.size_acres) || 0 }, { headers });
      toast.success('Farm added!');
      setNewFarm({ name: '', location: '', size_acres: '', primary_crop: '' });
      setShowAddFarm(false);
      fetchFarms();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to add farm'); }
  };

  const handleDeleteFarm = async (farmId) => {
    try {
      await axios.delete(`${API}/farms/${farmId}`, { headers });
      toast.success('Farm deleted');
      fetchFarms();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to delete farm'); }
  };

  const handleSetDefault = async (farmId) => {
    try {
      await axios.post(`${API}/farms/${farmId}/set-default`, {}, { headers });
      toast.success('Default farm updated');
      fetchFarms();
    } catch (e) { toast.error('Failed to set default'); }
  };

  return (
    <div className="space-y-8" data-testid="settings-page">
      <div>
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-lg text-slate-600">Manage your account, farms, and device settings</p>
      </div>

      {/* Profile */}
      <Card className="p-6 rounded-2xl border-2 border-sky-200" data-testid="settings-profile">
        <div className="flex items-center gap-2 mb-6">
          <User className="text-sky-600" size={24} />
          <h3 className="text-xl font-heading font-semibold text-slate-900">Profile</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-700 mb-2 block">Name</Label>
            <Input value={user.name || ''} onChange={(e) => setUser({ ...user, name: e.target.value })} className="rounded-xl" data-testid="settings-name-input" />
          </div>
          <div>
            <Label className="text-slate-700 mb-2 block">Email</Label>
            <Input value={user.email || ''} disabled className="rounded-xl bg-slate-100" />
          </div>
        </div>
      </Card>

      {/* Multi-Farm Management */}
      <Card className="p-6 rounded-2xl border-2 border-emerald-200" data-testid="settings-farms">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MapPin className="text-emerald-600" size={24} />
            <h3 className="text-xl font-heading font-semibold text-slate-900">My Farms ({farms.length}/5)</h3>
          </div>
          {farms.length < 5 && (
            <Button onClick={() => setShowAddFarm(!showAddFarm)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl" data-testid="add-farm-btn">
              <Plus size={16} className="mr-1" /> Add Farm
            </Button>
          )}
        </div>

        {showAddFarm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <Input placeholder="Farm Name" value={newFarm.name} onChange={(e) => setNewFarm({ ...newFarm, name: e.target.value })} className="rounded-xl" data-testid="new-farm-name" />
              <Input placeholder="Location" value={newFarm.location} onChange={(e) => setNewFarm({ ...newFarm, location: e.target.value })} className="rounded-xl" data-testid="new-farm-location" />
              <Input placeholder="Size (acres)" type="number" value={newFarm.size_acres} onChange={(e) => setNewFarm({ ...newFarm, size_acres: e.target.value })} className="rounded-xl" data-testid="new-farm-size" />
              <Input placeholder="Primary Crop" value={newFarm.primary_crop} onChange={(e) => setNewFarm({ ...newFarm, primary_crop: e.target.value })} className="rounded-xl" data-testid="new-farm-crop" />
            </div>
            <Button onClick={handleAddFarm} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl" data-testid="save-farm-btn">Save Farm</Button>
          </motion.div>
        )}

        <div className="space-y-3">
          {farms.map((farm) => (
            <div key={farm.farm_id} className={`flex items-center justify-between p-4 rounded-xl border-2 ${farm.is_default ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'}`} data-testid={`farm-card-${farm.farm_id}`}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{farm.name}</p>
                  {farm.is_default && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-semibold">Default</span>}
                </div>
                <p className="text-sm text-slate-600">{farm.location} | {farm.size_acres} acres | {farm.primary_crop}</p>
              </div>
              <div className="flex items-center gap-2">
                {!farm.is_default && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(farm.farm_id)} title="Set as default" data-testid={`set-default-${farm.farm_id}`}>
                      <Star size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteFarm(farm.farm_id)} className="text-red-500 hover:text-red-700" data-testid={`delete-farm-${farm.farm_id}`}>
                      <Trash2 size={16} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Camera Feed Settings */}
      <Card className="p-6 rounded-2xl border-2 border-cyan-200" data-testid="settings-camera">
        <div className="flex items-center gap-2 mb-6">
          <Camera className="text-cyan-600" size={24} />
          <h3 className="text-xl font-heading font-semibold text-slate-900">ESP32 Camera Feeds</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-slate-700 mb-2 block">Rover Camera URL</Label>
            <Input placeholder="http://192.168.1.100/frame" value={settings.rover_feed_url} onChange={(e) => setSettings({ ...settings, rover_feed_url: e.target.value })} className="rounded-xl font-mono text-sm" data-testid="rover-url-input" />
            <p className="text-xs text-slate-500 mt-1">ESP32-CAM stream endpoint for rover monitoring</p>
          </div>
          <div>
            <Label className="text-slate-700 mb-2 block">Drone Camera URL</Label>
            <Input placeholder="http://192.168.1.101/frame" value={settings.drone_feed_url} onChange={(e) => setSettings({ ...settings, drone_feed_url: e.target.value })} className="rounded-xl font-mono text-sm" data-testid="drone-url-input" />
            <p className="text-xs text-slate-500 mt-1">ESP32-CAM stream endpoint for drone monitoring</p>
          </div>
        </div>
      </Card>

      {/* Ollama / AI Settings */}
      <Card className="p-6 rounded-2xl border-2 border-violet-200" data-testid="settings-ollama">
        <div className="flex items-center gap-2 mb-6">
          <Bot className="text-violet-600" size={24} />
          <h3 className="text-xl font-heading font-semibold text-slate-900">AI Chatbot (Ollama)</h3>
        </div>
        <p className="text-sm text-slate-600 mb-4">Configure local AI inference. Leave empty to use Gemini (online).</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-700 mb-2 block">Ollama URL</Label>
            <Input placeholder="http://localhost:11434" value={settings.ollama_url} onChange={(e) => setSettings({ ...settings, ollama_url: e.target.value })} className="rounded-xl font-mono text-sm" data-testid="ollama-url-input" />
          </div>
          <div>
            <Label className="text-slate-700 mb-2 block">Model Name</Label>
            <Input placeholder="llama3" value={settings.ollama_model} onChange={(e) => setSettings({ ...settings, ollama_model: e.target.value })} className="rounded-xl font-mono text-sm" data-testid="ollama-model-input" />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6 rounded-2xl border-2 border-blue-200" data-testid="settings-notifications">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="text-blue-600" size={24} />
          <h3 className="text-xl font-heading font-semibold text-slate-900">Notifications</h3>
        </div>
        <div className="space-y-4">
          {[
            { key: 'irrigation', label: 'Irrigation Alerts', desc: 'Get notified when irrigation is needed', bg: 'sky' },
            { key: 'weather', label: 'Weather Updates', desc: 'Receive weather forecast notifications', bg: 'cyan' },
            { key: 'system', label: 'System Alerts', desc: 'Sensor failures and system issues', bg: 'blue' },
          ].map(({ key, label, desc, bg }) => (
            <div key={key} className={`flex items-center justify-between p-4 bg-${bg}-50 rounded-xl`}>
              <div>
                <p className="font-semibold text-slate-900">{label}</p>
                <p className="text-sm text-slate-600">{desc}</p>
              </div>
              <Switch
                checked={settings.notifications?.[key] ?? false}
                onCheckedChange={(checked) => setSettings({ ...settings, notifications: { ...settings.notifications, [key]: checked } })}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving} className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-6 text-lg rounded-xl font-semibold" data-testid="save-settings-btn">
          <Save size={20} className="mr-2" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
