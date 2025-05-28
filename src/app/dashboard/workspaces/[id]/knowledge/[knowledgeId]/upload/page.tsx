import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DocumentUploader from "@/components/knowledge/DocumentUploader";

interface UploadPageProps {
  params: {
    id: string;
    knowledgeId: string;
  };
}

export default async function UploadPage({ params }: UploadPageProps) {
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

  // 检查用户角色是否有权限上传文档
  const canEdit = ["admin", "member"].includes(workspaceUser.role);
  if (!canEdit) {
    redirect(`/dashboard/workspaces/${params.id}/knowledge`);
  }

  // 获取知识库详情
  const knowledgeBase = await prisma.knowledgeBase.findUnique({
    where: {
      id: params.knowledgeId,
      workspaceId: params.id,
    },
  });

  if (!knowledgeBase) {
    return notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/dashboard/workspaces/${params.id}/knowledge/${params.knowledgeId}`}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回知识库
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl font-bold">上传文档到 {knowledgeBase.name}</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <DocumentUploader
          knowledgeBaseId={params.knowledgeId}
          onUploadComplete={() => {
            // 在客户端组件中处理
          }}
        />
      </div>
    </div>
  );
}
