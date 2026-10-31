import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  Sparkles,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trash2,
  GraduationCap,
  Award,
  BookOpen,
  Save,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { EDUCATIONAL_LEVELS, SUBJECTS } from '../data/curriculumData';
import { aiService } from '../services/aiService';
import { GemmaStatusResponse } from '../types';

export const ProfileSettings: React.FC = () => {
  const { profile, updateProfile, resetAllData, selectedLevel, setSelectedLevel } = useStudy();

  const [name, setName] = useState(profile.name);
  const [institution, setInstitution] = useState(profile.institution);
  const [targetExam, setTargetExam] = useState(profile.targetExam);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Gemma backend status
  const [backendStatus, setBackendStatus] = useState<GemmaStatusResponse | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const checkStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await aiService.getStatus();
      setBackendStatus(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      institution,
      targetExam,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetData = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset your study history, quiz statistics and saved sessions?'
    );
    if (confirmed) {
      resetAllData();
      setName('Chidubem Okafor');
      setInstitution('King’s College, Lagos');
      setTargetExam('WAEC / JAMB 2026');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="rounded-2xl bg-linear-to-b from-slate-900 to-slate-950 p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/30">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Student Profile & Gemma AI Configuration</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Manage your academic preferences and inspect the Google Gemma 4 E2B Instruct backend integration.
            </p>
          </div>
        </div>
      </div>

      {/* Gemma 4 Backend Architecture Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-400" />
              <h3 className="text-base sm:text-lg font-bold text-white">
                Google Gemma 4 E2B Instruct Engine
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configured via backend API endpoint (<code className="text-blue-300 font-mono">GEMMA_API_URL</code>)
            </p>
          </div>

          <button
            onClick={checkStatus}
            disabled={isCheckingStatus}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>

        {backendStatus && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Model Name</span>
                <span className="text-xs font-bold text-blue-400 font-mono">{backendStatus.model}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Connection State</span>
                {backendStatus.status === 'connected' ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Kaggle Gradio Model
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Offline / Unreachable
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Inference Latency</span>
                <span className="text-xs font-bold text-white tabular-nums font-mono">
                  {backendStatus.latencyMs} ms
                </span>
              </div>
            </div>

            {/* Error banner if offline */}
            {backendStatus.status === 'offline' && backendStatus.error && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" /> Connection Notice:
                </span>
                <p>{backendStatus.error}</p>
                <p className="text-slate-400 mt-1">
                  Check that your Kaggle notebook is running, cell with `gradio` is executing, and update <code className="text-blue-300 font-mono">GEMMA_API_URL</code> if a new public link was generated.
                </p>
              </div>
            )}

            {/* Config details */}
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 text-xs text-slate-300 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-semibold text-white">Active Gemma Endpoint:</span>
                <span className="text-blue-400 font-mono text-[11px] truncate max-w-md">{backendStatus.endpoint}</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                StudyMate AI is connected to your Google Gemma 4 E2B Instruct model via the public Gradio client endpoint (<code className="text-blue-300 font-mono">/study_mate</code>). All tutoring chats, examination quizzes, and essay evaluations are executed directly by your model.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Student Profile Settings Form */}
      <form
        onSubmit={handleSaveProfile}
        className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">Student Academic Profile</h3>
          </div>
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved successfully
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Student Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 text-white text-sm px-4 py-3 rounded-xl border border-slate-800 focus:outline-hidden focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              School / University
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Queen's College, Yaba or UNILAG"
              className="w-full bg-slate-950 text-white text-sm px-4 py-3 rounded-xl border border-slate-800 focus:outline-hidden focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Educational Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="w-full bg-slate-950 text-white text-sm px-4 py-3 rounded-xl border border-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              {EDUCATIONAL_LEVELS.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Primary Examination Goal
            </label>
            <input
              type="text"
              value={targetExam}
              onChange={(e) => setTargetExam(e.target.value)}
              placeholder="e.g. WAEC May/June 2026, JAMB UTME, 200L Exams"
              className="w-full bg-slate-950 text-white text-sm px-4 py-3 rounded-xl border border-slate-800 focus:outline-hidden focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Reset Study Data</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Save className="h-4 w-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
};
