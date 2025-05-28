import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { createDocument } from "@/lib/knowledge";

// 处理文件上传
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

    // 处理文件上传
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未找到文件" }, { status: 400 });
    }

    // 检查文件类型
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/markdown",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "不支持的文件类型" },
        { status: 400 }
      );
    }

    // 读取文件内容
    const fileContent = await file.text();

    // 创建文档
    const document = await createDocument(
      params.knowledgeBaseId,
      file.name,
      fileContent,
      { fileType: file.type, fileSize: file.size }
    );

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("上传文件失败:", error);
    return NextResponse.json(
      { error: "上传文件失败" },
      { status: 500 }
    );
  }
} 