import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocumentUploaderProps {
  knowledgeBaseId: string;
  onUploadComplete?: () => void;
}

export default function DocumentUploader({
  knowledgeBaseId,
  onUploadComplete,
}: DocumentUploaderProps) {
  const [activeTab, setActiveTab] = useState<string>("text");
  const [documentName, setDocumentName] = useState<string>("");
  const [documentContent, setDocumentContent] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 处理文本提交
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!documentName.trim()) {
      setError("请输入文档名称");
      return;
    }

    if (!documentContent.trim()) {
      setError("请输入文档内容");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/knowledge/${knowledgeBaseId}/documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: documentName,
            content: documentContent,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "上传失败");
      }

      // 重置表单
      setDocumentName("");
      setDocumentContent("");

      // 调用完成回调
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err: any) {
      setError(err.message || "上传失败");
    } finally {
      setIsUploading(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("请选择文件");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/knowledge/${knowledgeBaseId}/documents/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "上传失败");
      }

      // 重置表单
      setFile(null);

      // 调用完成回调
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err: any) {
      setError(err.message || "上传失败");
    } finally {
      setIsUploading(false);
    }
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // 清除选择的文件
  const clearFile = () => {
    setFile(null);
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="text">输入文本</TabsTrigger>
            <TabsTrigger value="file">上传文件</TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <div>
                <Label htmlFor="documentName">文档名称</Label>
                <Input
                  id="documentName"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="输入文档名称"
                  required
                />
              </div>

              <div>
                <Label htmlFor="documentContent">文档内容</Label>
                <Textarea
                  id="documentContent"
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  placeholder="输入文档内容"
                  className="min-h-[200px]"
                  required
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" disabled={isUploading}>
                {isUploading ? "上传中..." : "上传文档"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="file">
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <Label htmlFor="file">选择文件</Label>
                <div className="mt-1 flex items-center">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".txt,.pdf,.doc,.docx,.md"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("file")?.click()}
                    className="mr-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    选择文件
                  </Button>
                  {file && (
                    <div className="flex items-center bg-muted px-3 py-1 rounded-md">
                      <span className="text-sm truncate max-w-[200px]">
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearFile}
                        className="ml-2 h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  支持 .txt, .pdf, .doc, .docx, .md 格式文件
                </p>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" disabled={isUploading || !file}>
                {isUploading ? "上传中..." : "上传文件"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
