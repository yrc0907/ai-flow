import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SettingsPageProps {
  params: {
    id: string;
  };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const session = await getServerSession();
  if (!session?.user) {
    return notFound();
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: params.id },
    include: {
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    return notFound();
  }

  const userRole = workspace.members[0].role;
  const isAdmin = userRole === "admin";

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">设置</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">基本设置</TabsTrigger>
          <TabsTrigger value="members">成员管理</TabsTrigger>
          {isAdmin && <TabsTrigger value="danger">危险区域</TabsTrigger>}
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>工作区信息</CardTitle>
              <CardDescription>查看和编辑工作区的基本信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">工作区名称</p>
                  <p className="text-sm text-muted-foreground">
                    {workspace.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">创建时间</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(workspace.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">您的角色</p>
                  <p className="text-sm text-muted-foreground">
                    {userRole === "admin"
                      ? "管理员"
                      : userRole === "member"
                      ? "成员"
                      : userRole === "viewer"
                      ? "查看者"
                      : userRole}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>成员管理</CardTitle>
              <CardDescription>管理工作区成员及其权限</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                此功能将在后续版本中实现
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="danger" className="space-y-4">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">危险区域</CardTitle>
                <CardDescription>
                  执行这些操作可能会导致数据丢失
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  此功能将在后续版本中实现
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
