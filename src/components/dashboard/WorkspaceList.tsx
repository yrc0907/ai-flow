"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Workspace {
  id: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchWorkspaces() {
      try {
        console.log("开始获取工作区列表");
        const response = await fetch("/api/workspaces");

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("获取工作区失败:", response.status, errorData);
          throw new Error(`获取工作区失败: ${response.status}`);
        }

        const data = await response.json();
        console.log("成功获取工作区列表:", data.length);
        setWorkspaces(data);
      } catch (error) {
        console.error("获取工作区列表出错:", error);
        toast({
          variant: "destructive",
          title: "获取失败",
          description: "无法获取工作区列表",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkspaces();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </CardContent>
            <CardFooter>
              <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <Card className="text-center p-6">
        <CardHeader>
          <CardTitle>暂无工作区</CardTitle>
          <CardDescription>创建您的第一个工作区以开始使用</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.refresh()}>刷新</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workspaces.map((workspace) => (
        <Card key={workspace.id}>
          <CardHeader>
            <CardTitle>{workspace.name}</CardTitle>
            <CardDescription>角色: {workspace.role}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              创建于: {new Date(workspace.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/dashboard/workspaces/${workspace.id}`}>
                进入工作区
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
