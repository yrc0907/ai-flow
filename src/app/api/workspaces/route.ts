import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { type PrismaClient } from "@/generated/prisma";

// 自定义类型
interface WorkspaceWithRole {
  id: string;
  name: string;
  role: string;
  createdAt: Date;
}

// 获取用户的所有工作区
export async function GET() {
  try {
    const session = await getServerSession();

    console.log("完整会话信息:", JSON.stringify(session));
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

    const workspaceUsers = await prisma.workspaceUser.findMany({
      where: {
        userId,
      },
      include: {
        workspace: true,
      },
    });

    const workspaces = workspaceUsers.map((wu) => ({
      id: wu.workspace.id,
      name: wu.workspace.name,
      role: wu.role,
      createdAt: wu.workspace.createdAt,
    }));

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("获取工作区失败:", error);
    return NextResponse.json({ error: "获取工作区失败" }, { status: 500 });
  }
}

// 创建新工作区
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    // 详细记录会话信息
    console.log("完整会话信息:", JSON.stringify(session));

    if (!session) {
      console.error("创建工作区失败: 没有会话信息");
      return NextResponse.json({ error: "未授权 - 没有会话信息" }, { status: 401 });
    }

    if (!session.user) {
      console.error("创建工作区失败: 会话中没有用户信息");
      return NextResponse.json({ error: "未授权 - 没有用户信息" }, { status: 401 });
    }

    if (!session.user.email) {
      console.error("创建工作区失败: 用户邮箱不存在");
      return NextResponse.json({ error: "未授权 - 用户邮箱不存在" }, { status: 401 });
    }

    console.log("用户邮箱:", session.user.email);

    // 通过邮箱查找用户ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.error(`创建工作区失败: 邮箱 ${session.user.email} 对应的用户不存在`);
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const userId = user.id;
    console.log("找到用户ID:", userId);

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "工作区名称不能为空" }, { status: 400 });
    }

    console.log(`开始为用户 ${userId} 创建工作区 "${name}"`);

    // 创建工作区和关联的用户关系（创建者为管理员）
    const workspace = await prisma.$transaction(async (tx) => {
      console.log("创建工作区...");
      const newWorkspace = await tx.workspace.create({
        data: {
          name,
        },
      });
      console.log(`工作区创建成功，ID: ${newWorkspace.id}`);

      console.log("创建工作区用户关联...");
      await tx.workspaceUser.create({
        data: {
          workspaceId: newWorkspace.id,
          userId,
          role: "admin",
        },
      });
      console.log("工作区用户关联创建成功");

      return newWorkspace;
    });

    console.log(`工作区创建完成: ${workspace.id}`);

    return NextResponse.json({
      id: workspace.id,
      name: workspace.name,
      role: "admin",
      createdAt: workspace.createdAt,
    });
  } catch (error) {
    console.error("创建工作区失败，详细错误:", error);

    // 更详细的错误信息
    let errorMessage = "创建工作区失败";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = `创建工作区失败: ${error.message}`;

      // 处理Prisma错误
      if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as any;
        if (prismaError.code === 'P2002') {
          errorMessage = '工作区名称已存在';
          statusCode = 409;
        } else if (prismaError.code === 'P2003') {
          errorMessage = '外键约束失败';
          statusCode = 400;
        }
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
} 