import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { createDocument } from "@/lib/knowledge";

// 获取知识库下的所有文档
export async function GET(
  request: NextRequest,
  { params }: { params: { knowledgeBaseId: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user || !session.user.email) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 通过邮箱查找用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const userId = user.id;

    // 获取知识库
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id: params.knowledgeBaseId },
      include: { workspace: true },
    });

    if (!knowledgeBase) {
      return NextResponse.json({ error: "知识库不存在" }, { status: 404 });
    }

    // 检查用户是否有权限访问此工作区
    const workspaceUser = await prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: knowledgeBase.workspaceId,
          userId,
        },
      },
    });

    if (!workspaceUser) {
      return NextResponse.json({ error: "无权访问此工作区" }, { status: 403 });
    }

    // 获取文档列表
    const documents = await prisma.document.findMany({
      where: { knowledgeBaseId: params.knowledgeBaseId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("获取文档失败:", error);
    return NextResponse.json(
      { error: "获取文档失败" },
      { status: 500 }
    );
  }
}

// 创建新文档
export async function POST(
  request: NextRequest,
  { params }: { params: { knowledgeBaseId: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user || !session.user.email) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 通过邮箱查找用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const userId = user.id;

    // 获取知识库
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id: params.knowledgeBaseId },
      include: { workspace: true },
    });

    if (!knowledgeBase) {
      return NextResponse.json({ error: "知识库不存在" }, { status: 404 });
    }

    // 检查用户是否有权限访问此工作区
    const workspaceUser = await prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: knowledgeBase.workspaceId,
          userId,
        },
      },
    });

    if (!workspaceUser) {
      return NextResponse.json({ error: "无权访问此工作区" }, { status: 403 });
    }

    // 检查用户是否有权限创建文档
    if (!["admin", "member"].includes(workspaceUser.role)) {
      return NextResponse.json(
        { error: "您没有权限上传文档" },
        { status: 403 }
      );
    }

    // 验证请求数据
    const schema = z.object({
      name: z.string().min(1).max(100),
      content: z.string().min(1),
      metadata: z.record(z.unknown()).optional(),
    });

    const body = await request.json();
    const validatedData = schema.parse(body);

    // 创建文档
    const document = await createDocument(
      params.knowledgeBaseId,
      validatedData.name,
      validatedData.content,
      validatedData.metadata
    );

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("创建文档失败:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "验证失败", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "创建文档失败" },
      { status: 500 }
    );
  }
} 