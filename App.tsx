import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Edit3, MessageCircle, Moon, Sun, Menu, ChevronLeft, ChevronRight, GraduationCap, ChevronDown, LayoutGrid, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { LESSON_DATA, AUTHOR_NAME, AUTHOR_LINK } from './constants';
import { ViewMode, Lesson } from './types';
import Home from './components/Home';
import ReviewMode from './components/ReviewMode';
import QuizMode from './components/QuizMode';
import DeepDiveMode from './components/DeepDiveMode';

const App: React.FC = () => {
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null); // Start with null for Home view
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [isDark, setIsDark] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false); // Desktop sidebar
  
  // Changed from array to single string | null for accordion behavior
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
    // Set initial expanded unit if any
    const firstUnit = LESSON_DATA[0].unit;
    if (firstUnit) setExpandedUnit(firstUnit);
  }, []);

  // Save active lesson to local storage whenever it changes
  useEffect(() => {
    if (activeLessonId) {
      localStorage.setItem('hm8_last_active_lesson', activeLessonId.toString());
    }
  }, [activeLessonId]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLessonChange = (id: number) => {
    setActiveLessonId(id);
    setViewMode('review'); // Default to review when selecting a lesson
    setIsSidebarOpen(false); // Close mobile sidebar
    
    // Auto-expand the unit of the selected lesson (closes others)
    const lesson = LESSON_DATA.find(l => l.id === id);
    if (lesson) {
      setExpandedUnit(lesson.unit);
    }
  };

  const handleStartReview = () => {
    const lastId = localStorage.getItem('hm8_last_active_lesson');
    if (lastId) {
      const id = parseInt(lastId);
      // Verify validity
      if (LESSON_DATA.some(l => l.id === id)) {
        handleLessonChange(id);
        return;
      }
    }
    // Default to first lesson if no history or invalid
    handleLessonChange(LESSON_DATA[0].id);
  };

  const toggleUnit = (unit: string) => {
    // If clicking the already expanded unit, collapse it (set to null).
    // Otherwise, expand the new unit (automatically collapses the previous one).
    setExpandedUnit(prev => (prev === unit ? null : unit));
  };

  const groupedLessons = useMemo(() => {
    const groups: Record<string, Lesson[]> = {};
    LESSON_DATA.forEach(lesson => {
      if (!groups[lesson.unit]) groups[lesson.unit] = [];
      groups[lesson.unit].push(lesson);
    });
    return groups;
  }, []);

  const activeLesson = activeLessonId ? LESSON_DATA.find(l => l.id === activeLessonId) : null;

  const getGroupedEntries = () => {
    return Object.entries(groupedLessons) as [string, Lesson[]][];
  };

  return (
    <div className="flex h-screen w-full bg-surface dark:bg-surface-dark transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 bg-surfaceContainer dark:bg-surfaceContainer-dark 
          border-r border-outline/10 transition-[width,transform] duration-300 ease-in-out flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isDesktopSidebarCollapsed ? 'lg:w-20' : 'lg:w-80'}
          w-80
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar Header */}
          <div className={`
             flex items-center border-b border-outline/10 transition-all duration-300 flex-shrink-0
             ${isDesktopSidebarCollapsed ? 'h-32 flex-col justify-center gap-4 px-2' : 'h-20 justify-between px-6'}
          `}>
            <div 
              className={`flex items-center gap-3 text-primary dark:text-primary-dark font-bold text-xl cursor-pointer transition-opacity duration-300`}
              onClick={() => { setViewMode('home'); setActiveLessonId(null); setIsSidebarOpen(false); }}
            >
              <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
                <GraduationCap size={24} />
              </div>
              <span className={`whitespace-nowrap ${isDesktopSidebarCollapsed ? 'hidden' : 'block'}`}>八年级历史</span>
            </div>
            
            {/* Desktop Collapse Toggle */}
            <button 
              onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
              className="hidden lg:flex p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-outline transition-colors"
            >
              {isDesktopSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
          </div>
          
          {/* Scrollable Nav Area - Hidden when collapsed */}
          <nav className={`flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 custom-scrollbar ${isDesktopSidebarCollapsed ? 'hidden' : 'block'}`}>
             {/* Home Button */}
             <button
                onClick={() => { setViewMode('home'); setActiveLessonId(null); setIsSidebarOpen(false); }}
                className={`w-full text-left p-3 rounded-[1.5rem] text-sm font-bold transition-all duration-300 flex items-center gap-3
                  ${viewMode === 'home'
                    ? 'bg-primary text-onPrimary shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'}
                `}
                title="首页概览"
              >
                <LayoutGrid size={20} className="flex-shrink-0" />
                <span>首页概览</span>
              </button>

            {getGroupedEntries().map(([unit, lessons]) => (
              <div key={unit} className="space-y-2">
                {/* Unit Header */}
                <button
                  onClick={() => toggleUnit(unit)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-outline uppercase tracking-wider hover:text-primary transition-colors text-left"
                >
                  <span className="truncate pr-2">{unit}</span>
                  <ChevronDown size={14} className={`flex-shrink-0 transition-transform duration-300 ${expandedUnit === unit ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Lessons List */}
                <div className={`space-y-1 overflow-hidden transition-all duration-500 ${expandedUnit === unit ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonChange(lesson.id)}
                      className={`w-full text-left p-3 rounded-[1.5rem] text-sm font-medium transition-all duration-300 flex items-center gap-3
                        ${activeLessonId === lesson.id 
                          ? 'bg-primaryContainer dark:bg-primaryContainer-dark text-onPrimaryContainer dark:text-blue-100 shadow-sm translate-x-1' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'}
                      `}
                      title={lesson.title}
                    >
                      <span className="truncate">{lesson.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className={`p-6 text-center border-t border-outline/10 transition-all duration-300 ${isDesktopSidebarCollapsed ? 'hidden' : 'opacity-100'}`}>
            <a 
              href={AUTHOR_LINK} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-outline hover:text-primary transition-colors duration-300 font-medium"
            >
              Created by {AUTHOR_NAME}
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top App Bar (Only visible if not Home) */}
        {viewMode !== 'home' && (
          <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-outline/10 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md z-30 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
              >
                <Menu size={24} className="text-gray-700 dark:text-gray-300" />
              </button>
              <div className="overflow-hidden">
                 <h1 className="text-lg lg:text-xl font-bold text-gray-800 dark:text-gray-100 truncate max-w-[200px] md:max-w-md lg:max-w-2xl transition-colors duration-300">
                  {activeLesson?.title}
                </h1>
                <p className="text-xs text-outline hidden md:block truncate">{activeLesson?.unit}</p>
              </div>
            </div>

            <button 
              onClick={toggleTheme}
              className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300 text-gray-600 dark:text-gray-300 flex-shrink-0"
            >
              {isDark ? <Sun size={24} /> : <Moon size={24} />}
            </button>
          </header>
        )}

        {/* Content Area */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${viewMode === 'home' ? '' : 'p-4 lg:p-8'}`}>
          <div className="max-w-5xl mx-auto h-full">
            {viewMode === 'home' && (
              <>
                 <div className="absolute top-6 right-6 z-50">
                    <button 
                      onClick={toggleTheme}
                      className="p-3 rounded-full bg-surfaceContainer/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 backdrop-blur-sm transition-all duration-300 text-gray-600 dark:text-gray-300"
                    >
                      {isDark ? <Sun size={24} /> : <Moon size={24} />}
                    </button>
                 </div>
                 <div className="absolute top-6 left-6 z-50 lg:hidden">
                    <button 
                      onClick={() => setIsSidebarOpen(true)}
                      className="p-3 rounded-full bg-surfaceContainer/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 backdrop-blur-sm transition-all duration-300 text-gray-600 dark:text-gray-300"
                    >
                      <Menu size={24} />
                    </button>
                 </div>
                <Home onStart={handleStartReview} />
              </>
            )}
            {viewMode !== 'home' && activeLesson && (
              <>
                {viewMode === 'review' && <ReviewMode lesson={activeLesson} />}
                {viewMode === 'quiz' && <QuizMode lesson={activeLesson} />}
                {viewMode === 'deep-dive' && <DeepDiveMode lesson={activeLesson} />}
              </>
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar (Floating M3 Style) */}
        {viewMode !== 'home' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-surfaceContainer dark:bg-gray-800 p-2.5 rounded-full shadow-xl border border-outline/10 flex items-center gap-2 z-40 transition-colors duration-300">
            <NavButton 
              active={viewMode === 'review'} 
              onClick={() => setViewMode('review')} 
              icon={<BookOpen size={22} />} 
              label="学习" 
            />
            <div className="w-px h-6 bg-outline/20 mx-1 transition-colors duration-300"></div>
            <NavButton 
              active={viewMode === 'quiz'} 
              onClick={() => setViewMode('quiz')} 
              icon={<Edit3 size={22} />} 
              label="练习" 
            />
            <div className="w-px h-6 bg-outline/20 mx-1 transition-colors duration-300"></div>
            <NavButton 
              active={viewMode === 'deep-dive'} 
              onClick={() => setViewMode('deep-dive')} 
              icon={<MessageCircle size={22} />} 
              label="提问" 
            />
          </div>
        )}

      </main>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-6 py-3.5 rounded-full transition-all duration-300
      ${active 
        ? 'bg-primary text-onPrimary shadow-md scale-105' 
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}
    `}
  >
    {icon}
    <span className={`text-sm font-bold ${active ? 'inline-block' : 'hidden md:inline-block'}`}>{label}</span>
  </button>
);

export default App;