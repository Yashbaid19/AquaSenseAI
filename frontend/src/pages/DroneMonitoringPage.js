import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, RefreshCw, AlertCircle, LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DroneMonitoringPage = () => {
  const [imageError, setImageError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [droneFeedUrl, setDroneFeedUrl] = useState('');
  const [feedLoaded, setFeedLoaded] = useState(false);

  useEffect(() => {
    const fetchFeedUrl = async () => {
      try {
        const res = await axios.get(`${API}/config/camera-feeds`);
        const url = res.data.drone_feed_url;
        if (url) setDroneFeedUrl(url);
      } catch (e) {
        console.error('Failed to fetch camera config:', e);
      } finally {
        setFeedLoaded(true);
      }
    };
    fetchFeedUrl();
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setImageError(false);
    setIsLive(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLive(false);
  };

  useEffect(() => {
    if (!droneFeedUrl) return;
    // Auto-refresh every 2 seconds
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, [droneFeedUrl]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Drone Live Feed</h1>
          <p className="text-slate-600 mt-2">Real-time aerial surveillance of your farm</p>
        </div>
        <Button onClick={handleRefresh} size="sm" variant="outline">
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </motion.div>

      {/* Live Feed */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera size={24} />
              Live Camera Feed
              {isLive && (
                <span className="ml-auto flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
              {droneFeedUrl ? (
                !imageError ? (
                <>
                  <img 
                    key={refreshKey}
                    src={`${droneFeedUrl}?t=${Date.now()}`}
                    alt="Live Drone Feed"
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    onLoad={() => setIsLive(true)}
                  />
                  <div className="absolute bottom-4 left-4 bg-black/60 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
                    <p className="text-xs">Camera: Main Drone Feed</p>
                    <p className="text-xs opacity-75">{new Date().toLocaleTimeString()}</p>
                  </div>
                  <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg backdrop-blur-sm">
                    <p className="text-xs">Auto-refresh: Every 2s</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <AlertCircle size={64} className="mb-4 opacity-50" />
                  <p className="text-xl mb-2">Camera Feed Unavailable</p>
                  <p className="text-sm opacity-75 mb-4">Could not connect to drone camera</p>
                  <Button onClick={handleRefresh} variant="secondary">
                    <RefreshCw size={16} className="mr-2" />
                    Try Again
                  </Button>
                </div>
              )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 px-8 py-12">
                  <LinkIcon size={48} className="mb-4 opacity-40" />
                  <p className="text-xl font-semibold text-white mb-2">Drone Camera Not Connected</p>
                  <p className="text-sm text-center max-w-md mb-4">
                    To connect your ESP32-CAM drone feed, add the URL to your backend configuration:
                  </p>
                  <div className="bg-slate-800 rounded-xl p-4 text-left w-full max-w-md">
                    <p className="text-xs text-cyan-400 font-mono mb-1"># In backend/.env file, set:</p>
                    <p className="text-sm text-emerald-400 font-mono">DRONE_FEED_URL=http://&lt;your-esp32-ip&gt;/frame</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DroneMonitoringPage;
