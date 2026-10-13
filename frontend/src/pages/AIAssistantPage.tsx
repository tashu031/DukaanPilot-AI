import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Cpu,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { AIChatMessage, AIStatus } from '../types';
import { api } from '../services/api';
import { PageId } from '../components/Sidebar';

interface AIAssistantPageProps {
  aiStatus: AIStatus | null;
  currencySymbol: string;
  onNavigate: (page: PageId) => void;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  aiStatus,
  currencySymbol,
  onNavigate
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your **DukaanPilot Business Assistant**.\n\nI analyze your live database records to answer questions about orders, payments, revenues, and profits with 100% mathematical precision.`,
      source_mode: aiStatus?.available ? `Gemma (${aiStatus.model})` : 'Deterministic Business Intelligence Engine',
      suggested_actions: [
        'Which products generated the most revenue?',
        'Which orders are awaiting delivery?',
        'How much estimated profit did I make?',
        'Which customers have pending payments?'
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Which products generated the most revenue?',
    'What are my total expenses this month?',
    'Which orders are awaiting delivery?',
    'How much estimated profit did I make?',
    'Which customers have pending payments?'
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isSending) return;

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsSending(true);

    try {
      const res = await api.chatWithAssistant(query);
      const assistantMsg: AIChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        source_mode: res.source_mode,
        suggested_actions: res.suggested_actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: AIChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: `Sorry, I encountered an error connecting to the business query service: ${err.message}`,
        source_mode: 'System Alert',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleActionClick = (action: string) => {
    // If it's a navigational action
    if (action.includes('View Orders') || action.includes('Pending Deliveries')) {
      onNavigate('orders');
    } else if (action.includes('View Insights') || action.includes('Top Products')) {
      onNavigate('insights');
    } else if (action.includes('Expense')) {
      onNavigate('expenses');
    } else {
      // Send as query
      handleSend(action);
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col space-y-4">
      {/* Top Header & Diagnostics Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-teal-600" />
            <span>AI Business Assistant</span>
          </h1>
          <p className="text-xs text-slate-500">
            Grounded strictly in your stored database records. Zero financial guesswork.
          </p>
        </div>

        {/* Engine Transparency Pill */}
        <div className="flex items-center gap-2">
          {aiStatus?.available ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active Model: <strong>{aiStatus.model}</strong> (Ollama)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Engine: <strong>Deterministic Intelligence</strong> (Ollama Offline)</span>
            </div>
          )}
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        <span className="text-[11px] font-semibold uppercase text-slate-400 shrink-0">
          Suggested Questions:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={isSending}
            className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium shrink-0 transition-colors cursor-pointer hover:border-teal-400 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Log Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 overflow-y-auto space-y-5 shadow-xs">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-teal-600 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none'
                }`}
              >
                {/* Mode Label for Assistant Messages */}
                {!isUser && msg.source_mode && (
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 text-[10px] text-slate-500">
                    <span className="font-semibold text-teal-700 uppercase tracking-wider">
                      Verified Data Response
                    </span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                      {msg.source_mode}
                    </span>
                  </div>
                )}

                {/* Message Text with simple Markdown formatting */}
                <div className="whitespace-pre-line text-xs font-normal">
                  {msg.text}
                </div>

                {/* Suggested Action Pills */}
                {!isUser && msg.suggested_actions && msg.suggested_actions.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                    {msg.suggested_actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => handleActionClick(act)}
                        className="px-2.5 py-1 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-lg text-[11px] font-semibold text-slate-700 hover:text-teal-800 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{act}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`text-[10px] text-right ${
                    isUser ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
              <span>Querying stored business records...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Form Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="shrink-0 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask about revenue, top products, pending deliveries, expenses..."
          disabled={isSending}
          className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
        />
        <button
          type="submit"
          disabled={isSending || !inputQuery.trim()}
          className="p-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
