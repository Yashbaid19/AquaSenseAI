import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera, RefreshCw, Map, AlertCircle, CheckCircle, Droplets } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FarmZonesPage = () => {
  const [segmentedImage, setSegmentedImage] = useState(null);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingType, setProcessingType] = useState('');

  useEffect(() => {
    fetchLatestAnalysis();
  }, []);

  const fetchLatestAnalysis = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/drone/latest-analysis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.zones) {
        setZones(response.data.zones);
      }
    } catch (error) {
      console.log('No previous analysis, using demo data');
      loadDemoData();
    }
  };

  const loadDemoData = () => {
    setZones([
      {
        id: "Zone A",
        label: "High Moisture",
        moisture_category: 0,
        coverage_percent: 28.5,
        color: [0, 255, 0],
        needs_irrigation: false
      },
      {
        id: "Zone B",
        label: "Medium Moisture",
        moisture_category: 1,
        coverage_percent: 34.2,
        color: [255, 255, 0],
        needs_irrigation: false
      },
      {
        id: "Zone C",
        label: "Low Moisture",
        moisture_category: 2,
        coverage_percent: 22.3,
        color: [255, 165, 0],
        needs_irrigation: true
      },
      {
        id: "Zone D",
        label: "Critical - Very Low",
        moisture_category: 3,
        coverage_percent: 15.0,
        color: [255, 0, 0],
        needs_irrigation: true
      }
    ]);
  };

  const handleProcessDroneFrame = async () => {
    setLoading(true);
    setProcessingType('camera');
    
    try {
      const token = localStorage.getItem('token');
      toast.info('Fetching drone camera feed...');
      
      const response = await axios.post(
        `${API}/drone/process-frame`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSegmentedImage(response.data.segmented_image);
      setZones(response.data.zones);
      toast.success('Drone image processed successfully!');
    } catch (error) {
      console.error('Error processing drone frame:', error);
      toast.error('Could not fetch drone feed, using demo data');
      loadDemoData();
    } finally {
      setLoading(false);
      setProcessingType('');
    }
  };

  const handleUploadImage = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setProcessingType('upload');
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      toast.info('Processing uploaded image...');
      
      const response = await axios.post(
        `${API}/drone/upload-image`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      
      setSegmentedImage(response.data.segmented_image);
      setZones(response.data.zones);
      toast.success('Image processed successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error processing image, using demo data');
      loadDemoData();
    } finally {
      setLoading(false);
      setProcessingType('');
    }
  };

  const getColorStyle = (color) => {
    return {
      backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
      opacity: 0.8
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Farm Zone Analysis</h1>
          <p className="text-slate-600 mt-2">AI-powered zone detection from drone imagery</p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-4"
      >
        <Button
          onClick={handleProcessDroneFrame}
          disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          {loading && processingType === 'camera' ? (
            <RefreshCw className="mr-2 animate-spin" size={20} />
          ) : (
            <Camera className="mr-2" size={20} />
          )}
          Process Live Drone Feed
        </Button>

        <label className="cursor-pointer">
          <Button
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => document.getElementById('file-upload').click()}
          >
            {loading && processingType === 'upload' ? (
              <RefreshCw className="mr-2 animate-spin" size={20} />
            ) : (
              <Upload className="mr-2" size={20} />
            )}
            Upload & Analyze Image
          </Button>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleUploadImage}
            className="hidden"
          />
        </label>
      </motion.div>

      {/* Segmented Image Display */}
      {segmentedImage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Zone Segmentation Map</CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={segmentedImage} 
                alt="Segmented Farm Zones" 
                className="w-full rounded-lg shadow-lg"
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Zone Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {zones.map((zone, idx) => (
          <motion.div
            key={zone.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className={`border-2 ${zone.needs_irrigation ? 'border-red-400' : 'border-green-400'}`}>
              <div 
                style={getColorStyle(zone.color)} 
                className="h-3 rounded-t-lg"
              />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{zone.id}</h3>
                  {zone.needs_irrigation ? (
                    <AlertCircle className="text-red-600" size={20} />
                  ) : (
                    <CheckCircle className="text-green-600" size={20} />
                  )}
                </div>
                
                <p className="text-sm text-slate-600 mb-2">{zone.label}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Coverage</span>
                    <span className="font-semibold text-lg">{zone.coverage_percent}%</span>
                  </div>
                  
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${zone.coverage_percent}%`,
                        ...getColorStyle(zone.color)
                      }}
                    />
                  </div>
                  
                  {zone.needs_irrigation && (
                    <div className="mt-3 p-2 bg-red-50 rounded-lg flex items-center gap-2 text-red-700">
                      <Droplets size={16} />
                      <span className="text-xs font-medium">Irrigation Required</span>
                    </div>
                  )}
                  
                  {!zone.needs_irrigation && (
                    <div className="mt-3 p-2 bg-green-50 rounded-lg flex items-center gap-2 text-green-700">
                      <CheckCircle size={16} />
                      <span className="text-xs font-medium">Optimal Moisture</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Zone Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map size={24} />
            Moisture Level Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded" style={{backgroundColor: 'rgb(0,255,0)'}} />
              <div>
                <p className="font-medium">High</p>
                <p className="text-xs text-slate-600">>40% moisture</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded" style={{backgroundColor: 'rgb(255,255,0)'}} />
              <div>
                <p className="font-medium">Medium</p>
                <p className="text-xs text-slate-600">30-40% moisture</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded" style={{backgroundColor: 'rgb(255,165,0)'}} />
              <div>
                <p className="font-medium">Low</p>
                <p className="text-xs text-slate-600">20-30% moisture</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded" style={{backgroundColor: 'rgb(255,0,0)'}} />
              <div>
                <p className="font-medium">Critical</p>
                <p className="text-xs text-slate-600"><20% moisture</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmZonesPage;
