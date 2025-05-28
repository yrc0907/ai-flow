import { Handle, Position } from "@xyflow/react";

interface LLMNodeProps {
  data: {
    label: string;
    model?: string;
    prompt?: string;
  };
  isConnectable: boolean;
}

export default function LLMNode({ data, isConnectable }: LLMNodeProps) {
  return (
    <div className="p-3 rounded-md bg-blue-100 border border-blue-500 shadow-sm w-[200px]">
      <div className="font-semibold text-center">{data.label}</div>
      <div className="text-xs mt-1">
        {data.model ? `模型: ${data.model}` : "未选择模型"}
      </div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
    </div>
  );
}
