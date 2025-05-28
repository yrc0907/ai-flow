import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: "注册 | AI Flow",
  description: "注册AI Flow平台账户",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">AI Flow</h1>
        <p className="text-muted-foreground">AI应用开发平台</p>
      </div>
      <RegisterForm />
    </div>
  );
}
