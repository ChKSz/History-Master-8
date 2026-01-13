import React, { useState, useEffect, useRef } from 'react';
import { Lesson, GradingResult, ExamRecord, ExamQuestionResult } from '../types';
import { gradeAnswer } from '../geminiService';
import { CheckCircle2, XCircle, Loader2, Sparkles, ChevronRight, Clock, Target, Trophy, RotateCcw, ListChecks, ArrowLeft, History, Calendar } from 'lucide-react';

interface Props {
  lesson: Lesson;
}

type Mode = 'select' | 'practice-list' | 'practice' | 'exam' | 'exam-result' | 'history' | 'history-detail';

const QuizMode: React.FC<Props> = ({ lesson }) => {
  const [mode, setMode] = useState<Mode>('select');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Single/Multi input handling
  const [userAnswers, setUserAnswers] = useState<string[]>(['']);
  
  const [grading, setGrading] = useState(false);
  const [practiceResult, setPracticeResult] = useState<GradingResult | null>(null);
  
  // Exam specific state
  const [examResults, setExamResults] = useState<ExamQuestionResult[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<number | null>(null);

  // History state
  const [examHistory, setExamHistory] = useState<ExamRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ExamRecord | null>(null);

  // Load history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hm8_exam_history');
      if (stored) {
        setExamHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Save history helper
  const saveExamToHistory = (results: ExamQuestionResult[]) => {
    const totalScore = results.reduce((acc, curr) => acc + curr.grading.score, 0);
    const newRecord: ExamRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      lessonTitle: lesson.title,
      totalScore,
      totalQuestions: lesson.qa.length,
      results
    };

    const updatedHistory = [newRecord, ...examHistory];
    setExamHistory(updatedHistory);
    localStorage.setItem('hm8_exam_history', JSON.stringify(updatedHistory));
  };

  // Reset when lesson changes
  useEffect(() => {
    setMode('select');
    resetQuizState();
  }, [lesson.id]);

  useEffect(() => {
    if (mode === 'exam' && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current !== null) clearInterval(timerRef.current);
            finishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [mode, timeLeft]);

  // Determine answer structure (how many inputs needed)
  useEffect(() => {
    if (mode === 'practice' || mode === 'exam') {
      const currentQ = lesson.qa[currentIndex];
      // Count circle numbers to determine split
      const parts = currentQ.answer.split(/(?=[①②③④⑤⑥⑦⑧⑨⑩])/g);
      // Initialize inputs based on parts count. If 1 part, 1 input. If 3 parts, 3 inputs.
      setUserAnswers(new Array(parts.length).fill(''));
      setPracticeResult(null);
    }
  }, [currentIndex, mode, lesson.qa]);

  const resetQuizState = () => {
    setCurrentIndex(0);
    setUserAnswers(['']);
    setPracticeResult(null);
    setExamResults([]);
  };

  const openPracticeList = () => {
    setMode('practice-list');
  };

  const startPracticeAt = (index: number) => {
    setCurrentIndex(index);
    setMode('practice');
  };

  const startExam = () => {
    setMode('exam');
    resetQuizState();
    setTimeLeft(lesson.qa.length * 2 * 60); 
  };

  const finishExam = () => {
    setMode('exam-result');
    if (timerRef.current !== null) clearInterval(timerRef.current);
    
    // Save to local storage
    if (examResults.length > 0) {
       saveExamToHistory(examResults);
    }
  };

  const currentQA = lesson.qa[currentIndex];
  // Helper to check if current question expects multiple points
  const expectedParts = currentQA.answer.split(/(?=[①②③④⑤⑥⑦⑧⑨⑩])/g);
  const isMultiPart = expectedParts.length > 1;

  const handleInputChange = (index: number, val: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = val;
    setUserAnswers(newAnswers);
  };

  const handleGrade = async () => {
    // Combine answers for grading
    const combinedAnswer = userAnswers.map((ans, i) => isMultiPart ? `${i+1}. ${ans}` : ans).join('\n');
    
    if (!combinedAnswer.trim() || userAnswers.every(a => !a.trim())) return;
    
    setGrading(true);
    const res = await gradeAnswer(currentQA.question, combinedAnswer, currentQA.answer);
    
    if (mode === 'practice') {
      setPracticeResult(res);
    } else if (mode === 'exam') {
      // Store full result including feedback
      // Note: We need to use functional state update to ensure we have the latest results when finishing
      const newResult = { 
        questionId: currentQA.id, 
        questionText: currentQA.question,
        userAnswer: combinedAnswer,
        correctAnswer: currentQA.answer,
        grading: res
      };
      
      setExamResults(prev => {
        const updated = [...prev, newResult];
        // Check if this was the last question
        if (currentIndex >= lesson.qa.length - 1) {
           // We are done. The useEffect dependency on examResults isn't ideal for synchronous save
           // So we save in finishExam, but finishExam needs access to 'updated'.
           // To keep it simple, finishExam calls logic that relies on state, which might be stale in this closure.
           // However, since we update state here, we can trigger finish logic after render or pass data.
           // Let's manually trigger save if it's the last one.
           saveExamToHistory(updated);
           setMode('exam-result');
           if (timerRef.current !== null) clearInterval(timerRef.current);
        }
        return updated;
      });
      
      if (currentIndex < lesson.qa.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }
    setGrading(false);
  };

  const handleNextPractice = () => {
    setCurrentIndex((prev) => (prev + 1) % lesson.qa.length);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // --- SELECTION SCREEN ---
  if (mode === 'select') {
    return (
      <div className="flex flex-col gap-6 items-center justify-center h-full min-h-[400px] animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">选择答题模式</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl px-4">
          <button 
            onClick={startExam}
            className="group flex flex-col items-center p-8 rounded-[2.5rem] bg-surfaceContainer dark:bg-surfaceContainer-dark border border-outline/10 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">模拟考试</h3>
            <p className="text-sm text-outline text-center">
              全真模拟，限时答题<br/>
              考试结束后显示详细AI复盘
            </p>
          </button>

          <button 
            onClick={openPracticeList}
            className="group flex flex-col items-center p-8 rounded-[2.5rem] bg-surfaceContainer dark:bg-surfaceContainer-dark border border-outline/10 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
              <Target size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">专项训练</h3>
            <p className="text-sm text-outline text-center">
              选择题目，逐个击破<br/>
              纲哥详细解析每一题
            </p>
          </button>

          <button 
            onClick={() => setMode('history')}
            className="group flex flex-col items-center p-8 rounded-[2.5rem] bg-surfaceContainer dark:bg-surfaceContainer-dark border border-outline/10 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
              <History size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">考试记录</h3>
            <p className="text-sm text-outline text-center">
              查看历史考试成绩<br/>
              回顾AI点评与错题
            </p>
          </button>
        </div>
      </div>
    );
  }

  // --- PRACTICE LIST SELECTION ---
  if (mode === 'practice-list') {
    return (
      <div className="animate-slide-up pb-24">
         <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setMode('select')} className="text-outline hover:text-primary font-bold flex items-center gap-1">
              <ChevronRight className="rotate-180 inline" size={20}/> 返回
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">专项训练 - 选择题目</h2>
         </div>
         <div className="grid gap-3">
           {lesson.qa.map((item, idx) => (
             <button
               key={item.id}
               onClick={() => startPracticeAt(idx)}
               className="w-full text-left p-6 rounded-[2rem] bg-surfaceContainer dark:bg-surfaceContainer-dark hover:bg-white dark:hover:bg-gray-800 border border-outline/10 hover:border-primary/30 transition-all duration-200 flex items-start gap-4"
             >
               <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mt-0.5">
                 {idx + 1}
               </span>
               <span className="text-gray-800 dark:text-gray-100 font-medium leading-relaxed">
                 {item.question}
               </span>
             </button>
           ))}
         </div>
      </div>
    );
  }

  // --- HISTORY LIST ---
  if (mode === 'history') {
    return (
      <div className="animate-slide-up pb-24">
         <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setMode('select')} className="text-outline hover:text-primary font-bold flex items-center gap-1">
              <ChevronRight className="rotate-180 inline" size={20}/> 返回
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">考试记录</h2>
         </div>
         
         {examHistory.length === 0 ? (
           <div className="text-center py-20 text-outline">
             <History size={48} className="mx-auto mb-4 opacity-50" />
             <p>暂无考试记录，快去“模拟考试”挑战一下吧！</p>
           </div>
         ) : (
           <div className="grid gap-4">
             {examHistory.map((record) => (
               <button
                 key={record.id}
                 onClick={() => { setSelectedRecord(record); setMode('history-detail'); }}
                 className="w-full text-left p-6 rounded-[2rem] bg-surfaceContainer dark:bg-surfaceContainer-dark hover:bg-white dark:hover:bg-gray-800 border border-outline/10 hover:border-primary/30 transition-all duration-200"
               >
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate pr-4">{record.lessonTitle}</h3>
                   <div className="flex items-center gap-1 text-xs text-outline bg-surface dark:bg-black/20 px-2 py-1 rounded-full">
                     <Calendar size={12} /> {formatDate(record.timestamp)}
                   </div>
                 </div>
                 <div className="flex items-center gap-4 mt-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-outline">得分</span>
                      <span className={`text-xl font-bold ${record.totalScore / record.totalQuestions >= 80 ? 'text-green-600' : 'text-primary'}`}>
                        {Math.round(record.totalScore / record.totalQuestions)} <span className="text-xs font-normal text-gray-500">平均分</span>
                      </span>
                    </div>
                    <div className="w-px h-8 bg-outline/20"></div>
                    <div className="flex flex-col">
                      <span className="text-xs text-outline">题目数</span>
                      <span className="text-xl font-bold text-gray-700 dark:text-gray-300">{record.totalQuestions}</span>
                    </div>
                 </div>
               </button>
             ))}
           </div>
         )}
      </div>
    );
  }

  // --- EXAM RESULT (Detail or Fresh) ---
  if (mode === 'exam-result' || mode === 'history-detail') {
    const resultsToDisplay = mode === 'history-detail' && selectedRecord ? selectedRecord.results : examResults;
    const totalCount = mode === 'history-detail' && selectedRecord ? selectedRecord.totalQuestions : lesson.qa.length;
    const totalScore = resultsToDisplay.reduce((acc, curr) => acc + curr.grading.score, 0);
    const avgScore = Math.round(totalScore / totalCount);
    const correctCount = resultsToDisplay.filter(r => r.grading.isCorrect).length;
    
    // Title context
    const isHistoryView = mode === 'history-detail';

    return (
      <div className="pb-24 animate-fade-in space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setMode(isHistoryView ? 'history' : 'select')} 
            className="text-outline hover:text-primary font-bold flex items-center gap-1"
          >
            <ChevronRight className="rotate-180 inline" size={20}/> {isHistoryView ? '返回记录' : '返回主页'}
          </button>
        </div>

        <div className="text-center">
           <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/10 text-yellow-600 mb-4">
            <Trophy size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{isHistoryView ? '历史成绩回顾' : '考试复盘'}</h2>
          {isHistoryView && selectedRecord && <p className="text-sm text-outline mb-2">{formatDate(selectedRecord.timestamp)}</p>}
          
          <div className="flex justify-center gap-8 mt-4">
             <div>
               <p className="text-xs text-outline uppercase font-bold">平均分</p>
               <p className="text-2xl font-bold text-primary dark:text-primary-dark">{avgScore}</p>
             </div>
             <div>
               <p className="text-xs text-outline uppercase font-bold">正确率</p>
               <p className="text-2xl font-bold text-green-600">{Math.round((correctCount / totalCount) * 100)}%</p>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          {resultsToDisplay.map((res, idx) => (
            <div key={idx} className="p-6 rounded-[2.5rem] bg-surfaceContainer dark:bg-surfaceContainer-dark border border-outline/10">
               <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white flex-1">
                    <span className="text-primary mr-2">{idx + 1}.</span> {res.questionText}
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap ${res.grading.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {res.grading.score} 分
                  </div>
               </div>
               
               <div className="space-y-4">
                 <div className="p-4 rounded-[1.5rem] bg-white dark:bg-gray-800/50 text-sm">
                   <span className="block text-xs font-bold text-outline mb-1">你的回答</span>
                   <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{res.userAnswer}</p>
                 </div>
                 
                 <div className="p-4 rounded-[1.5rem] bg-primary/5 dark:bg-primary/10 border border-primary/10">
                    <span className="block text-xs font-bold text-primary mb-1">纲哥点评</span>
                    <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{res.grading.feedback}</p>
                 </div>

                 {/* Show reference answer expanded */}
                 <div className="px-2">
                    <span className="block text-xs font-bold text-outline mb-2">标准答案</span>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      {res.correctAnswer.split(/(?=[①②③④⑤⑥⑦⑧⑨⑩])/g).map((part, pIdx) => (
                        <div key={pIdx}>{part.trim()}</div>
                      ))}
                    </div>
                 </div>
               </div>
            </div>
          ))}
        </div>

        {!isHistoryView && (
          <div className="flex justify-center">
            <button 
              onClick={() => { setMode('select'); resetQuizState(); }}
              className="px-8 py-4 rounded-full bg-primary dark:bg-primary-dark text-onPrimary font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
            >
              <RotateCcw size={20} />
              重新开始
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- QUESTION CARD (PRACTICE & EXAM) ---
  return (
    <div className="max-w-2xl mx-auto pb-24 animate-slide-up">
      {/* Progress & Info */}
      <div className="mb-8 flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <button onClick={() => setMode('select')} className="text-outline hover:text-primary text-sm font-bold">退出</button>
          <button 
            onClick={openPracticeList} 
            className={`text-outline hover:text-primary text-sm font-bold flex items-center gap-1 ${mode === 'exam' ? 'hidden' : ''}`}
          >
             <ListChecks size={16}/> 列表
          </button>
          <span className="text-sm font-medium text-outline transition-colors duration-300">
            {mode === 'exam' ? '考试中' : '专项训练'} • {currentIndex + 1} / {lesson.qa.length}
          </span>
        </div>
        {mode === 'exam' && (
          <div className="px-4 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-mono font-bold flex items-center gap-2">
            <Clock size={16} />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="h-2 w-full bg-surfaceContainer dark:bg-gray-700 rounded-full overflow-hidden mb-6 transition-colors duration-300">
        <div 
          className="h-full bg-primary dark:bg-primary-dark transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / lesson.qa.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="bg-surface dark:bg-surfaceContainer-dark rounded-[2.5rem] p-8 shadow-sm border border-outline/10 relative overflow-hidden transition-colors duration-300">
        
        <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-8 leading-relaxed relative z-10 transition-colors duration-300">
          {currentQA.question}
        </h3>

        <div className="space-y-4 relative z-10">
          {/* Dynamic Inputs */}
          {userAnswers.map((ans, idx) => (
            <div key={idx} className="relative">
              {isMultiPart && (
                 <div className="absolute left-4 top-4 text-primary font-bold">{idx + 1}.</div>
              )}
              <textarea
                value={ans}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                disabled={(mode === 'practice' && !!practiceResult) || grading}
                placeholder={isMultiPart ? `输入第 ${idx+1} 点内容...` : "在此输入你的回答..."}
                className={`w-full ${isMultiPart ? 'pl-10 p-4 h-24' : 'p-6 h-40'} rounded-[2rem] bg-surfaceContainer dark:bg-gray-800 border-2 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-gray-900 outline-none transition-all duration-300 resize-none text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 text-lg`}
              />
            </div>
          ))}

          {!practiceResult ? (
            <button
              onClick={handleGrade}
              disabled={grading || userAnswers.every(a => !a.trim())}
              className="w-full py-4 rounded-full bg-primary dark:bg-primary-dark text-onPrimary dark:text-onPrimary-dark font-semibold text-lg hover:shadow-lg active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {grading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              {grading ? '纲哥批改中...' : (mode === 'exam' ? (currentIndex === lesson.qa.length - 1 ? '交卷' : '下一题') : '提交')}
            </button>
          ) : (
            // Only shown in Practice Mode
            <div className="space-y-6 animate-fade-in mt-6">
              <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${practiceResult.isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center gap-3 mb-3">
                  {practiceResult.isCorrect ? (
                    <CheckCircle2 className="text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="text-red-600 dark:text-red-400" />
                  )}
                  <span className={`font-bold text-xl transition-colors duration-300 ${practiceResult.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    得分: {practiceResult.score}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed transition-colors duration-300">
                  {practiceResult.feedback}
                </p>
              </div>

              <div className="p-6 rounded-[2rem] bg-surfaceContainer/50 dark:bg-gray-800/50 border border-outline/10 transition-colors duration-300">
                <p className="text-xs font-bold text-outline uppercase tracking-wider mb-3 transition-colors duration-300">标准答案</p>
                <div className="text-gray-800 dark:text-gray-200 leading-relaxed transition-colors duration-300">
                   {currentQA.answer.split(/(?=[①②③④⑤⑥⑦⑧⑨⑩])/g).map((part, pIdx) => (
                      <div key={pIdx} className={pIdx > 0 ? "mt-1" : ""}>{part.trim()}</div>
                   ))}
                </div>
              </div>

              <div className="flex gap-3">
                 <button
                  onClick={openPracticeList}
                  className="flex-1 py-4 rounded-full bg-surfaceContainer dark:bg-gray-800 text-outline font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  返回列表
                </button>
                <button
                  onClick={handleNextPractice}
                  className="flex-1 py-4 rounded-full bg-primary dark:bg-primary-dark text-onPrimary font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  下一题 <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizMode;