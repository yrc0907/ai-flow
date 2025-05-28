import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { z } from "zod";

// 获取工作流详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; appId: string; workflowId: string } }
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

    // 获取工作流详情
    const workflow = await prisma.workflow.findUnique({
      where: {
        id: params.workflowId,
        appId: params.appId,
      },
      include: {
        nodes: true,
        edges: true,
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "工作流不存在" }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("获取工作流失败:", error);
    return NextResponse.json(
      { error: "获取工作流失败" },
      { status: 500 }
    );
  }
}

// 更新工作流
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; appId: string; workflowId: string } }
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

    if (!["admin", "member"].includes(workspaceUser.role)) {
      return NextResponse.json(
        { error: "您没有权限编辑此工作流" },
        { status: 403 }
      );
    }

    // 验证请求数据
    const schema = z.object({
      name: z.string().min(1).max(50).optional(),
      description: z.string().max(500).optional(),
      nodes: z.array(
        z.object({
          id: z.string(),
          type: z.string(),
          position: z.object({
            x: z.number(),
            y: z.number(),
          }),
          data: z.record(z.unknown()),
        })
      ),
      edges: z.array(
        z.object({
          id: z.string(),
          source: z.string(),
          target: z.string(),
        })
      ),
      isPublished: z.boolean().optional(),
    });

    const body = await request.json();
    const validatedData = schema.parse(body);

    // 开始事务，确保节点和边的更新是原子操作
    const result = await prisma.$transaction(async (tx) => {
      // 更新工作流基本信息
      const updatedWorkflow = await tx.workflow.update({
        where: {
          id: params.workflowId,
          appId: params.appId,
        },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          isPublished: validatedData.isPublished,
        },
      });

      // 删除所有现有的节点和边
      await tx.workflowNode.deleteMany({
        where: {
          workflowId: params.workflowId,
        },
      });

      await tx.workflowEdge.deleteMany({
        where: {
          workflowId: params.workflowId,
        },
      });

      // 创建新的节点
      for (const node of validatedData.nodes) {
        await tx.workflowNode.create({
          data: {
            id: node.id,
            type: node.type,
            position: node.position,
            data: node.data as any,
            workflowId: params.workflowId,
          },
        });
      }

      // 创建新的边
      for (const edge of validatedData.edges) {
        await tx.workflowEdge.create({
          data: {
            id: edge.id,
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            workflowId: params.workflowId,
          },
        });
      }

      return updatedWorkflow;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("更新工作流失败:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "验证失败", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "更新工作流失败" },
      { status: 500 }
    );
  }
} 