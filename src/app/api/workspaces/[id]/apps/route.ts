import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { z } from "zod";

// 获取工作区下的所有应用
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    if (!session.user.email) {
      return NextResponse.json({ error: "用户邮箱不存在" }, { status: 401 });
    }

    // 通过邮箱查找用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const userId = user.id;

    // 检查用户是否有权限访问此工作区
    const workspaceUser = await prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.id,
          userId,
        },
      },
    });

    if (!workspaceUser) {
      return NextResponse.json({ error: "无权访问此工作区" }, { status: 403 });
    }

    const apps = await prisma.app.findMany({
      where: {
        workspaceId: params.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(apps);
  } catch (error) {
    console.error("获取应用失败:", error);
    return NextResponse.json(
      { error: "获取应用失败" },
      { status: 500 }
    );
  }
}

// 创建新应用
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    if (!session.user.email) {
      return NextResponse.json({ error: "用户邮箱不存在" }, { status: 401 });
    }

    // 通过邮箱查找用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const userId = user.id;

    // 检查用户是否有权限在此工作区创建应用
    const workspaceUser = await prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.id,
          userId,
        },
      },
    });

    if (!workspaceUser) {
      return NextResponse.json({ error: "无权访问此工作区" }, { status: 403 });
    }

    if (!["admin", "member"].includes(workspaceUser.role)) {
      return NextResponse.json(
        { error: "您没有权限创建应用" },
        { status: 403 }
      );
    }

    const schema = z.object({
      name: z.string().min(2).max(50),
      description: z.string().max(500).optional(),
      type: z.enum(["chatbot", "agent", "workflow"]),
    });

    const body = await request.json();
    const validatedData = schema.parse(body);

    const app = await prisma.app.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || "",
        type: validatedData.type,
        workspaceId: params.id,
      },
    });

    return NextResponse.json(app, { status: 201 });
  } catch (error) {
    console.error("创建应用失败:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "验证失败", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "创建应用失败" },
      { status: 500 }
    );
  }
} 