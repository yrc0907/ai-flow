import { Handle, Position } from "@xyflow/react";

interface StartNodeProps {
  data: {
    label: string;
  };
  isConnectable: boolean;
}

export default function StartNode({ data, isConnectable }: StartNodeProps) {
  return (
    <div className="p-3 rounded-md bg-green-100 border border-green-500 shadow-sm w-[150px]">
      <div className="font-semibold text-center">{data.label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-green-500"
      />
    </div>
  );
}
