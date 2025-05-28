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
import { ArrowLeft } from "lucide-react";

interface AppPageProps {
  params: {
    id: string;
    appId: string;
  };
}

export default async function AppPage({ params }: AppPageProps) {
  const session = await getServerSession();
  if (!session?.user) {
    return notFound();
  }

  // 检查用户是否有权限访问此工作区
  const workspaceUser = await prisma.workspaceUser.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: params.id,
        userId: session.user.id,
      },
    },
  });

  if (!workspaceUser) {
    return notFound();
  }

  // 获取应用详情
  const app = await prisma.app.findUnique({
    where: {
      id: params.appId,
      workspaceId: params.id,
    },
    include: {
      workflows: true,
      knowledgeBases: {
        include: {
          knowledgeBase: true,
        },
      },
    },
  });

  if (!app) {
    return notFound();
  }

  // 应用类型显示名称
  const appTypeNames = {
    chatbot: "聊天机器人",
    agent: "智能代理",
    workflow: "工作流",
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/workspaces/${params.id}/apps`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回应用列表
          </Link>
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{app.name}</h1>
          <p className="text-muted-foreground">
            {appTypeNames[app.type as keyof typeof appTypeNames] || app.type}
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/workspaces/${params.id}/apps/${app.id}/edit`}>
            编辑应用
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="builder">构建器</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>应用详情</CardTitle>
              <CardDescription>应用的基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">名称</p>
                <p className="text-sm text-muted-foreground">{app.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">描述</p>
                <p className="text-sm text-muted-foreground">
                  {app.description || "无描述"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">类型</p>
                <p className="text-sm text-muted-foreground">
                  {appTypeNames[app.type as keyof typeof appTypeNames] ||
                    app.type}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">创建时间</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(app.createdAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>工作流</CardTitle>
                <CardDescription>应用的工作流配置</CardDescription>
              </CardHeader>
              <CardContent>
                {app.workflows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无工作流</p>
                ) : (
                  <ul className="space-y-2">
                    {app.workflows.map((workflow) => (
                      <li key={workflow.id} className="text-sm">
                        {workflow.name}
                        {workflow.isPublished && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-0.5 rounded">
                            已发布
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>知识库</CardTitle>
                <CardDescription>关联的知识库</CardDescription>
              </CardHeader>
              <CardContent>
                {app.knowledgeBases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    暂无关联知识库
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {app.knowledgeBases.map((kb) => (
                      <li key={kb.id} className="text-sm">
                        {kb.knowledgeBase.name}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>应用构建器</CardTitle>
              <CardDescription>构建和配置您的应用</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                此功能将在后续版本中实现
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>应用设置</CardTitle>
              <CardDescription>管理应用的基本设置</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                此功能将在后续版本中实现
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API访问</CardTitle>
              <CardDescription>管理API密钥和查看API文档</CardDescription>
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
