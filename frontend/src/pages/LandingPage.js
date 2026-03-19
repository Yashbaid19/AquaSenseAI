import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Droplets, Wifi, Brain, Leaf, ArrowRight, Sun, Cloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 text-emerald-200/30"
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            <Droplets size={80} />
          </motion.div>
          <motion.div
            className="absolute bottom-40 right-20 text-sky-200/30"
            animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity }}
          >
            <Cloud size={100} />
          </motion.div>
          <motion.div
            className="absolute top-1/2 right-1/4 text-emerald-300/20"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            <Leaf size={60} />
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left: Text Content */}
            <motion.div
              className="flex-1 space-y-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20">
                <Wifi className="text-sky-600" size={18} />
                <span className="text-sm font-medium text-sky-700">IoT-Powered Agriculture</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-bold text-slate-900 tracking-tight leading-tight">
                AquaSense AI
              </h1>
              
              <p className="text-xl sm:text-2xl text-sky-700 font-semibold">
                Intelligent Precision Irrigation
              </p>

              <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                AI-powered irrigation decisions using real-time sensor data, weather intelligence, and machine learning. 
                Save water, increase yields, and optimize your farm's efficiency with precision agriculture.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  data-testid="launch-dashboard-btn"
                  onClick={() => navigate('/login')}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-sky-500/30 font-semibold"
                >
                  Launch Dashboard
                  <ArrowRight className="ml-2" size={20} />
                </Button>
                <Button
                  data-testid="explore-platform-btn"
                  onClick={() => navigate('/signup')}
                  variant="outline"
                  className="border-2 border-sky-600 text-sky-700 hover:bg-sky-50 px-8 py-6 text-lg rounded-full font-semibold"
                >
                  Get Started
                </Button>
              </div>
            </motion.div>

            {/* Right: Hero Visual */}
            <motion.div
              className="flex-1 relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1677126577258-1a82fdf1a976?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwyfHxmdXR1cmlzdGljJTIwZmFybSUyMGRyb25lJTIwaXJyaWdhdGlvbiUyMHNtYXJ0JTIwYWdyaWN1bHR1cmUlMjBmaWVsZCUyMHNlbnNvcnxlbnwwfHx8fDE3NzM2MzgwNjR8MA&ixlib=rb-4.1.0&q=85"
                  alt="Smart Agriculture"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-sky-900/50 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-slate-900 mb-4">
            Smart Irrigation Intelligence
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Combine IoT sensors, AI predictions, and drone monitoring for optimal water management
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: <Wifi className="text-sky-600" size={32} />,
              title: 'IoT Sensors',
              description: 'Real-time soil moisture, temperature, and humidity monitoring'
            },
            {
              icon: <Brain className="text-blue-600" size={32} />,
              title: 'AI Predictions',
              description: 'Machine learning algorithms predict optimal irrigation timing'
            },
            {
              icon: <Cloud className="text-cyan-600" size={32} />,
              title: 'Weather Intelligence',
              description: 'Integrated weather forecasts for smart water decisions'
            },
            {
              icon: <Sun className="text-blue-500" size={32} />,
              title: 'Water Savings',
              description: 'Reduce water usage by up to 40% with precision irrigation'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-sky-200 hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              style={{ transition: 'all 0.3s ease' }}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-heading font-semibold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-br from-sky-100 to-cyan-50 py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-heading font-bold text-slate-900 mb-4">
              Why Choose AquaSense AI?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Transform your farming with cutting-edge technology
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                stat: '40%',
                label: 'Water Savings',
                description: 'Reduce water usage with precision irrigation'
              },
              {
                stat: '25%',
                label: 'Yield Increase',
                description: 'Optimize crop health and productivity'
              },
              {
                stat: '24/7',
                label: 'Monitoring',
                description: 'Real-time alerts and automated decisions'
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                className="text-center p-8 rounded-2xl bg-white shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-5xl font-heading font-bold text-sky-600 mb-2">
                  {benefit.stat}
                </div>
                <div className="text-xl font-semibold text-slate-900 mb-2">
                  {benefit.label}
                </div>
                <p className="text-slate-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <motion.div
          className="rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 p-12 text-center shadow-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-4">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join smart farmers who are saving water and increasing yields with AquaSense AI
          </p>
          <Button
            onClick={() => navigate('/signup')}
            className="bg-white text-sky-600 hover:bg-blue-50 px-10 py-6 text-lg rounded-full shadow-lg font-semibold"
          >
            Start Free Trial
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;