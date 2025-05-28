import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppWindow, Database } from "lucide-react";

interface WorkspacePageProps {
  params: {
    id: string;
  };
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const session = await getServerSession();
  if (!session?.user || !session.user.email) {
    return notFound();
  }

  try {
    // 从数据库获取用户信息
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!dbUser?.id) {
      console.error("无法从数据库获取用户ID");
      return notFound();
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: params.id },
      include: {
        apps: true,
        knowledgeBases: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!workspace) {
      console.error(`工作区不存在: ${params.id}`);
      return notFound();
    }

    // 检查用户是否有权限访问此工作区
    const workspaceUser = workspace.members.find(
      (member) => member.userId === dbUser.id
    );

    if (!workspaceUser) {
      console.error(`用户 ${dbUser.id} 无权访问工作区 ${params.id}`);
      return notFound();
    }

    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{workspace.name}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>应用</CardTitle>
                <CardDescription>管理您的AI应用</CardDescription>
              </div>
              <AppWindow className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{workspace.apps.length}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/dashboard/workspaces/${workspace.id}/apps`}>
                  查看应用
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>知识库</CardTitle>
                <CardDescription>管理您的知识库</CardDescription>
              </div>
              <Database className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {workspace.knowledgeBases.length}
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/dashboard/workspaces/${workspace.id}/knowledge`}>
                  查看知识库
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">成员</h2>
          <div className="border rounded-md">
            <div className="p-4 border-b bg-muted/50 grid grid-cols-3">
              <div className="font-medium">姓名</div>
              <div className="font-medium">邮箱</div>
              <div className="font-medium">角色</div>
            </div>
            {workspace.members.map((member) => (
              <div key={member.id} className="p-4 border-b grid grid-cols-3">
                <div>{member.user.name}</div>
                <div>{member.user.email}</div>
                <div>{member.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("工作区页面错误:", error);
    return notFound();
  }
}
