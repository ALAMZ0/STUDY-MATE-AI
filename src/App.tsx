import React, { useState } from 'react';
import { StudyProvider, useStudy } from './context/StudyContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AITutor } from './components/AITutor';
import { QuizGenerator } from './components/QuizGenerator';
import { AnswerEvaluator } from './components/AnswerEvaluator';
import { SubjectLibrary } from './components/SubjectLibrary';
import { ProfileSettings } from './components/ProfileSettings';

function MainContent() {
  const { activeTab } = useStudy();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#070D18] text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'tutor' && <AITutor />}
          {activeTab === 'quiz' && <QuizGenerator />}
          {activeTab === 'evaluator' && <AnswerEvaluator />}
          {activeTab === 'library' && <SubjectLibrary />}
          {activeTab === 'settings' && <ProfileSettings />}
        </main>

        {/* Quiet Footer */}
        <footer className="border-t border-slate-900 bg-[#060B14] py-4 px-6 text-center text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>© 2026 StudyMate AI · Personalised Learning for Nigerian Students</span>
            <span className="text-slate-400">
              Powered by <strong className="text-blue-400 font-medium">Google Gemma 4 E2B Instruct</strong>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StudyProvider>
      <MainContent />
    </StudyProvider>
  );
}
