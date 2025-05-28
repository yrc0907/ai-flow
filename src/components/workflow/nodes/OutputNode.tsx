import { Handle, Position } from "@xyflow/react";

interface OutputNodeProps {
  data: {
    label: string;
  };
  isConnectable: boolean;
}

export default function OutputNode({ data, isConnectable }: OutputNodeProps) {
  return (
    <div className="p-3 rounded-md bg-orange-100 border border-orange-500 shadow-sm w-[150px]">
      <div className="font-semibold text-center">{data.label}</div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-orange-500"
      />
    </div>
  );
}
