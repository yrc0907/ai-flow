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
import { PlusCircle } from "lucide-react";
import Link from "next/link";

interface AppsPageProps {
  params: {
    id: string;
  };
}

export default async function AppsPage({ params }: AppsPageProps) {
  try {
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

    const workspace = await prisma.workspace.findUnique({
      where: { id: params.id },
      include: {
        apps: true,
        members: {
          where: { userId: dbUser.id },
        },
      },
    });

    if (!workspace || workspace.members.length === 0) {
      console.error(`工作区不存在或用户无权访问: ${params.id}`);
      return notFound();
    }

    const userRole = workspace.members[0].role;
    const canCreateApp = ["admin", "member"].includes(userRole);

    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">应用</h1>
          {canCreateApp && (
            <Button asChild>
              <Link href={`/dashboard/workspaces/${params.id}/apps/create`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                创建应用
              </Link>
            </Button>
          )}
        </div>

        {workspace.apps.length === 0 ? (
          <Card className="text-center p-6">
            <CardHeader>
              <CardTitle>暂无应用</CardTitle>
              <CardDescription>创建您的第一个AI应用以开始使用</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              {canCreateApp ? (
                <Button asChild>
                  <Link href={`/dashboard/workspaces/${params.id}/apps/create`}>
                    创建应用
                  </Link>
                </Button>
              ) : (
                <p className="text-muted-foreground">
                  您没有权限创建应用，请联系工作区管理员
                </p>
              )}
            </CardFooter>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspace.apps.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <CardTitle>{app.name}</CardTitle>
                  <CardDescription>
                    {app.description || "无描述"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    类型:{" "}
                    {app.type === "chatbot"
                      ? "聊天机器人"
                      : app.type === "agent"
                      ? "智能代理"
                      : app.type === "workflow"
                      ? "工作流"
                      : app.type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    创建于: {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link
                      href={`/dashboard/workspaces/${params.id}/apps/${app.id}`}
                    >
                      查看应用
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("应用页面错误:", error);
    return notFound();
  }
}
