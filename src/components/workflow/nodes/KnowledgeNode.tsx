import { Handle, Position } from "@xyflow/react";

interface KnowledgeNodeProps {
  data: {
    label: string;
    knowledgeBaseId?: string;
    knowledgeBaseName?: string;
  };
  isConnectable: boolean;
}

export default function KnowledgeNode({
  data,
  isConnectable,
}: KnowledgeNodeProps) {
  return (
    <div className="p-3 rounded-md bg-purple-100 border border-purple-500 shadow-sm w-[200px]">
      <div className="font-semibold text-center">{data.label}</div>
      <div className="text-xs mt-1">
        {data.knowledgeBaseName
          ? `知识库: ${data.knowledgeBaseName}`
          : "未选择知识库"}
      </div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-purple-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-purple-500"
      />
    </div>
  );
}
