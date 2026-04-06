import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Droplets, Wifi, Brain, Leaf, ArrowRight, ArrowDown, Cloud, BarChart3,
  Sprout, TrendingUp, Wallet, Radio, Cpu, Eye, Layers, Zap, Target,
  Shield, ChevronUp, ChevronDown, Server, Database, Smartphone,
  GitBranch, MapPin, FileBarChart, Settings, Bell, Bot, Camera,
  Truck, Plane, MessageSquare, Store, Wrench, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TOTAL_SLIDES = 12;

const SlideIndicator = ({ current, total, onNavigate }) => (
  <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2" data-testid="slide-indicator">
    {Array.from({ length: total }).map((_, i) => (
      <button key={i} onClick={() => onNavigate(i)}
        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-cyan-400 scale-125 shadow-lg shadow-cyan-400/50' : 'bg-slate-600 hover:bg-slate-400'}`}
        data-testid={`slide-dot-${i}`} />
    ))}
  </div>
);

const SlideCounter = ({ current, total }) => (
  <div className="fixed bottom-6 right-6 z-50 text-sm font-mono text-slate-500" data-testid="slide-counter">
    <span className="text-cyan-400 font-bold">{String(current + 1).padStart(2, '0')}</span>
    <span className="mx-1">/</span>
    <span>{String(total).padStart(2, '0')}</span>
  </div>
);

const slideVariants = {
  enter: (dir) => ({ y: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir) => ({ y: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback((idx) => {
    if (isTransitioning || idx === slide || idx < 0 || idx >= TOTAL_SLIDES) return;
    setIsTransitioning(true);
    setDirection(idx > slide ? 1 : -1);
    setSlide(idx);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [slide, isTransitioning]);

  const next = useCallback(() => goTo(slide + 1), [slide, goTo]);
  const prev = useCallback(() => goTo(slide - 1), [slide, goTo]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Home') { e.preventDefault(); goTo(0); }
      if (e.key === 'End') { e.preventDefault(); goTo(TOTAL_SLIDES - 1); }
    };
    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > 30) {
        if (e.deltaY > 0) next(); else prev();
      }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => { window.removeEventListener('keydown', handleKey); window.removeEventListener('wheel', handleWheel); };
  }, [next, prev, goTo]);

  const fadeUp = { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } };
  const stagger = (i) => ({ initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.1, duration: 0.5 } });

  const slides = [
    // ─── SLIDE 0: TITLE ───
    () => (
      <div className="flex flex-col items-center justify-center h-full text-center relative">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-cyan-500/8 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-500/6 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 space-y-8">
          <motion.div {...fadeUp} className="flex items-center gap-3 justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
              <Droplets size={32} className="text-white" />
            </div>
          </motion.div>
          <motion.h1 {...fadeUp} transition={{ delay: 0.2 }} className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight">
            <span className="text-white">Aqua</span>
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">Sense</span>
            <span className="text-white"> AI</span>
          </motion.h1>
          <motion.p {...fadeUp} transition={{ delay: 0.4 }} className="text-xl sm:text-2xl text-slate-400 max-w-2xl mx-auto font-light">
            AI-Powered Smart Irrigation & Complete Agriculture Intelligence Platform
          </motion.p>
          <motion.div {...fadeUp} transition={{ delay: 0.6 }} className="flex items-center gap-4 justify-center pt-4">
            <div className="px-4 py-2 rounded-full border border-slate-700 text-sm text-slate-400">React + FastAPI + MongoDB</div>
            <div className="px-4 py-2 rounded-full border border-slate-700 text-sm text-slate-400">TensorFlow + PyTorch</div>
            <div className="px-4 py-2 rounded-full border border-slate-700 text-sm text-slate-400">ESP32 IoT</div>
          </motion.div>
          <motion.div {...fadeUp} transition={{ delay: 0.8 }} className="flex gap-4 justify-center pt-6">
            <Button onClick={() => navigate('/login')} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-10 py-6 text-base rounded-full font-bold shadow-xl shadow-cyan-500/25" data-testid="launch-dashboard-btn">
              Launch Dashboard <ArrowRight className="ml-2" size={18} />
            </Button>
            <Button onClick={() => goTo(1)} variant="outline" className="border-2 border-slate-700 text-slate-300 hover:bg-slate-800 px-10 py-6 text-base rounded-full font-semibold">
              View Presentation <ArrowDown className="ml-2" size={18} />
            </Button>
          </motion.div>
        </div>
      </div>
    ),

    // ─── SLIDE 1: PROBLEM ───
    () => (
      <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-8">
        <motion.div {...fadeUp}>
          <span className="text-sm text-red-400 font-bold uppercase tracking-[0.2em]">The Problem</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mt-3 mb-4">Agriculture is Broken</h2>
          <p className="text-lg text-slate-400 max-w-3xl mb-8">India's agriculture sector loses over <span className="text-red-400 font-bold">$18 billion</span> annually due to inefficient water management and lack of data-driven decisions.</p>
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Target, val: '60%', label: 'Water Wasted', desc: 'Inefficient flood irrigation', color: 'red' },
            { icon: Droplets, val: '70%', label: 'Farmers Guessing', desc: 'No sensor data available', color: 'orange' },
            { icon: Wifi, val: '0', label: 'Real-time Alerts', desc: 'Manual field checking only', color: 'amber' },
            { icon: Layers, val: '5+', label: 'Fragmented Tools', desc: 'Weather, soil, market separate', color: 'red' },
          ].map((item, i) => (
            <motion.div key={i} {...stagger(i)}>
              <Card className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-red-500/30 transition-all text-center h-full">
                <item.icon size={28} className="text-red-400/70 mx-auto mb-3" />
                <p className={`text-4xl font-black text-${item.color}-400 mb-1`}>{item.val}</p>
                <p className="text-sm font-bold text-white">{item.label}</p>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    ),

    // ─── SLIDE 2: SOLUTION ───
    () => (
      <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-8">
        <motion.div {...fadeUp} className="text-center mb-8">
          <span className="text-sm text-cyan-400 font-bold uppercase tracking-[0.2em]">Our Solution</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mt-3 mb-3">One Platform. Everything.</h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">AquaSense AI combines IoT sensors, ML models, and intelligent analytics into a single platform for complete farm management.</p>
        </motion.div>
        <div className="grid grid-cols-4 gap-6">
          {[
            { step: '01', icon: Radio, title: 'Sensors Collect', desc: 'ESP32 IoT sensors monitor soil, temp, humidity in real-time via WebSocket' },
            { step: '02', icon: Cpu, title: 'AI Analyzes', desc: '4 ML models process sensor data: RandomForest, UNet-ResNet34, MobileNetV2' },
            { step: '03', icon: Brain, title: 'Decisions Made', desc: 'Irrigation schedules, crop recommendations, drone zone analysis, health alerts' },
            { step: '04', icon: Sprout, title: 'Farmer Acts', desc: 'Dashboard + push notifications. Mandi prices, market trends, financial tools' },
          ].map((item, i) => (
            <motion.div key={i} {...stagger(i)}>
              <div className="relative p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-cyan-500/30 transition-all text-center h-full group">
                <span className="text-5xl font-black text-cyan-500/10 absolute top-3 right-4">{item.step}</span>
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-500/20 transition-colors">
                  <item.icon size={26} className="text-cyan-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ),

    // ─── SLIDE 3: TECH STACK / ARCHITECTURE ───
    () => (
      <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-8">
        <motion.div {...fadeUp} className="text-center mb-6">
          <span className="text-sm text-teal-400 font-bold uppercase tracking-[0.2em]">System Architecture</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mt-2">Tech Stack</h2>
        </motion.div>
        <div className="grid grid-cols-3 gap-5">
          {/* Frontend */}
          <motion.div {...stagger(0)}>
            <Card className="p-5 rounded-2xl bg-slate-900/60 border border-cyan-500/20 h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center"><Smartphone size={16} className="text-cyan-400" /></div>
                <h3 className="text-base font-bold text-cyan-400">Frontend</h3>
              </div>
              <div className="space-y-1.5">
                {['React 18 + Tailwind CSS', 'Framer Motion animations', 'Recharts visualization', 'Shadcn/UI components', 'WebSocket real-time', 'Multi-farm selector'].map((t, i) => (
                  <div key={i} className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-cyan-400" /><span className="text-xs text-slate-300">{t}</span></div>
                ))}
              </div>
            </Card>
          </motion.div>
          {/* Backend */}
          <motion.div {...stagger(1)}>
            <Card className="p-5 rounded-2xl bg-slate-900/60 border border-teal-500/20 h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center"><Server size={16} className="text-teal-400" /></div>
                <h3 className="text-base font-bold text-teal-400">Backend</h3>
              </div>
              <div className="space-y-1.5">
                {['FastAPI (12 route modules)', 'Motor async MongoDB', 'JWT authentication', 'WebSocket broadcast', 'Firebase push notifs', 'Ollama + Gemini dual AI'].map((t, i) => (
                  <div key={i} className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-teal-400" /><span className="text-xs text-slate-300">{t}</span></div>
                ))}
              </div>
            </Card>
          </motion.div>
          {/* ML / AI */}
          <motion.div {...stagger(2)}>
            <Card className="p-5 rounded-2xl bg-slate-900/60 border border-emerald-500/20 h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center"><Brain size={16} className="text-emerald-400" /></div>
                <h3 className="text-base font-bold text-emerald-400">ML / AI</h3>
              </div>
              <div className="space-y-1.5">
                {['Irrigation RandomForest', 'Crop Prediction (22 classes)', 'Drone UNet-ResNet34', 'Rover MobileNetV2', 'Gemini 3 Pro chatbot', 'ML microservice ready'].map((t, i) => (
                  <div key={i} className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-400" /><span className="text-xs text-slate-300">{t}</span></div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
        <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="mt-5">
          <div className="flex items-center justify-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold">ESP32 Sensors</div>
            <ArrowRight size={14} className="text-slate-600" />
            <div className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 font-semibold">FastAPI + WS</div>
            <ArrowRight size={14} className="text-slate-600" />
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">ML Models</div>
            <ArrowRight size={14} className="text-slate-600" />
            <div className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 font-semibold">MongoDB</div>
            <ArrowRight size={14} className="text-slate-600" />
            <div className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-semibold">React Dashboard</div>
          </div>
        </motion.div>
      </div>
    ),

    // ─── SLIDE 4: CORE FEATURES — IOT & IRRIGATION ───
    () => (
      <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-8">
        <motion.div {...fadeUp} className="mb-5">
          <span className="text-sm text-cyan-400 font-bold uppercase tracking-[0.2em]">Core Module</span>
          <h2 className="text-4xl font-black text-white mt-2">IoT + Smart Irrigation</h2>
        </motion.div>
        <div className="grid grid-cols-2 gap-5">
          <motion.div {...stagger(0)} className="space-y-4">
            <Card className="p-5 rounded-2xl bg-slate-900/60 border border-cyan-500/20">
              <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2"><Radio size={18} className="text-cyan-400" /> Real-Time Sensor Data</h3>
              <div className="grid grid-cols-2 gap-3">
                {[{ label: 'Soil Moisture', val: '65.5%', color: 'cyan' }, { label: 'Temperature', val: '25.0\u00B0C', color: 'rose' }, { label: 'Humidity', val: '61.7%', color: 'sky' }, { label: 'Soil Temp', val: '27.7\u00B0C', color: 'teal' }].map((s, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-800/80 text-center">
                    <p className="text-[10px] text-slate-500">{s.label}</p>
                    <p className={`text-xl font-bold text-${s.color}-400`}>{s.val}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/20">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Zap size={16} className="text-emerald-400" /> AI Decision Engine</h3>
              <p className="text-xs text-slate-400">ML model analyzes sensor data + weather forecasts to produce irrigation decisions with 84-92% confidence.</p>
            </Card>
          </motion.div>
          <motion.div {...stagger(1)} className="space-y-4">
            <Card className="p-5 rounded-2xl bg-slate-900/60 border border-teal-500/20">
              <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2"><Wifi size={18} className="text-teal-400" /> ESP32 Integration</h3>
              <div className="space-y-2">
                {['POST /api/iot/sensor-data for ESP32 devices', 'WebSocket broadcast to all dashboards', 'Auto ADC-to-percentage (0-4095)', 'Multi-device support with device_id', '3-second polling + live WebSocket'].map((t, i) => (
                  <div key={i} className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" /><span className="text-xs text-slate-300">{t}</span></div>
                ))}
              </div>
            </Card>
            <Card className="p-4 rounded-2xl bg-gradient-to-r from-cyan-600/20 to-teal-600/20 border border-cyan-500/30">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-slate-500">Live Status</p><p className="text-sm font-bold text-white">3s Auto-Refresh Active</p></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-xs text-emerald-400 font-semibold">LIVE</span></div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    ),

    // ─── SLIDE 5: MONITORING — DRONE & ROVER ───
    () => (
      <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-8">
        <motion.div {...fadeUp} className="mb-5">
          <span className="text-sm text-violet-400 font-bold uppercase tracking-[0.2em]">Monitoring Module</span>
          <h2 className="text-4xl font-black text-white mt-2">Drone & Rover AI</h2>
        </motion.div>
        <div className="grid grid-cols-2 gap-5">
          <motion.div {...stagger(0)}>
            <Card className="p-5 rounded-2xl bg-slate-900/60 border border-violet-500/20 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center"><Plane size={20} className="text-violet-400" /></div>
                <div><h3 className="text-base font-bold text-white">Drone Monitor</h3><p className="text-[10px] text-slate-500">UNet-ResNet34 Segmentation</p></div>
              </div>
              <div className="space-y-1.5">
                {['PyTorch UNet-ResNet34 field segmentation', 'Identifies moisture zones (High/Med/Low/Critical)', 'ESP32-CAM live feed via DRONE_FEED_URL', 'Manual image upload analysis', 'Zone-based irrigation recommendations', 'Results saved to MongoDB'].map((t, i) => (
                  <div key={i} className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" /><span className="text-xs text-slate-300">{t}</span></div>
                ))}
              </div>
            </Card>
          </motion.div>
          <motion.div {...stagger(1)}>
            <Card className="p-5 rounded-2xl bg-slate-900/60 border border-emerald-500/20 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Truck size={20} className="text-emerald-400" /></div>
                <div><h3 className="text-base font-bold text-white">Rover Monitor</h3><p className="text-[10px] text-slate-500">MobileNetV2 Crop Health</p></div>
              </div>
              <div className="space-y-1.5">
                {['TensorFlow MobileNetV2 crop health analysis', 'Classifies: Healthy/Moderate/Stressed/Critical', 'Water stress index per frame', 'ESP32-CAM live feed with 5s auto-analyze', 'ROVER_FEED_URL configurable from Settings', 'Image upload for manual analysis'].map((t, i) => (
                  <div key={i} className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" /><span className="text-xs text-slate-300">{t}</span></div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    ),

    // ─── SLIDE 6: AGRICULTURE INTELLIGENCE ───
    () => (
      <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-8">
        <motion.div {...fadeUp} className="text-center mb-6">
          <span className="text-sm text-emerald-400 font-bold uppercase tracking-[0.2em]">Agriculture Intelligence</span>
          <h2 className="text-4xl font-black text-white mt-2">Complete Farm Toolkit</h2>
        </motion.div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Leaf, title: 'Crop Prediction', desc: 'RandomForest ML — 22 crop classes. Input nutrients + weather, get top-3 with confidence.', color: 'emerald' },
            { icon: TrendingUp, title: 'Yield Prediction', desc: 'Estimates yield from soil, irrigation, temperature, rainfall patterns.', color: 'teal' },
            { icon: Store, title: 'Mandi Pricing', desc: 'Market prices for Punjab & Maharashtra. Filter by state, district, category.', color: 'amber' },
            { icon: BarChart3, title: 'Market Trends', desc: '30-day price history + 7-day predictions. Track commodity movements.', color: 'cyan' },
            { icon: Wrench, title: 'Equipment Rental', desc: 'MongoDB marketplace. List & search tractors, drones by state/type.', color: 'violet' },
            { icon: Wallet, title: 'Financial Tools', desc: 'EMI calculator, govt schemes (PM-KISAN, PMFBY), insurance, P&L.', color: 'sky' },
          ].map((f, i) => (
            <motion.div key={i} {...stagger(i)}>
              <Card className={`p-4 rounded-2xl bg-slate-900/60 border border-${f.color}-500/20 hover:border-${f.color}-500/40 transition-all h-full`}>
                <div className={`w-9 h-9 rounded-lg bg-${f.color}-500/15 flex items-center justify-center mb-2.5`}><f.icon size={18} className={`text-${f.color}-400`} /></div>
                <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    ),

    // ─── SLIDE 7: NEW FEATURES — MULTI-FARM, REPORTS, SETTINGS ───
    () => (
      <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-8">
        <motion.div {...fadeUp} className="text-center mb-6">
          <span className="text-sm text-sky-400 font-bold uppercase tracking-[0.2em]">New Features</span>
          <h2 className="text-4xl font-black text-white mt-2">Multi-Farm & Analytics</h2>
        </motion.div>
        <div className="grid grid-cols-3 gap-5">
          <motion.div {...stagger(0)}>
            <Card className="p-5 rounded-2xl bg-slate-900/60 border border-sky-500/20 h-full">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center mb-3"><MapPin size={20} className="text-sky-400" /></div>
              <h3 className="text-base font-bold text-white mb-2">Multi-Farm Support</h3>
              <div className="space-y-1.5">
                {['Up to 5 farms per account', 'Header dropdown switcher', 'Name, location, size, crop', 'Default farm auto-selection', 'Farm-specific sensor data'].map((t, i) => (
                  <div key={i} className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" /><span className="text-xs text-slate-300">{t}</span></div>
                ))}
              </div>
            </Card>
          </motion.div>
          <motion.div {...stagger(1)}>
            <Card className="p-5 rounded-2xl bg-slate-900/60 border border-teal-500/20 h-full">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center mb-3"><FileBarChart size={20} className="text-teal-400" /></div>
              <h3 className="text-base font-bold text-white mb-2">Historical Reports</h3>
              <div className="space-y-1.5">
                {['Sensor trends (7-365 days)', 'Irrigation history & events', 'Water efficiency analytics', 'Daily aggregation charts', 'JSON export capability'].map((t, i) => (
                  <div key={i} className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" /><span className="text-xs text-slate-300">{t}</span></div>
                ))}
              </div>
            </Card>
          </motion.div>
          <motion.div {...stagger(2)}>
            <Card className="p-5 rounded-2xl bg-slate-900/60 border border-violet-500/20 h-full">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center mb-3"><Settings size={20} className="text-violet-400" /></div>
              <h3 className="text-base font-bold text-white mb-2">Unified Settings</h3>
              <div className="space-y-1.5">
                {['ESP32 camera URLs from UI', 'Ollama AI model config', 'Farm management CRUD', 'Notification preferences', 'No .env editing needed'].map((t, i) => (
                  <div key={i} className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" /><span className="text-xs text-slate-300">{t}</span></div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    ),

    // ─── SLIDE 8: AI CHATBOT ───
    () => (
      <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-8">
        <motion.div {...fadeUp} className="text-center mb-6">
          <span className="text-sm text-violet-400 font-bold uppercase tracking-[0.2em]">AI Assistant</span>
          <h2 className="text-4xl font-black text-white mt-2">Dual-Mode AI Chatbot</h2>
        </motion.div>
        <div className="grid grid-cols-2 gap-5">
          <motion.div {...stagger(0)}>
            <Card className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-violet-950/30 border border-violet-500/20 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center"><MessageSquare size={20} className="text-violet-400" /></div>
                <div><h3 className="text-base font-bold text-white">Gemini 3 Pro</h3><p className="text-[10px] text-slate-500">Online Mode (Default)</p></div>
              </div>
              <p className="text-xs text-slate-300 mb-3">Google Gemini 3 Pro via Emergent LLM Key. Expert in irrigation, crop health, soil science, pest control, farm finance.</p>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <p className="text-[10px] text-slate-500 mb-1">Sample:</p>
                <p className="text-cyan-300 font-mono text-[11px]">"Soil moisture at 22%, temp 38C. Irrigate?"</p>
                <p className="text-emerald-300 font-mono text-[11px] mt-1.5">"Yes, irrigate immediately. Critical water stress at 22%..."</p>
              </div>
            </Card>
          </motion.div>
          <motion.div {...stagger(1)}>
            <Card className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-500/20 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Bot size={20} className="text-emerald-400" /></div>
                <div><h3 className="text-base font-bold text-white">Ollama (Local)</h3><p className="text-[10px] text-slate-500">Offline Mode</p></div>
              </div>
              <p className="text-xs text-slate-300 mb-3">Run AI locally — no internet needed. Supports Llama 3, Mistral, Phi-3, Gemma 2. Auto-detects from OLLAMA_URL.</p>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1">
                <p className="text-[10px] text-slate-500">Configuration:</p>
                <p className="text-emerald-300 font-mono text-[11px]">OLLAMA_URL=http://localhost:11434</p>
                <p className="text-emerald-300 font-mono text-[11px]">OLLAMA_MODEL=llama3</p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    ),

    // ─── SLIDE 9: NOTIFICATIONS & ALERTS ───
    () => (
      <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-8">
        <motion.div {...fadeUp} className="text-center mb-6">
          <span className="text-sm text-amber-400 font-bold uppercase tracking-[0.2em]">Alert System</span>
          <h2 className="text-4xl font-black text-white mt-2">Smart Notifications</h2>
        </motion.div>
        <div className="grid grid-cols-2 gap-5 items-start">
          <motion.div {...stagger(0)}>
            <Card className="p-5 rounded-2xl bg-slate-900/60 border border-amber-500/20">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><Bell size={18} className="text-amber-400" /> Alert Triggers</h3>
              <div className="space-y-2.5">
                {[
                  { condition: 'Soil Moisture < 25%', type: 'CRITICAL', action: 'Irrigate immediately', color: 'red' },
                  { condition: 'Soil Moisture < 30%', type: 'WARNING', action: 'Plan irrigation', color: 'amber' },
                  { condition: 'Temperature > 38\u00B0C', type: 'WARNING', action: 'Heat stress alert', color: 'orange' },
                  { condition: 'Water Stress > 0.7', type: 'WARNING', action: 'Check schedule', color: 'amber' },
                ].map((a, i) => (
                  <div key={i} className={`p-2.5 rounded-lg border border-${a.color}-500/20 bg-${a.color}-500/5`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-white">{a.condition}</span>
                      <span className={`text-[10px] font-bold text-${a.color}-400 px-1.5 py-0.5 rounded-full bg-${a.color}-500/10`}>{a.type}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{a.action}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
          <motion.div {...stagger(1)}>
            <Card className="p-5 rounded-2xl bg-slate-900/60 border border-sky-500/20">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><Activity size={18} className="text-sky-400" /> Delivery Channels</h3>
              <div className="space-y-2.5">
                {[
                  { ch: 'Dashboard Alerts', desc: 'Real-time cards in smart alerts section', icon: BarChart3 },
                  { ch: 'WebSocket Push', desc: 'Instant browser notification via broadcast', icon: Wifi },
                  { ch: 'Firebase Push', desc: 'Mobile push (add Firebase credentials)', icon: Bell },
                ].map((c, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-800/40">
                    <c.icon size={16} className="text-sky-400 mt-0.5 flex-shrink-0" />
                    <div><p className="text-xs font-semibold text-white">{c.ch}</p><p className="text-[10px] text-slate-400">{c.desc}</p></div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    ),

    // ─── SLIDE 10: IMPACT ───
    () => (
      <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-8 text-center">
        <motion.div {...fadeUp}>
          <span className="text-sm text-emerald-400 font-bold uppercase tracking-[0.2em]">Proven Impact</span>
          <h2 className="text-5xl sm:text-6xl font-black text-white mt-4 mb-16">Real Results</h2>
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            { val: '40%', label: 'Water Savings', desc: 'Precision irrigation cuts waste', color: 'cyan' },
            { val: '25%', label: 'Yield Increase', desc: 'ML-driven crop management', color: 'emerald' },
            { val: '30%', label: 'Cost Reduction', desc: 'Optimized resource usage', color: 'teal' },
            { val: '22', label: 'Crop Classes', desc: 'ML model coverage', color: 'violet' },
          ].map((s, i) => (
            <motion.div key={i} {...stagger(i)}>
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 transition-all">
                <p className={`text-6xl font-black bg-gradient-to-r from-${s.color}-400 to-${s.color}-300 bg-clip-text text-transparent mb-2`}>{s.val}</p>
                <p className="text-base font-bold text-white">{s.label}</p>
                <p className="text-sm text-slate-500 mt-1">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div {...fadeUp} transition={{ delay: 0.5 }} className="flex justify-center gap-6 flex-wrap">
          {['4 ML Models', '12 API Modules', '20+ Pages', '5 Farms/User', 'WebSocket Live', 'Dual AI Mode'].map((tag, i) => (
            <span key={i} className="px-4 py-2 rounded-full border border-slate-700 text-sm text-slate-400">{tag}</span>
          ))}
        </motion.div>
      </div>
    ),

    // ─── SLIDE 11: CTA ───
    () => (
      <div className="flex flex-col items-center justify-center h-full text-center relative">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px]" />
        </div>
        <div className="relative z-10 space-y-8 max-w-3xl mx-auto px-8">
          <motion.div {...fadeUp}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-cyan-500/30">
              <Droplets size={32} className="text-white" />
            </div>
            <h2 className="text-5xl sm:text-6xl font-black text-white mb-4">Start Smart Farming</h2>
            <p className="text-xl text-slate-400 mb-8">Free to start. Powerful to scale. From a single sensor to a complete farm intelligence platform.</p>
          </motion.div>
          <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/signup')} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-12 py-7 text-lg rounded-full font-bold shadow-xl shadow-cyan-500/25" data-testid="cta-get-started-btn">
              Get Started <ArrowRight className="ml-2" size={20} />
            </Button>
            <Button onClick={() => navigate('/login')} variant="outline" className="border-2 border-slate-600 text-slate-300 hover:bg-slate-800 px-12 py-7 text-lg rounded-full font-semibold" data-testid="cta-demo-btn">
              Try Live Demo
            </Button>
          </motion.div>
          <motion.p {...fadeUp} transition={{ delay: 0.5 }} className="text-sm text-slate-600 pt-4">
            Built with React + FastAPI + TensorFlow + PyTorch + MongoDB + Gemini AI
          </motion.p>
        </div>
      </div>
    ),
  ];

  return (
    <div className="h-screen bg-slate-950 text-white overflow-hidden relative" data-testid="landing-page">
      <SlideIndicator current={slide} total={TOTAL_SLIDES} onNavigate={goTo} />
      <SlideCounter current={slide} total={TOTAL_SLIDES} />

      {/* Nav bar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-slate-950/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={() => goTo(0)} className="flex items-center gap-2">
            <Droplets className="text-cyan-400" size={24} />
            <span className="text-lg font-bold tracking-tight">AquaSense AI</span>
          </button>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-500">
            {['Problem', 'Solution', 'Architecture', 'Features', 'AI', 'Impact'].map((label, i) => (
              <button key={i} onClick={() => goTo(i + 1)} className={`hover:text-white transition-colors ${slide === i + 1 ? 'text-cyan-400' : ''}`}>{label}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/login')} variant="ghost" className="text-slate-400 hover:text-white text-sm" data-testid="nav-login-btn">Log In</Button>
            <Button onClick={() => navigate('/signup')} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-semibold px-5 rounded-full" data-testid="nav-signup-btn">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Navigation hint */}
      {slide === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 text-slate-600">
          <span className="text-xs">Scroll or use arrow keys</span>
          <ChevronDown size={16} className="animate-bounce" />
        </motion.div>
      )}

      {/* Slides */}
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={slide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="h-screen pt-14 overflow-hidden"
        >
          {slides[slide]()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
