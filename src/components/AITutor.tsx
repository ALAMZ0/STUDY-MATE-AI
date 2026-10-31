import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  Zap,
  GraduationCap,
  ListOrdered,
  BookMarked,
  Layers,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { SUBJECTS, EDUCATIONAL_LEVELS } from '../data/curriculumData';
import { aiService } from '../services/aiService';
import { ChatMessage, AcademicLevel } from '../types';
import { FormattedContent, MathText } from './MathRenderer';

export const AITutor: React.FC = () => {
  const { selectedSubject, setSelectedSubject, selectedLevel, setSelectedLevel, addSession } = useStudy();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeSubjectInfo = SUBJECTS.find((s) => s.id === selectedSubject) || SUBJECTS[0];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Welcome to **StudyMate AI Tutor**! I am your personal academic tutor powered by **Google Gemma 4 E2B Instruct**.

I am tuned specifically for the Nigerian syllabus (**${selectedLevel}** level in **${activeSubjectInfo.name}**).

Whether you are preparing for **WAEC/WASSCE, NECO, JAMB/UTME**, or university exams, I can:
- Break down difficult theories step by step
- Provide practical everyday Nigerian examples
- Explain concepts in simple plain English
- Walk you through WAEC/JAMB past examination questions

What concept or problem would you like to master today?`,
      timestamp: 'Just now',
      suggestedFollowUps: [
        `Explain the foundational laws of ${activeSubjectInfo.name}`,
        'Give me a practical Nigerian example',
        'Show a typical WAEC past question on this',
        'Break down this concept step-by-step',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string, actionType: any = 'standard') => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: activeSubjectInfo.name,
      level: selectedLevel,
      actionType,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      // Build conversation history
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await aiService.sendChatMessage({
        message: text,
        subject: activeSubjectInfo.name,
        level: selectedLevel,
        actionType,
        history,
      });

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: response.suggestedFollowUps,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Add to study history
      addSession({
        type: 'tutor',
        title: text.length > 35 ? text.substring(0, 35) + '...' : text,
        subject: activeSubjectInfo.name,
        level: selectedLevel,
        summary: `Learned about ${text.substring(0, 45)} with Gemma 4 E2B Instruct.`,
      });
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `**Google Gemma 4 Notice:** ${err.message || 'The Gemma model on Kaggle is currently unavailable.'}\n\nPlease check that your Kaggle notebook is running with the public Gradio link active, or verify the \`GEMMA_API_URL\` in Settings.`,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionChip = (actionType: 'example' | 'simplify' | 'step_by_step' | 'past_question') => {
    const labels = {
      example: 'Give me a relatable Nigerian real-life example for this.',
      simplify: 'Explain this in the simplest possible terms like I am 12 years old.',
      step_by_step: 'Please break down this derivation or calculation step by step.',
      past_question: 'Show me how WAEC and JAMB examiners formulate this question.',
    };
    handleSendMessage(labels[actionType], actionType);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat session refreshed. Ready for our next topic in **${activeSubjectInfo.name}** (${selectedLevel})!`,
        timestamp: 'Just now',
        suggestedFollowUps: [
          'Give me a practical Nigerian example',
          'Explain step by step',
          'Show a typical exam question',
        ],
      },
    ]);
  };

  // Render markdown-like sections cleanly
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-3 text-sm sm:text-base leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base sm:text-lg font-bold text-white mt-4 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('#### ')) {
            return (
              <h4 key={idx} className="text-sm sm:text-base font-semibold text-blue-300 mt-3 mb-1">
                {line.replace('#### ', '')}
              </h4>
            );
          }
          if (line.startsWith('- **') || line.startsWith('* **')) {
            const parts = line.replace(/^[-*]\s+/, '').split('**:');
            if (parts.length > 1) {
              return (
                <div key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-blue-400 font-bold">·</span>
                  <div>
                    <strong className="text-white">{parts[0].replace('**', '')}:</strong>
                    <span>{parts.slice(1).join('**:')}</span>
                  </div>
                </div>
              );
            }
          }
          if (line.startsWith('> ')) {
            return (
              <div
                key={idx}
                className="p-3 my-2 rounded-xl bg-blue-950/40 border border-blue-800/50 text-slate-200 text-sm italic"
              >
                {line.replace('> ', '')}
              </div>
            );
          }
          if (line.startsWith('**Step ') || line.startsWith('**Rule ')) {
            return (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 my-2">
                <span className="font-semibold text-blue-400">{line}</span>
              </div>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} className="text-slate-300">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-6xl mx-auto">
      {/* Header Controls Bar: Subject, Level & Model Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-800 mb-4 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Dropdown */}
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-400" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as any)}
              className="bg-slate-950 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Level Switcher */}
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-emerald-400" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as AcademicLevel)}
              className="bg-slate-950 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              {EDUCATIONAL_LEVELS.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side: Gemma 4 Badge & Reset */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Gemma 4 E2B Instruct</span>
          </div>

          <button
            onClick={handleClearChat}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Clear current chat"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-6 px-1 sm:px-4 py-2">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                  <Bot className="h-5 w-5" />
                </div>
              )}

              <div
                className={`max-w-2xl sm:max-w-3xl rounded-2xl p-4 sm:p-6 transition-all ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-xs shadow-md shadow-blue-600/20'
                    : 'bg-slate-900/80 border border-slate-800/90 text-slate-100 rounded-tl-xs shadow-xl'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between text-xs mb-2 pb-1.5 border-b border-white/10">
                  <span className="font-semibold flex items-center gap-1.5">
                    {isUser ? 'You' : 'StudyMate Gemma Tutor'}
                  </span>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[11px]">{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 hover:text-white rounded transition-colors"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Body */}
                {isUser ? (
                  <MathText
                    as="p"
                    text={msg.content}
                    className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap"
                  />
                ) : (
                  <FormattedContent content={msg.content} />
                )}

                {/* Suggested Follow-Ups */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && !isUser && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Suggested Follow-Up
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((prompt, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleSendMessage(prompt)}
                          className="text-xs text-left px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white hover:border-blue-500/50 hover:bg-slate-800/80 transition-colors"
                        >
                          <MathText text={prompt} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 sm:gap-4 justify-start">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white animate-pulse">
              <Bot className="h-5 w-5" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-3">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Gemma 4 is formulating a structured explanation for {selectedLevel}...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Action Chips Bar */}
      <div className="pt-3 pb-2 px-1 flex items-center gap-2 overflow-x-auto shrink-0 no-scrollbar">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider shrink-0">
          Tutor Modes:
        </span>
        <button
          onClick={() => handleActionChip('example')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-blue-500/40 whitespace-nowrap shrink-0 transition-colors"
        >
          <Lightbulb className="h-3 w-3 text-amber-400" />
          <span>Nigerian Example</span>
        </button>
        <button
          onClick={() => handleActionChip('step_by_step')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-blue-500/40 whitespace-nowrap shrink-0 transition-colors"
        >
          <ListOrdered className="h-3 w-3 text-blue-400" />
          <span>Step-by-Step Derivation</span>
        </button>
        <button
          onClick={() => handleActionChip('simplify')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-blue-500/40 whitespace-nowrap shrink-0 transition-colors"
        >
          <Zap className="h-3 w-3 text-emerald-400" />
          <span>Simplify Concept</span>
        </button>
        <button
          onClick={() => handleActionChip('past_question')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-blue-500/40 whitespace-nowrap shrink-0 transition-colors"
        >
          <BookMarked className="h-3 w-3 text-purple-400" />
          <span>WAEC/JAMB Style</span>
        </button>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-2 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl shrink-0"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask a question in ${activeSubjectInfo.name} (${selectedLevel})...`}
            className="flex-1 bg-transparent px-3 py-2 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-hidden"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors shrink-0 shadow-md shadow-blue-600/20"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
