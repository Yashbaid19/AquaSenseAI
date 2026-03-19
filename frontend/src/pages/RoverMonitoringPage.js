import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Leaf, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ROVER_FEED_URL = 'https://camera-backend-nhqu.onrender.com/frame';

const RoverMonitoringPage = () => {
  const [cropHealth, setCropHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [feedKey, setFeedKey] = useState(Date.now());
  const feedInterval = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCropHealth();
    // Refresh the live feed frame every 500ms
    feedInterval.current = setInterval(() => {
      setFeedKey(Date.now());
    }, 500);
    return () => clearInterval(feedInterval.current);
  }, []);

  const fetchCropHealth = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/rover/health`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCropHealth(res.data);
    } catch (e) {
      console.error('Crop health fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      toast.info('Analyzing uploaded image with drone model...');
      const res = await axios.post(`${API}/drone/upload-image`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setUploadResult(res.data);
      toast.success('Image analyzed successfully!');
    } catch (e) {
      console.error('Upload error:', e);
      toast.error('Failed to analyze image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div data-testid="rover-page" className="space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">Rover Monitor</h1>
        <p className="text-lg text-slate-600">Live camera feed and crop analysis</p>
      </div>

      {/* Live Feed + Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Camera Feed */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="overflow-hidden rounded-2xl border-2 border-slate-200" data-testid="rover-live-feed">
            <div className="relative bg-slate-900">
              <img
                src={`${ROVER_FEED_URL}?t=${feedKey}`}
                alt="Rover Live Feed"
                className="w-full h-[400px] object-contain"
                onError={(e) => { e.target.style.opacity = 0.3; }}
              />
              <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-red-500 text-white text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
              </div>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="text-cyan-600" size={20} />
                <h3 className="text-lg font-heading font-semibold text-slate-900">Rover Camera</h3>
              </div>
              <span className="text-xs text-slate-500">Refreshing @ 2 fps</span>
            </div>
          </Card>
        </motion.div>

        {/* Upload + Analysis */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          {/* Upload Card */}
          <Card className="p-6 rounded-2xl border-2 border-dashed border-cyan-300 bg-gradient-to-br from-cyan-50 to-sky-50" data-testid="rover-upload-card">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="text-cyan-600" size={22} />
              <h3 className="text-lg font-heading font-semibold text-slate-900">Upload Photo for Analysis</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">Upload a crop/field image to analyze with the drone segmentation model</p>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              data-testid="rover-upload-input"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl py-3"
              data-testid="rover-upload-btn"
            >
              {uploading ? (
                <span className="flex items-center gap-2"><RefreshCw className="animate-spin" size={16} /> Analyzing...</span>
              ) : (
                <span className="flex items-center gap-2"><Upload size={16} /> Choose Image</span>
              )}
            </Button>
          </Card>

          {/* Upload Result */}
          {uploadResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="overflow-hidden rounded-2xl border-2 border-emerald-200" data-testid="rover-analysis-result">
                {uploadResult.segmented_image && (
                  <img src={uploadResult.segmented_image} alt="Segmented" className="w-full h-56 object-contain bg-slate-900" />
                )}
                <div className="p-5">
                  <h4 className="text-base font-heading font-semibold text-slate-900 mb-3">Zone Analysis Result</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(uploadResult.zones || []).map((zone, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${zone.needs_irrigation ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}
                      >
                        <p className="text-sm font-semibold text-slate-800">{zone.id}</p>
                        <p className="text-xs text-slate-600">{zone.label}</p>
                        <p className="text-xs font-medium mt-1">{zone.coverage_percent}% coverage</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Crop Health */}
          {cropHealth && (
            <Card className="p-6 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50" data-testid="rover-crop-health">
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="text-emerald-600" size={22} />
                <h3 className="text-lg font-heading font-semibold text-slate-900">Crop Health</h3>
              </div>
              <div className="text-center p-4 bg-white/70 rounded-xl mb-4">
                <p className="text-3xl font-heading font-bold text-emerald-700">{cropHealth.health}</p>
                <p className="text-sm text-slate-600 mt-1">Confidence: {(cropHealth.confidence * 100).toFixed(0)}%</p>
              </div>
              {cropHealth.action && (
                <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-200">
                  <p className="text-sm text-slate-700">{cropHealth.action}</p>
                </div>
              )}
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RoverMonitoringPage;
