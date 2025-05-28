"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const appTypes = [
  {
    id: "chatbot",
    name: "聊天机器人",
    description: "创建一个可以与用户对话的AI聊天机器人",
  },
  {
    id: "agent",
    name: "智能代理",
    description: "创建一个能够执行任务的AI代理",
  },
  {
    id: "workflow",
    name: "工作流",
    description: "创建一个多步骤的AI工作流程",
  },
];

const formSchema = z.object({
  name: z.string().min(2, "名称至少需要2个字符").max(50, "名称最多50个字符"),
  description: z.string().max(500, "描述最多500个字符").optional(),
  type: z.enum(["chatbot", "agent", "workflow"], {
    required_error: "请选择应用类型",
  }),
});

export default function CreateAppPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/workspaces/${params.id}/apps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "创建应用失败");
      }

      const app = await response.json();

      toast({
        title: "应用创建成功",
        description: `应用 "${app.name}" 已成功创建`,
      });

      router.push(`/dashboard/workspaces/${params.id}/apps/${app.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "创建失败",
        description: error instanceof Error ? error.message : "创建应用失败",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">创建应用</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>应用名称</FormLabel>
                  <FormControl>
                    <Input placeholder="我的AI应用" {...field} />
                  </FormControl>
                  <FormDescription>给您的应用起一个独特的名称</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述（可选）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="描述您的应用..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>简要描述您的应用功能和用途</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>应用类型</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                    >
                      {appTypes.map((type) => (
                        <FormItem key={type.id}>
                          <FormLabel className="cursor-pointer [&:has([data-state=checked])>div]:border-primary">
                            <FormControl>
                              <RadioGroupItem
                                value={type.id}
                                className="sr-only"
                              />
                            </FormControl>
                            <Card className="border-2 hover:border-primary/50">
                              <CardHeader>
                                <CardTitle>{type.name}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <CardDescription>
                                  {type.description}
                                </CardDescription>
                              </CardContent>
                            </Card>
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                取消
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "创建中..." : "创建应用"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
