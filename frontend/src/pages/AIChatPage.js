import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Bot, User } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AIChatPage = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your AI irrigation advisor. Ask me anything about your farm's irrigation needs, soil conditions, or crop health." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}`);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/chat`,
        { message: input, session_id: sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const assistantMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">
          AI Irrigation Advisor
        </h1>
        <p className="text-lg text-slate-600">
          Get expert advice on irrigation decisions
        </p>
      </div>

      {/* Messages */}
      <Card className="flex-1 p-6 rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 overflow-y-auto mb-4">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.role === 'user' ? (
                <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0">
                  <User className="text-white" size={18} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="text-white" size={18} />
                </div>
              )}
              <div
                className={`p-4 rounded-2xl max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-sky-600 text-white'
                    : 'bg-white border-2 border-slate-200 text-slate-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Bot className="text-white" size={18} />
              </div>
              <div className="p-4 rounded-2xl bg-white border-2 border-slate-200">
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Input */}
      <div className="flex gap-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about irrigation recommendations, zone status, or crop health..."
          className="flex-1 rounded-xl border-slate-300 text-base py-6"
          disabled={loading}
        />
        <Button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-sky-600 hover:bg-sky-700 text-white px-8 rounded-xl"
        >
          <Send size={20} />
        </Button>
      </div>
    </div>
  );
};

export default AIChatPage;
