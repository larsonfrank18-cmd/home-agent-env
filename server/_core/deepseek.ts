/**
 * DeepSeek API 调用辅助函数
 * 接口格式与 OpenAI 兼容，直接使用 fetch 调用
 */

import { ENV } from "./env";

export type ModelType = "manus" | "deepseek";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  messages: LLMMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * 调用 DeepSeek V3 模型
 */
export async function invokeDeepSeek(options: LLMOptions): Promise<LLMResponse> {
  const apiKey = ENV.deepseekApiKey;
  if (!apiKey) {
    throw new Error("DeepSeek API Key 未配置，请在环境变量中设置 DEEPSEEK_API_KEY");
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: options.messages,
      max_tokens: options.max_tokens ?? 4000,
      temperature: options.temperature ?? 0.8,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API 调用失败 (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as LLMResponse;
  return data;
}

/**
 * 检查 DeepSeek API Key 是否已配置
 */
export function isDeepSeekConfigured(): boolean {
  return !!ENV.deepseekApiKey && ENV.deepseekApiKey.length > 10;
}
