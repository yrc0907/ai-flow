import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">AI Flow</h1>
      <p className="text-xl mb-8 max-w-2xl">
        一个类似Dify的AI应用开发平台，让您轻松构建、部署和管理AI应用。
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/auth/login">登录</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auth/register">注册</Link>
        </Button>
      </div>
    </div>
  );
}
