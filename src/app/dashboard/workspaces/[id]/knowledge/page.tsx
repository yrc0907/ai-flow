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

interface KnowledgePageProps {
  params: {
    id: string;
  };
}

export default async function KnowledgePage({ params }: KnowledgePageProps) {
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
        knowledgeBases: {
          include: {
            documents: true,
          },
        },
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
    const canCreateKnowledgeBase = ["admin", "member"].includes(userRole);

    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">知识库</h1>
          {canCreateKnowledgeBase && (
            <Button asChild>
              <Link
                href={`/dashboard/workspaces/${params.id}/knowledge/create`}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                创建知识库
              </Link>
            </Button>
          )}
        </div>

        {workspace.knowledgeBases.length === 0 ? (
          <Card className="text-center p-6">
            <CardHeader>
              <CardTitle>暂无知识库</CardTitle>
              <CardDescription>
                创建您的第一个知识库以增强AI应用
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              {canCreateKnowledgeBase ? (
                <Button asChild>
                  <Link
                    href={`/dashboard/workspaces/${params.id}/knowledge/create`}
                  >
                    创建知识库
                  </Link>
                </Button>
              ) : (
                <p className="text-muted-foreground">
                  您没有权限创建知识库，请联系工作区管理员
                </p>
              )}
            </CardFooter>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspace.knowledgeBases.map((kb) => (
              <Card key={kb.id}>
                <CardHeader>
                  <CardTitle>{kb.name}</CardTitle>
                  <CardDescription>
                    {kb.description || "无描述"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    文档数量: {kb.documents.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    创建于: {new Date(kb.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link
                      href={`/dashboard/workspaces/${params.id}/knowledge/${kb.id}`}
                    >
                      查看知识库
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
    console.error("知识库页面错误:", error);
    return notFound();
  }
}
