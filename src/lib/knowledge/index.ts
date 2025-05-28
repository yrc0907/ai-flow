import prisma from "@/lib/prisma";

// 文档类型
export type Document = {
  id: string;
  name: string;
  content: string;
  metadata?: Record<string, any>;
  knowledgeBaseId: string;
  chunks: DocumentChunk[];
};

// 文档块类型
export type DocumentChunk = {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  documentId: string;
  vectorId?: string;
};

// 知识库类型
export type KnowledgeBase = {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  documents: Document[];
  vectorStoreId?: string;
};

// 知识库查询选项
export type KnowledgeQueryOptions = {
  knowledgeBaseId: string;
  query: string;
  limit?: number;
  filter?: Record<string, any>;
};

// 知识库查询结果
export type KnowledgeQueryResult = {
  chunks: {
    id: string;
    content: string;
    metadata?: Record<string, any>;
    score: number;
    documentId: string;
    documentName: string;
  }[];
};

/**
 * 获取知识库详情
 */
export async function getKnowledgeBase(id: string): Promise<KnowledgeBase | null> {
  const knowledgeBase = await prisma.knowledgeBase.findUnique({
    where: { id },
    include: {
      documents: {
        include: {
          chunks: true,
        },
      },
    },
  });

  if (!knowledgeBase) return null;

  return {
    id: knowledgeBase.id,
    name: knowledgeBase.name,
    description: knowledgeBase.description || undefined,
    workspaceId: knowledgeBase.workspaceId,
    vectorStoreId: knowledgeBase.vectorStoreId || undefined,
    documents: knowledgeBase.documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      content: doc.content,
      metadata: doc.metadata as Record<string, any> | undefined,
      knowledgeBaseId: doc.knowledgeBaseId,
      chunks: doc.chunks.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        metadata: chunk.metadata as Record<string, any> | undefined,
        embedding: chunk.embedding ? (chunk.embedding as any) : undefined,
        documentId: chunk.documentId,
        vectorId: chunk.vectorId || undefined,
      })),
    })),
  };
}

/**
 * 创建文档
 */
export async function createDocument(
  knowledgeBaseId: string,
  name: string,
  content: string,
  metadata?: Record<string, any>
): Promise<Document> {
  // 创建文档
  const document = await prisma.document.create({
    data: {
      name,
      content,
      metadata: metadata || {},
      knowledgeBaseId,
    },
  });

  // 分块处理文档
  const chunks = splitDocumentIntoChunks(content);

  // 创建文档块
  const createdChunks = await Promise.all(
    chunks.map(async (chunk, index) => {
      return prisma.documentChunk.create({
        data: {
          content: chunk,
          metadata: { index },
          documentId: document.id,
        },
      });
    })
  );

  return {
    id: document.id,
    name: document.name,
    content: document.content,
    metadata: document.metadata as Record<string, any> | undefined,
    knowledgeBaseId: document.knowledgeBaseId,
    chunks: createdChunks.map(chunk => ({
      id: chunk.id,
      content: chunk.content,
      metadata: chunk.metadata as Record<string, any> | undefined,
      embedding: undefined,
      documentId: chunk.documentId,
      vectorId: chunk.vectorId || undefined,
    })),
  };
}

/**
 * 查询知识库
 */
export async function queryKnowledgeBase(
  options: KnowledgeQueryOptions
): Promise<KnowledgeQueryResult> {
  const { knowledgeBaseId, query, limit = 5 } = options;

  // 获取知识库
  const knowledgeBase = await prisma.knowledgeBase.findUnique({
    where: { id: knowledgeBaseId },
    include: {
      documents: {
        include: {
          chunks: true,
        },
      },
    },
  });

  if (!knowledgeBase) {
    throw new Error("知识库不存在");
  }

  // 在实际实现中，这里应该使用向量数据库进行语义搜索
  // 为了演示，我们使用简单的关键词匹配
  const matchingChunks = [];

  for (const document of knowledgeBase.documents) {
    for (const chunk of document.chunks) {
      // 简单的关键词匹配
      if (chunk.content.toLowerCase().includes(query.toLowerCase())) {
        matchingChunks.push({
          id: chunk.id,
          content: chunk.content,
          metadata: chunk.metadata as Record<string, any> | undefined,
          score: 0.8, // 模拟相似度分数
          documentId: chunk.documentId,
          documentName: document.name,
        });
      }
    }
  }

  // 按相似度排序并限制结果数量
  matchingChunks.sort((a, b) => b.score - a.score);
  const limitedChunks = matchingChunks.slice(0, limit);

  return {
    chunks: limitedChunks,
  };
}

/**
 * 将文档分割成块
 */
function splitDocumentIntoChunks(content: string, chunkSize = 1000): string[] {
  const chunks = [];
  const paragraphs = content.split(/\n\s*\n/); // 按段落分割

  let currentChunk = "";

  for (const paragraph of paragraphs) {
    // 如果当前块加上新段落超过了块大小，保存当前块并开始新块
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = paragraph;
    } else {
      // 否则，将段落添加到当前块
      if (currentChunk.length > 0) {
        currentChunk += "\n\n";
      }
      currentChunk += paragraph;
    }
  }

  // 添加最后一个块
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
} 