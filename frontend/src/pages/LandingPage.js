import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Droplets, Wifi, Brain, Leaf, ArrowRight, Cloud, BarChart3, Sprout, TrendingUp, Wallet, Radio, Cpu, Eye, Layers, ChevronRight, Zap, Target, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-slate-950/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="text-cyan-400" size={28} />
            <span className="text-xl font-bold tracking-tight">AquaSense AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#problem" className="hover:text-white transition-colors">Problem</a>
            <a href="#solution" className="hover:text-white transition-colors">Solution</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#impact" className="hover:text-white transition-colors">Impact</a>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/login')} variant="ghost" className="text-slate-300 hover:text-white text-sm" data-testid="nav-login-btn">Log In</Button>
            <Button onClick={() => navigate('/signup')} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-semibold px-5 rounded-full" data-testid="nav-signup-btn">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/40 via-slate-950 to-slate-950" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-teal-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div className="flex-1 space-y-8" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm">
                <Radio size={14} className="animate-pulse" /> AI-Powered Smart Agriculture
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                AI-Powered<br />
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">Smart Farming</span><br />
                Platform
              </h1>

              <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                Make data-driven decisions for irrigation, crop planning, and farm management using AI, IoT, and real-time intelligence.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button onClick={() => navigate('/login')} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-8 py-6 text-base rounded-full font-bold shadow-lg shadow-cyan-500/25" data-testid="launch-dashboard-btn">
                  Launch Dashboard <ArrowRight className="ml-2" size={18} />
                </Button>
                <Button onClick={() => navigate('/signup')} variant="outline" className="border-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-6 text-base rounded-full font-semibold" data-testid="explore-platform-btn">
                  View Demo <BarChart3 className="ml-2" size={18} />
                </Button>
              </div>
            </motion.div>

            {/* Floating Cards */}
            <motion.div className="flex-1 relative h-[420px] hidden lg:block" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
              <motion.div className="absolute top-0 left-8 w-56" animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                <Card className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-lg border border-cyan-500/20 shadow-xl shadow-cyan-500/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center"><Droplets size={20} className="text-cyan-400" /></div>
                    <span className="text-sm text-slate-400">Soil Moisture</span>
                  </div>
                  <p className="text-3xl font-bold text-white">32%</p>
                  <div className="mt-2 h-1.5 bg-slate-800 rounded-full"><div className="h-full w-[32%] bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full" /></div>
                </Card>
              </motion.div>

              <motion.div className="absolute top-36 right-0 w-60" animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity }}>
                <Card className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-lg border border-emerald-500/20 shadow-xl shadow-emerald-500/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Zap size={20} className="text-emerald-400" /></div>
                    <span className="text-sm text-slate-400">AI Decision</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-400">Irrigate Now</p>
                  <p className="text-xs text-slate-500 mt-1">Confidence: 89%</p>
                </Card>
              </motion.div>

              <motion.div className="absolute bottom-4 left-16 w-52" animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity }}>
                <Card className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-lg border border-teal-500/20 shadow-xl shadow-teal-500/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center"><TrendingUp size={20} className="text-teal-400" /></div>
                    <span className="text-sm text-slate-400">Water Saved</span>
                  </div>
                  <p className="text-3xl font-bold text-white">28%</p>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section id="problem" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="text-sm text-red-400/80 font-semibold uppercase tracking-widest">The Challenge</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-4">The Problem in Modern Farming</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Agriculture loses billions annually due to outdated practices and lack of data-driven decisions.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Target, title: 'Guesswork Decisions', desc: 'Farmers rely on intuition, not data, for critical irrigation and crop decisions.' },
              { icon: Droplets, title: 'Water Wastage', desc: 'Over 60% of irrigation water is wasted due to inefficient scheduling.' },
              { icon: Wifi, title: 'No Real-Time Data', desc: 'Lack of live sensor monitoring means delayed responses to field conditions.' },
              { icon: Layers, title: 'Fragmented Systems', desc: 'No integrated platform combining weather, soil, market, and financial data.' },
            ].map((item, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }}>
                <Card className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-red-500/30 transition-all h-full">
                  <item.icon size={28} className="text-red-400/70 mb-4" />
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section id="solution" className="py-24 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="text-sm text-cyan-400 font-semibold uppercase tracking-widest">Our Solution</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-4">AquaSense AI</h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">We combine IoT sensors, AI models, and intelligent analytics to provide actionable decisions for farmers — from irrigation to market insights.</p>
          </motion.div>

          {/* How It Works */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {[
              { step: '01', icon: Radio, title: 'Sensors Collect', desc: 'ESP32 IoT sensors monitor soil moisture, temperature, humidity in real-time.' },
              { step: '02', icon: Cpu, title: 'AI Analyzes', desc: 'ML models process sensor data with weather forecasts and historical patterns.' },
              { step: '03', icon: Brain, title: 'Decisions Generated', desc: 'System produces irrigation schedules, crop recommendations, and alerts.' },
              { step: '04', icon: Sprout, title: 'Farmer Acts', desc: 'Clear, actionable insights delivered to dashboard and mobile in seconds.' },
            ].map((item, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.15 }}>
                <div className="relative p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-cyan-500/30 transition-all text-center group">
                  <span className="text-4xl font-black text-cyan-500/15 absolute top-3 right-4">{item.step}</span>
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-500/20 transition-colors">
                    <item.icon size={26} className="text-cyan-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="text-sm text-teal-400 font-semibold uppercase tracking-widest">Platform Features</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-4">Complete Agriculture Intelligence</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Everything a modern farmer needs — in one platform.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Droplets, title: 'Precision Irrigation', desc: 'ML-powered irrigation decisions based on real sensor data', color: 'cyan' },
              { icon: Radio, title: 'IoT Monitoring', desc: 'ESP32 sensors tracking soil, temperature, humidity 24/7', color: 'teal' },
              { icon: Brain, title: 'AI Predictions', desc: 'RandomForest models for irrigation and crop recommendations', color: 'blue' },
              { icon: Cloud, title: 'Weather Intelligence', desc: 'Integrated forecasts for proactive farm management', color: 'sky' },
              { icon: Eye, title: 'AI Advisor', desc: 'Gemini-powered chatbot for instant farm guidance', color: 'violet' },
              { icon: BarChart3, title: 'Advanced Analytics', desc: 'Water usage heatmaps, efficiency tracking, trend analysis', color: 'cyan' },
              { icon: Sprout, title: 'Crop Prediction', desc: '22-class ML model recommends the best crop for your soil', color: 'emerald' },
              { icon: TrendingUp, title: 'Market Insights', desc: 'Mandi pricing, trends, and 7-day price predictions', color: 'teal' },
              { icon: Wallet, title: 'Financial Tools', desc: 'Loan EMI calculator, govt schemes, insurance, P&L analytics', color: 'amber' },
            ].map((f, i) => {
              const colors = { cyan: 'border-cyan-500/20 hover:border-cyan-500/40', teal: 'border-teal-500/20 hover:border-teal-500/40', blue: 'border-blue-500/20 hover:border-blue-500/40', sky: 'border-sky-500/20 hover:border-sky-500/40', violet: 'border-violet-500/20 hover:border-violet-500/40', emerald: 'border-emerald-500/20 hover:border-emerald-500/40', amber: 'border-amber-500/20 hover:border-amber-500/40' };
              const iconColors = { cyan: 'text-cyan-400 bg-cyan-500/10', teal: 'text-teal-400 bg-teal-500/10', blue: 'text-blue-400 bg-blue-500/10', sky: 'text-sky-400 bg-sky-500/10', violet: 'text-violet-400 bg-violet-500/10', emerald: 'text-emerald-400 bg-emerald-500/10', amber: 'text-amber-400 bg-amber-500/10' };
              return (
                <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.06 }}>
                  <Card className={`p-6 rounded-2xl bg-slate-950/60 border ${colors[f.color]} transition-all h-full`}>
                    <div className={`w-11 h-11 rounded-xl ${iconColors[f.color]} flex items-center justify-center mb-4`}>
                      <f.icon size={22} />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── IMPACT / STATS ── */}
      <section id="impact" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-950" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="text-sm text-emerald-400 font-semibold uppercase tracking-widest">Proven Impact</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3">Real Results, Real Savings</h2>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { val: '40%', label: 'Water Savings', desc: 'Precision irrigation reduces waste' },
              { val: '25%', label: 'Yield Increase', desc: 'Data-driven crop management' },
              { val: '24/7', label: 'Monitoring', desc: 'Real-time IoT sensor tracking' },
              { val: '30%', label: 'Cost Reduction', desc: 'Optimized resource allocation' },
              { val: '4', label: 'Smart Zones', desc: 'Zone-based irrigation control' },
            ].map((s, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }}>
                <div className="text-center p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 transition-all">
                  <p className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">{s.val}</p>
                  <p className="text-sm font-bold text-white mt-2">{s.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY DIFFERENT ── */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="text-sm text-cyan-400 font-semibold uppercase tracking-widest">Competitive Edge</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-4">What Makes Us Different</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Layers, title: 'IoT + AI + Analytics in One', desc: 'No more switching between tools. Sensors, models, dashboards, and market data — unified.' },
              { icon: Target, title: 'Zone-Based Irrigation', desc: 'Drone and rover models create per-zone decisions, not one-size-fits-all.' },
              { icon: Eye, title: 'Explainable AI', desc: 'Every decision shows the reasoning — factors analyzed, confidence scores, and actionable advice.' },
              { icon: Shield, title: 'Modular & Scalable', desc: 'Start with irrigation. Add crop prediction, market insights, financial tools as you grow.' },
            ].map((item, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }}>
                <Card className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/30 transition-all flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon size={24} className="text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM PREVIEW ── */}
      <section className="py-24 relative">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="text-sm text-teal-400 font-semibold uppercase tracking-widest">Platform Preview</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-4">Your Command Center</h2>
            <p className="text-lg text-slate-400">Real-time dashboard with everything you need at a glance.</p>
          </motion.div>
          <motion.div {...fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Soil Moisture', value: '77%', sub: 'Optimal range', color: 'cyan' },
              { label: 'Air Temperature', value: '23.9\u00B0C', sub: 'Normal', color: 'teal' },
              { label: 'Humidity', value: '59.9%', sub: 'Good', color: 'sky' },
              { label: 'AI Confidence', value: '89%', sub: 'ML Model Active', color: 'emerald' },
            ].map((card, i) => (
              <Card key={i} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold text-${card.color}-400`}>{card.value}</p>
                <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <motion.div {...fadeUp} className="rounded-3xl bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-600 p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Start Smart Farming Today</h2>
              <p className="text-lg text-cyan-100 mb-8 max-w-xl mx-auto">Join the next generation of data-driven agriculture. Free to start, powerful to scale.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate('/signup')} className="bg-white text-cyan-700 hover:bg-cyan-50 px-10 py-6 text-base rounded-full font-bold shadow-lg" data-testid="cta-get-started-btn">
                  Get Started <ArrowRight className="ml-2" size={18} />
                </Button>
                <Button onClick={() => navigate('/login')} variant="outline" className="border-2 border-white/40 text-white hover:bg-white/10 px-10 py-6 text-base rounded-full font-semibold" data-testid="cta-demo-btn">
                  Try Demo
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Droplets size={18} className="text-cyan-500" />
            <span className="text-sm font-semibold">AquaSense AI</span>
          </div>
          <p className="text-xs text-slate-600">Intelligent Precision Agriculture Platform</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
