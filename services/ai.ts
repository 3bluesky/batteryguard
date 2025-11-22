import { GoogleGenAI } from "@google/genai";
import { Battery } from "../types";

// Check if API key exists (in a real app, you'd handle this securely)
const apiKey = process.env.API_KEY;

export const analyzeBatteryHealth = async (battery: Battery): Promise<string> => {
  if (!apiKey) {
    return "错误: 未检测到 API Key。请在环境中配置 API_KEY 以使用 AI 诊断功能。";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Using 2.5 Flash for fast, low-latency analysis
    const modelId = "gemini-2.5-flash"; 

    const prompt = `
    作为一名专业的电气化学工程师，请分析以下电池的健康状况并提供维护建议。
    请用简体中文回答，保持简洁，重点关注安全隐患和延长寿命的方法。
    
    电池数据:
    - 名称: ${battery.name}
    - 类型: ${battery.type}
    - 标称容量: ${battery.capacity} mAh
    - 当前电压: ${battery.voltage} V
    - 当前电量: ${battery.chargeLevel}%
    - 循环次数: ${battery.cycleCount} 次
    - 内阻: ${battery.internalResistance} mΩ
    - 购买日期: ${battery.purchaseDate}
    - 上次充电: ${battery.lastChargeDate}
    
    请给出：
    1. 健康度估算评价 (基于循环次数和内阻)。
    2. 当前存放状态是否安全（例如满电存放LiPo是否危险）。
    3. 下一步维护建议（充电、放电或报废）。
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "AI 无法生成建议，请稍后再试。";
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return "连接 AI 服务失败，请检查网络或 API Key 设置。";
  }
};
