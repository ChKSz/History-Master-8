import React, { useState, useRef, useEffect } from 'react';
import { Lesson, ChatMessage } from '../types';
import { LESSON_DATA } from '../constants';
import { askHistoryQuestion } from '../geminiService';
import { Send, Bot, User, Loader2, Info, BookCopy, Keyboard } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  lesson: Lesson;
}

const DeepDiveMode: React.FC<Props> = ({ lesson }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useFullContext, setUseFullContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initial greeting from Gang Ge (Classmate/Creator Persona)
    const initialText = useFullContext 
      ? `我是纲哥 👋。这网站是我为了咱们班期末复习专门做的。整本书的考点我都整理进去了，哪里不会你就问我，咱们争取全班都拿高分！💪` 
      : `我是纲哥 👋。咱们现在复习 **${lesson.title}**。这课我有几个独特的记忆方法，你有哪里不懂的直接问，别客气！✨`;
      
    setMessages([{ 
      role: 'model', 
      text: initialText, 
      timestamp: Date.now() 
    }]);
  }, [lesson, useFullContext]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const currentInput = input;
    const userMsg: ChatMessage = { role: 'user', text: currentInput, timestamp: Date.now() };
    
    // Optimistically update UI
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    let context = '';
    if (useFullContext) {
      context = LESSON_DATA.map(l => 
        `Lesson: ${l.title}\n${l.qa.map(q => `Q: ${q.question}\nA: ${q.answer}`).join('\n')}`
      ).join('\n\n');
    } else {
      context = lesson.qa.map(q => `Q: ${q.question}\nA: ${q.answer}`).join('\n\n');
    }
    
    const responseText = await askHistoryQuestion(context, messages, currentInput);
    
    const aiMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    // Reduced main container height slightly to ensure input sits well above the floating nav
    <div className="h-[calc(100vh-180px)] flex flex-col bg-surface dark:bg-surfaceContainer-dark rounded-[3rem] border border-outline/10 shadow-sm overflow-hidden animate-slide-up transition-colors duration-300 relative">
      {/* Header */}
      <div className="p-4 bg-primaryContainer/30 dark:bg-primaryContainer-dark/30 border-b border-outline/5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm text-primary dark:text-primary-dark transition-colors duration-300">
        <div className="flex items-center gap-2 pl-2">
          <Info size={16} />
          <span className="font-medium">{useFullContext ? "全书复习模式" : "本课专注模式"}</span>
        </div>
        
        <button 
          onClick={() => setUseFullContext(!useFullContext)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border ${
            useFullContext 
              ? 'bg-primary text-onPrimary border-transparent shadow-sm' 
              : 'bg-surface dark:bg-gray-800 text-outline border-outline/20 hover:border-primary/50'
          }`}
        >
          <BookCopy size={14} />
          {useFullContext ? "已启用全书提问" : "切换至全书提问"}
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar transition-colors duration-300">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${msg.role === 'model' ? 'bg-primaryContainer text-onPrimaryContainer' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              {msg.role === 'model' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className={`max-w-[85%] md:max-w-[75%] p-5 rounded-[2rem] transition-colors duration-300 ${
              msg.role === 'user' 
                ? 'bg-primary text-onPrimary rounded-tr-sm' 
                : 'bg-surfaceContainer dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-sm'
            }`}>
              <div className="prose dark:prose-invert text-base leading-relaxed max-w-none break-words">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4 animate-pulse">
             <div className="w-10 h-10 rounded-full bg-primaryContainer text-onPrimaryContainer flex items-center justify-center">
               <Bot size={20} />
             </div>
             <div className="bg-surfaceContainer dark:bg-gray-800 p-5 rounded-[2rem] rounded-tl-sm flex items-center transition-colors duration-300">
               <div className="flex gap-1.5">
                 <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Increased padding bottom to avoid obstruction by floating nav */}
      <div className="p-4 bg-surfaceContainer/50 dark:bg-gray-900/50 transition-colors duration-300 border-t border-outline/10">
        <div className="relative flex items-end gap-2 bg-white dark:bg-gray-800 rounded-[2rem] border border-outline/20 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-sm transition-all duration-300 p-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题 (Ctrl + Enter 发送)..."
            className="w-full pl-2 py-1 bg-transparent outline-none resize-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base max-h-[300px] min-h-[60px] overflow-y-auto custom-scrollbar"
            rows={2}
          />
          <div className="flex flex-col gap-2 pb-1 pr-1">
             <div className="hidden md:flex text-[10px] text-outline justify-end items-center gap-1 opacity-50 select-none whitespace-nowrap">
                <Keyboard size={10} /> Ctrl+Enter
             </div>
            <button 
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-12 h-12 rounded-full bg-primary text-onPrimary flex items-center justify-center hover:bg-primary-dark disabled:opacity-50 disabled:bg-gray-400 transition-all duration-300 flex-shrink-0"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
            </button>
          </div>
        </div>
        {/* Large spacer to ensure the input box is visually above the floating App.tsx nav bar */}
        <div className="h-32 lg:h-8 w-full" />
      </div>
    </div>
  );
};

export default DeepDiveMode;