import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { TrendingUp, Droplets, BarChart3, Target, Sparkles } from 'lucide-react';
import * as d3 from 'd3';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdvancedAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [loading, setLoading] = useState(true);
  const heatmapRef = useRef(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (patterns && heatmapRef.current) {
      renderIrrigationHeatmap();
    }
  }, [patterns]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [analyticsRes, patternsRes] = await Promise.all([
        axios.get(`${API}/analytics/advanced`, { headers }),
        axios.get(`${API}/analytics/irrigation-patterns`, { headers })
      ]);

      setAnalytics(analyticsRes.data);
      setPatterns(patternsRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderIrrigationHeatmap = () => {
    const svg = d3.select(heatmapRef.current);
    svg.selectAll('*').remove();

    const width = heatmapRef.current.clientWidth;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };

    const data = patterns.pattern_data.slice(-14);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.date))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.water_quantity)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const colorScale = d3.scaleSequential()
      .domain([0, d3.max(data, d => d.water_quantity)])
      .interpolator(d3.interpolateRgb('#34D399', '#06B6D4'));

    const g = svg.append('g');

    // Draw bars
    g.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', d => xScale(d.date))
      .attr('y', d => yScale(d.water_quantity))
      .attr('width', xScale.bandwidth())
      .attr('height', d => height - margin.bottom - yScale(d.water_quantity))
      .attr('fill', d => colorScale(d.water_quantity))
      .attr('rx', 4)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 0.7);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
      });

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '10px');

    // Y axis
    g.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', margin.left - 45)
      .attr('x', -(height / 2))
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Water Quantity (L/m²)');
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton height={40} width={300} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} height={300} />)}
        </div>
      </div>
    );
  }

  const yieldData = analytics?.yield_prediction || {};
  const irrigationAnalysis = analytics?.irrigation_analysis || {};
  const efficiencyMetrics = analytics?.efficiency_metrics || {};

  // Prepare radial chart data
  const radialData = [
    {
      name: 'Water Efficiency',
      value: efficiencyMetrics.water_efficiency || 0,
      fill: '#06B6D4'
    },
    {
      name: 'Optimization',
      value: irrigationAnalysis.optimization_score || 0,
      fill: '#0EA5E9'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">
          Advanced Analytics
        </h1>
        <p className="text-lg text-slate-600">
          AI-powered insights and predictive intelligence
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Predictive Yield Modeling */}
        <Card className="p-6 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-emerald-600" size={24} />
            <h3 className="text-xl font-heading font-semibold text-slate-900">Predicted Yield</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-4xl font-heading font-bold text-emerald-700">
                {yieldData.predicted_yield} kg/acre
              </p>
              <p className="text-sm text-emerald-600 mt-1">
                {yieldData.improvement_percentage > 0 ? '+' : ''}{yieldData.improvement_percentage}% vs baseline
              </p>
            </div>
            <div className="pt-4 border-t border-emerald-200">
              <p className="text-sm text-slate-600">Baseline Yield</p>
              <p className="text-2xl font-semibold text-slate-900">{yieldData.baseline_yield} kg/acre</p>
              <p className="text-xs text-slate-500 mt-1">Optimal conditions</p>
            </div>
            <div className="pt-4 border-t border-emerald-200">
              <p className="text-sm text-slate-600">Confidence Score</p>
              <p className="text-2xl font-semibold text-emerald-600">{yieldData.confidence?.toFixed(1)}%</p>
              <p className="text-xs text-slate-500 mt-1">Model accuracy</p>
            </div>
          </div>
        </Card>

        {/* Water Efficiency Score */}
        <Card className="p-6 rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="text-sky-600" size={24} />
            <h3 className="text-xl font-heading font-semibold text-slate-900">Water Efficiency Metrics</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600">Overall Efficiency Score</p>
              <p className="text-3xl font-heading font-bold text-sky-700">
                {efficiencyMetrics.efficiency_score}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Water Savings Ratio</p>
              <p className="text-2xl font-semibold text-cyan-600">
                {efficiencyMetrics.water_savings_ratio}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Sustainability Rating</p>
              <p className="text-xl font-semibold text-emerald-600">
                {efficiencyMetrics.sustainability_rating}
              </p>
            </div>
          </div>
        </Card>

        {/* Performance Scores */}
        <Card className="p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-blue-600" size={24} />
            <h3 className="text-xl font-heading font-semibold text-slate-900">Performance Scores</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="20%"
              outerRadius="90%"
              data={radialData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar
                minAngle={15}
                background
                clockWise
                dataKey="value"
              />
              <Legend
                iconSize={10}
                layout="vertical"
                verticalAlign="middle"
                align="right"
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Irrigation Pattern Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl border-2 border-cyan-200">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="text-cyan-600" size={24} />
            <h3 className="text-xl font-heading font-semibold text-slate-900">Irrigation Pattern Analysis</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-lg font-semibold text-cyan-700">
                {irrigationAnalysis.pattern?.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-600">Current Frequency</p>
                <p className="text-2xl font-bold text-slate-900">{irrigationAnalysis.frequency}</p>
                <p className="text-xs text-slate-500">irrigations/month</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Optimal Frequency</p>
                <p className="text-2xl font-bold text-emerald-600">{irrigationAnalysis.optimal_frequency}</p>
                <p className="text-xs text-slate-500">irrigations/month</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Optimization Score</p>
                <p className="text-2xl font-bold text-sky-600">{irrigationAnalysis.optimization_score}%</p>
                <p className="text-xs text-slate-500">efficiency</p>
              </div>
            </div>
          </div>
        </Card>

        {/* D3.js Heatmap */}
        <Card className="p-6 rounded-2xl border-2 border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-purple-600" size={24} />
            <h4 className="text-lg font-heading font-semibold text-slate-900">
              Irrigation Water Usage Heatmap
            </h4>
          </div>
          <svg ref={heatmapRef} width="100%" height="300"></svg>
        </Card>
      </div>

      {/* Insights */}
      <Card className="p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-blue-600" size={24} />
          <h4 className="text-lg font-heading font-semibold text-slate-900">
            AI Insights & Recommendations
          </h4>
        </div>
        <div className="space-y-3">
          {irrigationAnalysis.insights?.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 bg-white rounded-lg"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <p className="text-slate-700">{insight}</p>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdvancedAnalyticsPage;
