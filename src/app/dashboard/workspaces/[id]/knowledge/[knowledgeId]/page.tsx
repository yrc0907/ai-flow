import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

interface KnowledgeBasePageProps {
  params: {
    id: string;
    knowledgeId: string;
  };
}

export default async function KnowledgeBasePage({
  params,
}: KnowledgeBasePageProps) {
  const session = await getServerSession();
  if (!session?.user || !session.user.email) {
    return notFound();
  }

  // 从数据库获取用户信息
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser?.id) {
    console.error("无法从数据库获取用户ID");
    return notFound();
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
    return notFound();
  }

  // 获取知识库详情
  const knowledgeBase = await prisma.knowledgeBase.findUnique({
    where: {
      id: params.knowledgeId,
      workspaceId: params.id,
    },
    include: {
      documents: true,
      apps: {
        include: {
          app: true,
        },
      },
    },
  });

  if (!knowledgeBase) {
    return notFound();
  }

  const userRole = workspaceUser.role;
  const canEdit = ["admin", "member"].includes(userRole);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/workspaces/${params.id}/knowledge`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回知识库列表
          </Link>
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{knowledgeBase.name}</h1>
          <p className="text-muted-foreground">
            {knowledgeBase.description || "无描述"}
          </p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link
              href={`/dashboard/workspaces/${params.id}/knowledge/${knowledgeBase.id}/upload`}
            >
              <Plus className="h-4 w-4 mr-1" />
              上传文档
            </Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">文档</TabsTrigger>
          <TabsTrigger value="apps">关联应用</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>文档列表</CardTitle>
              <CardDescription>
                此知识库中的所有文档 ({knowledgeBase.documents.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {knowledgeBase.documents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    此知识库中还没有文档
                  </p>
                  {canEdit && (
                    <Button asChild>
                      <Link
                        href={`/dashboard/workspaces/${params.id}/knowledge/${knowledgeBase.id}/upload`}
                      >
                        上传第一个文档
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border rounded-md">
                  <div className="p-4 border-b bg-muted/50 grid grid-cols-3">
                    <div className="font-medium">文档名称</div>
                    <div className="font-medium">大小</div>
                    <div className="font-medium">上传时间</div>
                  </div>
                  {knowledgeBase.documents.map((document) => (
                    <div
                      key={document.id}
                      className="p-4 border-b grid grid-cols-3"
                    >
                      <div>{document.name}</div>
                      <div>{Math.round(document.content.length / 1024)} KB</div>
                      <div>
                        {new Date(document.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>关联应用</CardTitle>
              <CardDescription>使用此知识库的应用</CardDescription>
            </CardHeader>
            <CardContent>
              {knowledgeBase.apps.length === 0 ? (
                <p className="text-muted-foreground">暂无应用使用此知识库</p>
              ) : (
                <div className="border rounded-md">
                  <div className="p-4 border-b bg-muted/50 grid grid-cols-2">
                    <div className="font-medium">应用名称</div>
                    <div className="font-medium">类型</div>
                  </div>
                  {knowledgeBase.apps.map((appLink) => (
                    <div
                      key={appLink.id}
                      className="p-4 border-b grid grid-cols-2"
                    >
                      <div>
                        <Link
                          href={`/dashboard/workspaces/${params.id}/apps/${appLink.app.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {appLink.app.name}
                        </Link>
                      </div>
                      <div>
                        {appLink.app.type === "chatbot"
                          ? "聊天机器人"
                          : appLink.app.type === "agent"
                          ? "智能代理"
                          : appLink.app.type === "workflow"
                          ? "工作流"
                          : appLink.app.type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>知识库设置</CardTitle>
              <CardDescription>管理知识库的基本设置</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                此功能将在后续版本中实现
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
