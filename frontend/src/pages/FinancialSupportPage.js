import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Calculator, Shield, FileText, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TABS = ['Loan Calculator', 'Government Schemes', 'Insurance', 'P&L Analytics'];
const STATES = ['Maharashtra', 'Karnataka', 'Uttar Pradesh', 'Punjab'];

const FinancialSupportPage = () => {
  const [tab, setTab] = useState('Loan Calculator');
  const [loanForm, setLoanForm] = useState({ amount: 500000, interest: 7, duration: 5 });
  const [emi, setEmi] = useState(null);
  const [schemes, setSchemes] = useState({ central: [], state: [] });
  const [insurance, setInsurance] = useState([]);
  const [schemeState, setSchemeState] = useState('Maharashtra');

  const calcEmi = () => {
    const P = loanForm.amount;
    const r = loanForm.interest / 12 / 100;
    const n = loanForm.duration * 12;
    const e = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = e * n;
    setEmi({ monthly: Math.round(e), total: Math.round(total), interest_paid: Math.round(total - P) });
  };

  useEffect(() => {
    if (tab === 'Government Schemes') {
      axios.get(`${API}/finance/schemes?state=${schemeState}`).then(r => setSchemes(r.data)).catch(() => {});
    }
    if (tab === 'Insurance') {
      axios.get(`${API}/finance/insurance`).then(r => setInsurance(r.data)).catch(() => {});
    }
  }, [tab, schemeState]);

  // Demo P&L data
  const plData = [
    { month: 'Jan', revenue: 45000, expenses: 32000 },
    { month: 'Feb', revenue: 38000, expenses: 28000 },
    { month: 'Mar', revenue: 52000, expenses: 35000 },
    { month: 'Apr', revenue: 61000, expenses: 30000 },
    { month: 'May', revenue: 48000, expenses: 33000 },
    { month: 'Jun', revenue: 55000, expenses: 31000 },
  ];
  const totalRev = plData.reduce((a, b) => a + b.revenue, 0);
  const totalExp = plData.reduce((a, b) => a + b.expenses, 0);
  const totalProfit = totalRev - totalExp;

  return (
    <div data-testid="financial-support-page" className="space-y-6">
      <div>
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-1">Financial Support</h1>
        <p className="text-base text-slate-600">Loans, schemes, insurance, and farm financial analytics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <Button key={t} variant={tab === t ? 'default' : 'outline'} onClick={() => setTab(t)}
            className={`rounded-xl text-sm ${tab === t ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'border-slate-200'}`}
            data-testid={`tab-${t.replace(/\s+/g, '-').toLowerCase()}`}>
            {t}
          </Button>
        ))}
      </div>

      {/* Loan Calculator */}
      {tab === 'Loan Calculator' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <Card className="p-6 rounded-2xl border-2 border-slate-200" data-testid="loan-calculator">
            <div className="flex items-center gap-2 mb-5">
              <Calculator className="text-cyan-600" size={22} />
              <h3 className="text-lg font-heading font-semibold text-slate-900">EMI Calculator</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Loan Amount (Rs)</label>
                <input type="number" value={loanForm.amount} onChange={e => setLoanForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 text-sm" data-testid="loan-amount" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Interest Rate (%)</label>
                <input type="number" step="0.5" value={loanForm.interest} onChange={e => setLoanForm(p => ({ ...p, interest: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 text-sm" data-testid="loan-interest" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Duration (Years)</label>
                <input type="number" value={loanForm.duration} onChange={e => setLoanForm(p => ({ ...p, duration: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 text-sm" data-testid="loan-duration" />
              </div>
            </div>
            <Button onClick={calcEmi} className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl px-8" data-testid="calc-emi-btn">Calculate EMI</Button>
          </Card>
          {emi && (
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-5 rounded-2xl border-2 border-cyan-200 text-center bg-cyan-50">
                <p className="text-xs text-slate-500 mb-1">Monthly EMI</p>
                <p className="text-2xl font-heading font-bold text-cyan-700">Rs {emi.monthly.toLocaleString()}</p>
              </Card>
              <Card className="p-5 rounded-2xl border-2 border-slate-200 text-center">
                <p className="text-xs text-slate-500 mb-1">Total Payment</p>
                <p className="text-2xl font-heading font-bold text-slate-900">Rs {emi.total.toLocaleString()}</p>
              </Card>
              <Card className="p-5 rounded-2xl border-2 border-amber-200 text-center bg-amber-50">
                <p className="text-xs text-slate-500 mb-1">Total Interest</p>
                <p className="text-2xl font-heading font-bold text-amber-700">Rs {emi.interest_paid.toLocaleString()}</p>
              </Card>
            </div>
          )}
        </motion.div>
      )}

      {/* Government Schemes */}
      {tab === 'Government Schemes' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <Card className="p-5 rounded-2xl border-2 border-slate-200">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Select State for State Schemes</label>
            <select value={schemeState} onChange={e => setSchemeState(e.target.value)} className="px-3 py-2 rounded-xl border-2 border-slate-200 text-sm" data-testid="scheme-state">
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Card>

          <h3 className="text-base font-heading font-semibold text-slate-900">Central Schemes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schemes.central.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noreferrer" className="block">
                <Card className="p-5 rounded-2xl border-2 border-slate-200 hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer" data-testid={`scheme-central-${i}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{s.name}</h4>
                      <span className="text-xs px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full">{s.type}</span>
                    </div>
                    <ExternalLink size={16} className="text-cyan-600" />
                  </div>
                  <p className="text-xs text-slate-600 mt-2">{s.description}</p>
                </Card>
              </a>
            ))}
          </div>

          {schemes.state.length > 0 && (
            <>
              <h3 className="text-base font-heading font-semibold text-slate-900 mt-4">{schemeState} State Schemes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schemes.state.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noreferrer" className="block">
                    <Card className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer" data-testid={`scheme-state-${i}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">{s.name}</h4>
                          <p className="text-xs text-slate-600 mt-1">{s.description}</p>
                        </div>
                        <ExternalLink size={16} className="text-emerald-600" />
                      </div>
                    </Card>
                  </a>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Insurance */}
      {tab === 'Insurance' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insurance.map((ins, i) => (
              <a key={i} href={ins.url} target="_blank" rel="noreferrer" className="block">
                <Card className={`p-5 rounded-2xl border-2 hover:shadow-md transition-all cursor-pointer ${ins.type === 'Government' ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-400' : 'border-sky-200 bg-sky-50 hover:border-sky-400'}`} data-testid={`insurance-${i}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ins.type === 'Government' ? 'bg-emerald-200 text-emerald-800' : 'bg-sky-200 text-sky-800'}`}>{ins.type}</span>
                      <h4 className="text-sm font-semibold text-slate-900 mt-2">{ins.name}</h4>
                    </div>
                    <ExternalLink size={16} className="text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-600 mt-2">{ins.description}</p>
                </Card>
              </a>
            ))}
          </div>
        </motion.div>
      )}

      {/* P&L Analytics */}
      {tab === 'P&L Analytics' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-5 rounded-2xl border-2 border-emerald-200 text-center bg-emerald-50">
              <TrendingUp className="mx-auto text-emerald-600 mb-1" size={24} />
              <p className="text-xs text-slate-500">Total Revenue</p>
              <p className="text-2xl font-heading font-bold text-emerald-700">Rs {totalRev.toLocaleString()}</p>
            </Card>
            <Card className="p-5 rounded-2xl border-2 border-red-200 text-center bg-red-50">
              <TrendingDown className="mx-auto text-red-600 mb-1" size={24} />
              <p className="text-xs text-slate-500">Total Expenses</p>
              <p className="text-2xl font-heading font-bold text-red-700">Rs {totalExp.toLocaleString()}</p>
            </Card>
            <Card className={`p-5 rounded-2xl border-2 text-center ${totalProfit >= 0 ? 'border-cyan-200 bg-cyan-50' : 'border-red-200 bg-red-50'}`}>
              <Wallet className={`mx-auto mb-1 ${totalProfit >= 0 ? 'text-cyan-600' : 'text-red-600'}`} size={24} />
              <p className="text-xs text-slate-500">Net Profit</p>
              <p className={`text-2xl font-heading font-bold ${totalProfit >= 0 ? 'text-cyan-700' : 'text-red-700'}`}>Rs {totalProfit.toLocaleString()}</p>
            </Card>
          </div>

          <Card className="p-5 rounded-2xl border-2 border-slate-200" data-testid="pl-chart">
            <h3 className="text-base font-heading font-semibold text-slate-900 mb-4">Profit vs Loss (Demo Data)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={plData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => `Rs ${v.toLocaleString()}`} />
                <Bar dataKey="revenue" name="Revenue" fill="#0891b2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default FinancialSupportPage;
