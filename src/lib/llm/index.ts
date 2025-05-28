import prisma from "@/lib/prisma";

// LLM提供商类型
export type LLMProvider = {
  id: string;
  name: string;
  type: string;
  isSystem: boolean;
  credentials?: Record<string, any>;
  models: LLMModel[];
};

// LLM模型类型
export type LLMModel = {
  id: string;
  name: string;
  providerId: string;
  contextLength: number;
  pricing?: Record<string, any>;
  capabilities: string[];
};

// 消息类型
export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

// 聊天完成选项
export type ChatCompletionOptions = {
  messages: Message[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  workspaceId: string;
};

// 聊天完成结果
export type ChatCompletionResult = {
  id: string;
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

/**
 * 获取工作区可用的LLM提供商
 */
export async function getWorkspaceProviders(workspaceId: string): Promise<LLMProvider[]> {
  const providers = await prisma.modelProvider.findMany({
    where: {
      OR: [
        { workspaceId },
        { isSystem: true },
      ]
    },
    include: {
      models: true,
    },
  });

  return providers.map(provider => ({
    id: provider.id,
    name: provider.name,
    type: provider.type,
    isSystem: provider.isSystem,
    credentials: provider.credentials as Record<string, any> | undefined,
    models: provider.models.map(model => ({
      id: model.id,
      name: model.name,
      providerId: model.providerId,
      contextLength: model.contextLength,
      pricing: model.pricing as Record<string, any> | undefined,
      capabilities: model.capabilities,
    })),
  }));
}

/**
 * 获取模型详情
 */
export async function getModel(modelId: string): Promise<LLMModel | null> {
  const model = await prisma.model.findUnique({
    where: { id: modelId },
    include: { provider: true },
  });

  if (!model) return null;

  return {
    id: model.id,
    name: model.name,
    providerId: model.providerId,
    contextLength: model.contextLength,
    pricing: model.pricing as Record<string, any> | undefined,
    capabilities: model.capabilities,
  };
}

/**
 * 创建聊天完成
 */
export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const { model: modelId, messages, temperature = 0.7, maxTokens, workspaceId } = options;

  // 获取模型详情
  const model = await prisma.model.findUnique({
    where: { id: modelId },
    include: { provider: true },
  });

  if (!model) {
    throw new Error("模型不存在");
  }

  // 根据提供商类型选择不同的实现
  let result: ChatCompletionResult;

  switch (model.provider.type) {
    case "openai":
      result = await createOpenAIChatCompletion(model, messages, temperature, maxTokens);
      break;
    case "anthropic":
      result = await createAnthropicChatCompletion(model, messages, temperature, maxTokens);
      break;
    default:
      throw new Error(`不支持的提供商类型: ${model.provider.type}`);
  }

  // 记录使用日志
  await prisma.logEntry.create({
    data: {
      level: "info",
      message: `LLM调用: ${model.name}`,
      metadata: {
        modelId: model.id,
        provider: model.provider.type,
        usage: result.usage,
      },
      appId: null, // 可以在实际应用中传入appId
    },
  });

  return result;
}

/**
 * OpenAI聊天完成实现
 */
async function createOpenAIChatCompletion(
  model: any,
  messages: Message[],
  temperature: number,
  maxTokens?: number
): Promise<ChatCompletionResult> {
  // 这里应该实现实际的OpenAI API调用
  // 为了演示，我们返回一个模拟结果
  return {
    id: `chatcmpl-${Date.now()}`,
    content: "这是来自OpenAI模型的回复。在实际实现中，这里会调用OpenAI API。",
    model: model.name,
    usage: {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    },
  };
}

/**
 * Anthropic聊天完成实现
 */
async function createAnthropicChatCompletion(
  model: any,
  messages: Message[],
  temperature: number,
  maxTokens?: number
): Promise<ChatCompletionResult> {
  // 这里应该实现实际的Anthropic API调用
  // 为了演示，我们返回一个模拟结果
  return {
    id: `ant-${Date.now()}`,
    content: "这是来自Anthropic模型的回复。在实际实现中，这里会调用Anthropic API。",
    model: model.name,
    usage: {
      promptTokens: 15,
      completionTokens: 25,
      totalTokens: 40,
    },
  };
} 