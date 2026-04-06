import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Leaf, RefreshCw, Droplets, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ROVER_FEED_URL = 'https://camera-backend-nhqu.onrender.com/frame';

const HealthBadge = ({ health, confidence }) => {
  const styles = {
    'Healthy': 'bg-emerald-100 border-emerald-400 text-emerald-800',
    'Mild Stress': 'bg-amber-100 border-amber-400 text-amber-800',
    'Severe Stress': 'bg-red-100 border-red-400 text-red-800',
  };
  const icons = {
    'Healthy': <CheckCircle size={20} />,
    'Mild Stress': <AlertTriangle size={20} />,
    'Severe Stress': <AlertTriangle size={20} />,
  };
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold text-sm ${styles[health] || 'bg-slate-100 border-slate-300 text-slate-700'}`}>
      {icons[health] || <Activity size={20} />}
      {health} ({(confidence * 100).toFixed(1)}%)
    </div>
  );
};

const StressBar = ({ value, label, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-800">{(value * 100).toFixed(1)}%</span>
    </div>
    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value * 100}%` }}
        transition={{ duration: 0.6 }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  </div>
);

const RoverMonitoringPage = () => {
  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const [uploadAnalysis, setUploadAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedKey, setFeedKey] = useState(Date.now());
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const feedInterval = useRef(null);
  const analyzeInterval = useRef(null);
  const fileInputRef = useRef(null);

  const analyzeLiveFeed = useCallback(async () => {
    try {
      setAnalyzing(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/rover/analyze-frame`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLiveAnalysis(res.data);
    } catch (e) {
      console.error('Live analysis error:', e);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    feedInterval.current = setInterval(() => setFeedKey(Date.now()), 500);
    analyzeLiveFeed();
    if (autoAnalyze) {
      analyzeInterval.current = setInterval(analyzeLiveFeed, 5000);
    }
    return () => {
      clearInterval(feedInterval.current);
      clearInterval(analyzeInterval.current);
    };
  }, [autoAnalyze, analyzeLiveFeed]);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      toast.info('Analyzing image with rover crop health model...');
      const res = await axios.post(`${API}/rover/analyze-upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setUploadAnalysis(res.data);
      toast.success('Image analyzed!');
    } catch (e) {
      console.error('Upload error:', e);
      toast.error('Failed to analyze image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderAnalysisCard = (analysis, title) => {
    if (!analysis) return null;
    const stressColor = analysis.water_stress_index > 0.6 ? 'bg-red-500' : analysis.water_stress_index > 0.3 ? 'bg-amber-500' : 'bg-emerald-500';
    return (
      <Card className="p-5 rounded-2xl border-2 border-slate-200" data-testid={`${title.toLowerCase().replace(/\s/g, '-')}-card`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Leaf className="text-emerald-600" size={20} />
            <h3 className="text-base font-heading font-semibold text-slate-900">{title}</h3>
          </div>
          <span className="text-xs text-slate-500">{analysis.model_type}</span>
        </div>

        <div className="flex items-center justify-center mb-4">
          <HealthBadge health={analysis.health} confidence={analysis.confidence} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-slate-50 rounded-xl text-center">
            <Droplets className="mx-auto text-sky-600 mb-1" size={22} />
            <p className="text-xs text-slate-500">Water Stress</p>
            <p className="text-lg font-bold text-slate-900">{(analysis.water_stress_index * 100).toFixed(0)}%</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl text-center">
            <Activity className="mx-auto text-cyan-600 mb-1" size={22} />
            <p className="text-xs text-slate-500">Confidence</p>
            <p className="text-lg font-bold text-slate-900">{(analysis.confidence * 100).toFixed(1)}%</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <StressBar value={analysis.probabilities?.healthy || 0} label="Healthy" color="bg-emerald-500" />
          <StressBar value={analysis.probabilities?.mild_stress || 0} label="Mild Stress" color="bg-amber-500" />
          <StressBar value={analysis.probabilities?.severe_stress || 0} label="Severe Stress" color="bg-red-500" />
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <p className="text-xs text-slate-600">{analysis.description}</p>
          <div className={`p-2 rounded-lg ${analysis.health === 'Healthy' ? 'bg-emerald-50 border border-emerald-200' : analysis.health === 'Mild Stress' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
            <p className="text-xs font-semibold text-slate-800">Action: {analysis.action}</p>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div data-testid="rover-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-heading font-bold text-slate-900 mb-1">Rover Monitor</h1>
          <p className="text-base text-slate-600">Live camera feed with real-time crop health analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={autoAnalyze ? "default" : "outline"}
            onClick={() => setAutoAnalyze(!autoAnalyze)}
            className={`rounded-xl text-sm ${autoAnalyze ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            data-testid="auto-analyze-toggle"
          >
            {autoAnalyze ? 'Auto-Analyze ON' : 'Auto-Analyze OFF'}
          </Button>
          {!autoAnalyze && (
            <Button onClick={analyzeLiveFeed} disabled={analyzing} className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm" data-testid="manual-analyze-btn">
              {analyzing ? <RefreshCw className="animate-spin" size={16} /> : 'Analyze Now'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Feed */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden rounded-2xl border-2 border-slate-200" data-testid="rover-live-feed">
            <div className="relative bg-slate-900">
              <img
                src={`${ROVER_FEED_URL}?t=${feedKey}`}
                alt="Rover Live Feed"
                className="w-full h-[420px] object-contain"
                onError={(e) => { e.target.style.opacity = 0.3; }}
              />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-full bg-red-500/90 text-white text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
                {analyzing && (
                  <div className="px-3 py-1.5 rounded-full bg-sky-500/90 text-white text-xs font-semibold flex items-center gap-1.5">
                    <RefreshCw className="animate-spin" size={12} />
                    Analyzing...
                  </div>
                )}
              </div>
              {liveAnalysis && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <HealthBadge health={liveAnalysis.health} confidence={liveAnalysis.confidence} />
                  <div className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs">
                    Water Stress: {(liveAnalysis.water_stress_index * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="text-cyan-600" size={18} />
                <span className="text-sm font-semibold text-slate-900">Rover Camera</span>
              </div>
              <span className="text-xs text-slate-500">{autoAnalyze ? 'Auto-analyzing every 5s' : 'Manual mode'}</span>
            </div>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {renderAnalysisCard(liveAnalysis, 'Live Analysis')}

          {/* Upload */}
          <Card className="p-5 rounded-2xl border-2 border-dashed border-cyan-300 bg-gradient-to-br from-cyan-50 to-sky-50" data-testid="rover-upload-card">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="text-cyan-600" size={20} />
              <h3 className="text-base font-heading font-semibold text-slate-900">Upload Photo</h3>
            </div>
            <p className="text-xs text-slate-600 mb-3">Analyze a crop image with the rover model</p>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleUpload} className="hidden" data-testid="rover-upload-input" />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl py-2.5 text-sm"
              data-testid="rover-upload-btn"
            >
              {uploading ? (
                <span className="flex items-center gap-2"><RefreshCw className="animate-spin" size={14} /> Analyzing...</span>
              ) : (
                <span className="flex items-center gap-2"><Upload size={14} /> Choose Image</span>
              )}
            </Button>
          </Card>
        </div>
      </div>

      {/* Upload Result */}
      {uploadAnalysis && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-lg font-heading font-semibold text-slate-900 mb-3">Upload Analysis: {uploadAnalysis.filename}</h2>
          <div className="max-w-md">
            {renderAnalysisCard(uploadAnalysis, 'Upload Result')}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RoverMonitoringPage;
