import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    farm_location: '',
    farm_size: '',
    primary_crop: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/signup`, {
        ...formData,
        farm_size: parseFloat(formData.farm_size)
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Account created successfully!');
      window.location.href = '/dashboard';
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="p-3 bg-sky-500 rounded-full">
              <Droplets className="text-white" size={32} />
            </div>
          </div>
          
          <h1 className="text-3xl font-heading font-bold text-center text-slate-900 mb-2">
            Create Your Account
          </h1>
          <p className="text-center text-slate-600 mb-8">
            Join AquaSense AI and start optimizing your irrigation
          </p>

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-slate-700 mb-2 block">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-2 rounded-xl border-slate-300"
                placeholder="John Farmer"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-slate-700 mb-2 block">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-2 rounded-xl border-slate-300"
                placeholder="farmer@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-700 mb-2 block">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-2 rounded-xl border-slate-300"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <Label htmlFor="farm_location" className="text-slate-700 mb-2 block">Farm Location</Label>
              <Input
                id="farm_location"
                name="farm_location"
                value={formData.farm_location}
                onChange={handleChange}
                className="mt-2 rounded-xl border-slate-300"
                placeholder="California, USA"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="farm_size" className="text-slate-700 mb-2 block">Farm Size (acres)</Label>
                <Input
                  id="farm_size"
                  name="farm_size"
                  type="number"
                  step="0.01"
                  value={formData.farm_size}
                  onChange={handleChange}
                  className="mt-2 rounded-xl border-slate-300"
                  placeholder="50"
                  required
                />
              </div>
              <div>
                <Label htmlFor="primary_crop" className="text-slate-700 mb-2 block">Primary Crop</Label>
                <Input
                  id="primary_crop"
                  name="primary_crop"
                  value={formData.primary_crop}
                  onChange={handleChange}
                  className="mt-2 rounded-xl border-slate-300"
                  placeholder="Wheat"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white py-6 text-lg rounded-xl font-semibold"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-slate-600 mt-6">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-sky-600 hover:text-sky-700 font-semibold"
            >
              Sign In
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;