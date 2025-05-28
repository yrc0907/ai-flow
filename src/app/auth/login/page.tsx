import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "登录 | AI Flow",
  description: "登录到AI Flow平台",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">AI Flow</h1>
        <p className="text-muted-foreground">AI应用开发平台</p>
      </div>
      <LoginForm />
    </div>
  );
}
