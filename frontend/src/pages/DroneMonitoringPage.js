import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Radio, RefreshCw, AlertCircle, Wifi, Battery, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DRONE_CAMERA_URL = "https://camera-backend-ebe7.onrender.com/frame";

const DroneMonitoringPage = () => {
  const [isLive, setIsLive] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLive(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-slate-900">Drone Monitoring</h1>
        <p className="text-slate-600 mt-2">Real-time aerial surveillance of your farm</p>
      </motion.div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Connection</p>
                <p className={`font-bold text-lg ${isLive ? 'text-green-600' : 'text-red-600'}`}>
                  {isLive ? 'LIVE' : 'OFFLINE'}
                </p>
              </div>
              <Wifi className={isLive ? 'text-green-600' : 'text-red-600'} size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Battery</p>
                <p className="font-bold text-lg text-blue-600">87%</p>
              </div>
              <Battery className="text-blue-600" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Altitude</p>
                <p className="font-bold text-lg text-cyan-600">45m</p>
              </div>
              <MapPin className="text-cyan-600" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Signal</p>
                <p className="font-bold text-lg text-purple-600">Strong</p>
              </div>
              <Radio className="text-purple-600" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Feed */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera size={24} />
              Live Camera Feed
            </CardTitle>
            <Button 
              onClick={handleRefresh}
              size="sm"
              variant="outline"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
              {!imageError ? (
                <>
                  <img 
                    key={refreshKey}
                    src={`${DRONE_CAMERA_URL}?t=${Date.now()}`}
                    alt="Live Drone Feed"
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    onLoad={() => setIsLive(true)}
                  />
                  {isLive && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-sm font-semibold">LIVE</span>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 bg-black/60 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
                    <p className="text-xs">Camera: Main Drone Feed</p>
                    <p className="text-xs opacity-75">{new Date().toLocaleTimeString()}</p>
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
              )}
            </div>

            {/* Camera Info */}
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Resolution</p>
                <p className="font-semibold">1920x1080</p>
              </div>
              <div>
                <p className="text-slate-600">Frame Rate</p>
                <p className="font-semibold">30 FPS</p>
              </div>
              <div>
                <p className="text-slate-600">View Angle</p>
                <p className="font-semibold">120°</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Drone Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Flight Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Flight Time</span>
                <span className="font-semibold">18 min 32 sec</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Distance Covered</span>
                <span className="font-semibold">2.4 km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Max Speed</span>
                <span className="font-semibold">15 m/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">GPS Accuracy</span>
                <span className="font-semibold">±0.5m</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mission Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Mission Type</span>
                <span className="font-semibold">Area Survey</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Area Covered</span>
                <span className="font-semibold">12.5 acres</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Images Captured</span>
                <span className="font-semibold">143 photos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Mission Progress</span>
                <span className="font-semibold text-green-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DroneMonitoringPage;
