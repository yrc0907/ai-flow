import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import dynamic from "next/dynamic";

// 动态导入FlowEditor组件，避免SSR问题
const FlowEditor = dynamic(() => import("@/components/workflow/FlowEditor"), {
  ssr: false,
});

interface WorkflowEditPageProps {
  params: {
    id: string;
    appId: string;
    workflowId: string;
  };
}

export default async function WorkflowEditPage({
  params,
}: WorkflowEditPageProps) {
  const session = await getServerSession();
  if (!session?.user || !session.user.email) {
    redirect("/auth/login");
  }

  // 从数据库获取用户信息
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser?.id) {
    console.error("无法从数据库获取用户ID");
    redirect("/auth/login");
  }

  // 检查用户是否有权限访问此工作区
  const workspaceUser = await prisma.workspaceUser.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: params.id,
        userId: dbUser.id,
      },
    },
  });

  if (!workspaceUser) {
    redirect("/dashboard");
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
      app: true,
    },
  });

  if (!workflow) {
    return notFound();
  }

  // 检查用户角色是否有权限编辑
  const canEdit = ["admin", "member"].includes(workspaceUser.role);
  if (!canEdit) {
    redirect(`/dashboard/workspaces/${params.id}/apps/${params.appId}`);
  }

  // 转换节点和边为ReactFlow格式
  const nodes = workflow.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position as { x: number; y: number },
    data: (node.data as Record<string, unknown>) || { label: node.type },
  }));

  const edges = workflow.edges.map((edge) => ({
    id: edge.id,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
  }));

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/dashboard/workspaces/${params.id}/apps/${params.appId}`}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回应用
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl font-bold">{workflow.name} - 工作流编辑器</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <ReactFlowProvider>
          <FlowEditor
            workflowId={params.workflowId}
            initialData={{ nodes, edges }}
            onSave={async (nodes, edges) => {
              "use server";
              // 保存工作流逻辑将在API路由中实现
            }}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
