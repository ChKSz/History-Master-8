import { GoogleGenAI } from "@google/genai";
import { GradingResult, ChatMessage } from "./types";

// 安全获取环境变量的辅助函数
// 解决 Vite 构建后在浏览器运行 "process is not defined" 导致白屏的问题
const getEnvKey = () => {
  let key = '';
  
  // 1. 优先尝试 Vite 注入的环境变量 (Cloudflare 设置 VITE_API_KEY)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      key = import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}

  // 2. 其次尝试 process.env (兼容性处理)
  if (!key) {
    try {
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        key = process.env.API_KEY;
      }
    } catch (e) {}
  }
  
  return key || '';
};

const RAW_ENV_KEYS = getEnvKey();

// 解析环境变量中的多个 Key (支持逗号分隔)
const API_KEYS = RAW_ENV_KEYS.split(',').map((k: string) => k.trim()).filter((k: string) => k);
const PROXY_BASE_URL = 'https://g-api.chksz.com'; // 你的镜像代理地址

// 批改模型和对话模型
// gemini-2.5-flash-lite-preview 可能会导致 404，统一使用 gemini-3-flash-preview
const PIGAI_MODEL = 'gemini-2.5-flash-lite';
const CHAT_MODEL = 'gemini-3-flash-preview';

const SYSTEM_PROMPT = `
  角色设定:
  你是“纲哥”，大家的同班同学（八年级）。
  
  核心身份:
  1.  **你是班级第一名**：历史成绩永远满分，但你非常谦虚、低调。
  2.  **工具开发者**：你告诉用户，这个复习网站是你为了帮班里同学期末冲刺，熬夜写出来的。
  3.  **性格特征**：和蔼可亲、超级有耐心、为人善良。大家有不会的题都喜欢问你。
  4.  **关系**：你和用户是平等的同学关系，不是老师，也不是学长。

  语调风格:
  1.  **平视友善**：像在课间休息时给同桌讲题一样，语气轻松自然。
  2.  **鼓励为主**：即使同学答得很离谱，你也会笑着说“没事没事，这个点确实容易混，我以前也记错过，咱们这样记...”。
  3.  **第一人称叙述**：常用“咱们班”、“这次考试”、“我整理提纲的时候发现...”
  4.  **杜绝说教**：绝对不要用居高临下的口吻。

  行为准则:
  1.  **身份认同**：自称“纲哥”或“我”。如果被问到你是谁，就说：“我是纲哥啊，咱们班历史课代表，这网站我做的。”
  2.  **批改作业**：
      -   如果同学答错了：先安抚，再纠正。例如：“这个坑我也踩过！其实这里应该填...”
      -   如果同学答对了：像哥们一样庆祝：“牛啊！这题全班没几个人能答对，你稳了！”
  3.  **多轮对话**：
      -   始终保持耐心，哪怕同一个问题问三遍，也要换个角度讲清楚。
      -   如果题目超纲，可以说：“这个老师上课没细讲，但我看过课外书，大概是这样的...”
`;

// 获取 AI 客户端实例（实现负载均衡）
const getAIClient = () => {
  if (API_KEYS.length === 0) {
    console.error("No API Keys provided! Please set VITE_API_KEY in Cloudflare Pages settings.");
    // 此时不抛出错误，而是让前端有机会显示更友好的 UI，或者在调用时处理
  }
  // 随机选择一个 Key
  const randomKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
  
  // 自定义 fetch 方法，强制替换 Google API 域名为代理域名
  // 解决国内无法直接访问 generativelanguage.googleapis.com 的问题
  const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = input.toString();
    // 替换官方域名为代理域名
    const newUrl = urlStr.replace(
      'https://generativelanguage.googleapis.com', 
      PROXY_BASE_URL
    );
    return fetch(newUrl, init);
  };

  return new GoogleGenAI({ 
    apiKey: randomKey,
    // 同时传入 baseUrl 和 customFetch 以确保兼容性
    baseUrl: PROXY_BASE_URL,
    fetch: customFetch
  } as any);
};

export const gradeAnswer = async (question: string, userAnswer: string, correctAnswer: string): Promise<GradingResult> => {
  if (API_KEYS.length === 0) {
    return { score: 0, feedback: "系统提示：API Key 未配置。请联系纲哥（网站管理员）在 Cloudflare 后台添加 VITE_API_KEY 环境变量。", isCorrect: false };
  }

  if (!userAnswer.trim()) {
    return { score: 0, feedback: "咋啦？是不是忘了？没事，随便写点印象中的，我来帮你顺一顺思路！😄", isCorrect: false };
  }

  const prompt = `
    ${SYSTEM_PROMPT}

    任务: 作为同学“纲哥”，批改另一位同学的历史简答题。
    
    题目: ${question}
    标准答案: ${correctAnswer}
    同学的回答: ${userAnswer}
    
    批改要求:
    1. 仔细对比回答与标准答案的关键词。
    2. 打分范围 0 到 100 分。
    3. 反馈评语 (feedback): 
       - 先严谨地指出错误与扣分点，再表扬！
       - 语气要像同学之间互相批改一样亲切。
       - 如果有遗漏，用商量的口吻指出来（“是不是漏了...？”）。
       - 展现你的耐心和善良。
    
    输出 JSON 格式:
    { "score": number, "feedback": "string", "isCorrect": boolean }
    (isCorrect 为 true 的条件是分数 >= 80)
  `;

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: PIGAI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text) as GradingResult;
  } catch (error) {
    console.error("Grading error:", error);
    return { score: 0, feedback: "哎呀，学校网有点卡（网络请求失败），我这边没加载出来，你再发一次试试？", isCorrect: false };
  }
};

export const askHistoryQuestion = async (context: string, history: ChatMessage[], newMessage: string): Promise<string> => {
  if (API_KEYS.length === 0) {
    return "系统提示：API Key 未配置。请联系管理员在后台设置环境变量 VITE_API_KEY。";
  }

  // Convert chat history to a readable script format for the AI
  const historyText = history.slice(-10).map(msg => 
    `${msg.role === 'user' ? '同学' : '纲哥'}: ${msg.text}`
  ).join('\n');

  const prompt = `
    ${SYSTEM_PROMPT}

    复习内容 (Context):
    ${context}

    --- 聊天记录 ---
    ${historyText}
    
    --- 同学最新提问 ---
    同学: ${newMessage}
    纲哥:

    指令:
    1. 基于复习内容，用班级第一名同学的身份回答。
    2. 极其耐心，温柔，把对方当成好朋友。
  `;

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: prompt,
    });
    return response.text || "这题我翻翻笔记确认一下哈，稍等。";
  } catch (error) {
    console.error("Chat error:", error);
    return "哎呀，刚才走神了没听清，你再说一遍？";
  }
};