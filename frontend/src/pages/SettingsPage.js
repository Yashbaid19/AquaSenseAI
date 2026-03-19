import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, MapPin, Leaf, Bell } from 'lucide-react';
import { toast } from 'sonner';

const SettingsPage = () => {
  const [user, setUser] = useState({});
  const [notifications, setNotifications] = useState({
    irrigation: true,
    weather: true,
    system: false
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const handleSave = () => {
    localStorage.setItem('user', JSON.stringify(user));
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">
          Settings
        </h1>
        <p className="text-lg text-slate-600">
          Manage your account and farm settings
        </p>
      </div>

      {/* Profile Information */}
      <Card className="p-6 rounded-2xl border-2 border-sky-200">
        <div className="flex items-center gap-2 mb-6">
          <User className="text-sky-600" size={24} />
          <h3 className="text-xl font-heading font-semibold text-slate-900">Profile Information</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-slate-700 mb-2 block">Name</Label>
            <Input
              id="name"
              value={user.name || ''}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className="rounded-xl border-slate-300"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-slate-700 mb-2 block">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email || ''}
              disabled
              className="rounded-xl border-slate-300 bg-slate-100"
            />
          </div>
        </div>
      </Card>

      {/* Farm Information */}
      <Card className="p-6 rounded-2xl border-2 border-emerald-200">
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="text-emerald-600" size={24} />
          <h3 className="text-xl font-heading font-semibold text-slate-900">Farm Information</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="location" className="text-slate-700 mb-2 block">Farm Location</Label>
            <Input
              id="location"
              value={user.farm_location || ''}
              onChange={(e) => setUser({ ...user, farm_location: e.target.value })}
              className="rounded-xl border-slate-300"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="size" className="text-slate-700 mb-2 block">Farm Size (acres)</Label>
              <Input
                id="size"
                type="number"
                value={user.farm_size || ''}
                onChange={(e) => setUser({ ...user, farm_size: e.target.value })}
                className="rounded-xl border-slate-300"
              />
            </div>
            <div>
              <Label htmlFor="crop" className="text-slate-700 mb-2 block">Primary Crop</Label>
              <Input
                id="crop"
                value={user.primary_crop || ''}
                onChange={(e) => setUser({ ...user, primary_crop: e.target.value })}
                className="rounded-xl border-slate-300"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6 rounded-2xl border-2 border-blue-200">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="text-blue-600" size={24} />
          <h3 className="text-xl font-heading font-semibold text-slate-900">Notification Settings</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-sky-50 rounded-xl">
            <div>
              <p className="font-semibold text-slate-900">Irrigation Alerts</p>
              <p className="text-sm text-slate-600">Get notified when irrigation is needed</p>
            </div>
            <Switch
              checked={notifications.irrigation}
              onCheckedChange={(checked) => setNotifications({ ...notifications, irrigation: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-cyan-50 rounded-xl">
            <div>
              <p className="font-semibold text-slate-900">Weather Updates</p>
              <p className="text-sm text-slate-600">Receive weather forecast notifications</p>
            </div>
            <Switch
              checked={notifications.weather}
              onCheckedChange={(checked) => setNotifications({ ...notifications, weather: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
            <div>
              <p className="font-semibold text-slate-900">System Alerts</p>
              <p className="text-sm text-slate-600">Sensor failures and system issues</p>
            </div>
            <Switch
              checked={notifications.system}
              onCheckedChange={(checked) => setNotifications({ ...notifications, system: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-6 text-lg rounded-xl font-semibold"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;