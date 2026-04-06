import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, 
  LayoutDashboard, 
  MessageSquare, 
  BarChart3, 
  LogOut, 
  Droplet, 
  Map, 
  Plane, 
  Gauge, 
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Truck,
  Leaf,
  TrendingUp,
  Store,
  Wrench,
  Wallet,
  FileBarChart,
  ChevronDown
} from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [farms, setFarms] = useState([]);
  const [activeFarm, setActiveFarm] = useState(null);
  const [farmDropdownOpen, setFarmDropdownOpen] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const res = await axios.get(`${API}/farms`, { headers: { Authorization: `Bearer ${token}` } });
        setFarms(res.data);
        const defaultFarm = res.data.find(f => f.is_default) || res.data[0];
        if (defaultFarm) {
          setActiveFarm(defaultFarm);
          localStorage.setItem('active_farm', JSON.stringify(defaultFarm));
        }
      } catch (e) { /* skip on error */ }
    };
    if (token) fetchFarms();
  }, [token]);

  const switchFarm = (farm) => {
    setActiveFarm(farm);
    localStorage.setItem('active_farm', JSON.stringify(farm));
    setFarmDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('active_farm');
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/irrigation', icon: Droplet, label: 'Irrigation' },
    { path: '/zones', icon: Map, label: 'Farm Zones' },
    { path: '/drone', icon: Plane, label: 'Drone Monitor' },
    { path: '/rover', icon: Truck, label: 'Rover Monitor' },
    { path: '/analytics', icon: Gauge, label: 'Water Analytics' },
    { path: '/chat', icon: MessageSquare, label: 'AI Advisor' },
    { section: 'Agriculture' },
    { path: '/crop-prediction', icon: Leaf, label: 'Crop Prediction' },
    { path: '/yield-prediction', icon: TrendingUp, label: 'Yield Prediction' },
    { path: '/mandi', icon: Store, label: 'Mandi Pricing' },
    { path: '/market-trends', icon: BarChart3, label: 'Market Trends' },
    { path: '/equipment', icon: Wrench, label: 'Equipment Rental' },
    { path: '/finance', icon: Wallet, label: 'Financial Support' },
    { section: 'System' },
    { path: '/reports', icon: FileBarChart, label: 'Historical Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="hidden md:flex flex-col bg-white border-r border-slate-200 shadow-lg relative"
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center gap-2">
                <Droplets className="text-cyan-600" size={32} />
                <span className="text-xl font-heading font-bold text-slate-900">
                  AquaSense AI
                </span>
              </div>
            ) : (
              <Droplets className="text-cyan-600 mx-auto" size={32} />
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item, idx) => {
            if (item.section) {
              return sidebarOpen ? (
                <div key={item.section} className="pt-4 pb-1 px-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.section}</p>
                </div>
              ) : <hr key={item.section} className="border-slate-200 my-2" />;
            }
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-cyan-100 text-cyan-700 font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100"
            >
              <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-semibold">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-600 truncate">
                  {user?.email || ''}
                </p>
              </div>
            </motion.div>
          )}
          
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all w-full ${
              !sidebarOpen ? 'justify-center' : ''
            }`}
            title={!sidebarOpen ? 'Logout' : ''}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-cyan-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-cyan-700 transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </motion.aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Droplets className="text-cyan-600" size={28} />
            <span className="text-lg font-heading font-bold text-slate-900">
              AquaSense AI
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl overflow-y-auto"
            >
              {/* Mobile Sidebar Header */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Droplets className="text-cyan-600" size={32} />
                  <span className="text-xl font-heading font-bold text-slate-900">
                    AquaSense AI
                  </span>
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                  if (item.section) {
                    return (
                      <div key={item.section} className="pt-3 pb-1 px-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.section}</p>
                      </div>
                    );
                  }
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                        isActive
                          ? 'bg-cyan-100 text-cyan-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile User Profile */}
              <div className="p-4 border-t border-slate-200 space-y-2">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100">
                  <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-semibold">
                    {user?.name?.[0] || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all w-full"
                >
                  <LogOut size={20} />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (Desktop only - shows user info + farm selector) */}
        <div className="hidden md:block bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {navItems.find(item => item.path === location.pathname)?.label || 'AquaSense AI'}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Welcome back, {user?.name || 'User'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Farm Selector */}
              {farms.length > 0 && (
                <div className="relative" data-testid="farm-selector">
                  <button
                    onClick={() => setFarmDropdownOpen(!farmDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors"
                    data-testid="farm-selector-btn"
                  >
                    <Map size={16} />
                    <span>{activeFarm?.name || 'Select Farm'}</span>
                    <ChevronDown size={14} className={`transition-transform ${farmDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {farmDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-2" data-testid="farm-dropdown">
                      {farms.map(farm => (
                        <button
                          key={farm.farm_id}
                          onClick={() => switchFarm(farm)}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${activeFarm?.farm_id === farm.farm_id ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700'}`}
                          data-testid={`farm-option-${farm.farm_id}`}
                        >
                          <span className="block">{farm.name}</span>
                          <span className="text-xs text-slate-500">{farm.location} - {farm.size_acres} acres</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="px-4 py-2 bg-cyan-50 text-cyan-700 rounded-lg text-sm font-medium" data-testid="farm-active-badge">
                Farm Active
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 md:mt-0 mt-16">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
