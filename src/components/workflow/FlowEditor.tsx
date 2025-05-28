import { useCallback, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  NodeTypes,
  Panel,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { PlusCircle, Save } from "lucide-react";
import LLMNode from "./nodes/LLMNode";
import KnowledgeNode from "./nodes/KnowledgeNode";
import StartNode from "./nodes/StartNode";
import OutputNode from "./nodes/OutputNode";

// 定义节点类型
const nodeTypes: NodeTypes = {
  llm: LLMNode,
  knowledge: KnowledgeNode,
  start: StartNode,
  output: OutputNode,
};

// 初始节点
const initialNodes: Node[] = [
  {
    id: "start",
    type: "start",
    data: { label: "开始" },
    position: { x: 250, y: 5 },
  },
];

// 初始边
const initialEdges: Edge[] = [];

interface FlowEditorProps {
  workflowId?: string;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  readOnly?: boolean;
  initialData?: {
    nodes: Node[];
    edges: Edge[];
  };
}

export default function FlowEditor({
  workflowId,
  onSave,
  readOnly = false,
  initialData,
}: FlowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialData?.nodes || initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialData?.edges || initialEdges
  );
  const reactFlowInstance = useReactFlow();

  // 处理连接
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  // 添加新节点
  const addNode = useCallback(
    (type: string) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        data: {
          label:
            type === "llm" ? "LLM" : type === "knowledge" ? "知识库" : "输出",
        },
        position: {
          x: Math.random() * 400,
          y: Math.random() * 400,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  // 保存工作流
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
    }
  }, [nodes, edges, onSave]);

  return (
    <div style={{ width: "100%", height: "70vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <Background />

        {!readOnly && (
          <Panel position="top-right">
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => addNode("llm")}
                variant="outline"
                size="sm"
              >
                <PlusCircle className="h-4 w-4 mr-1" /> LLM节点
              </Button>
              <Button
                onClick={() => addNode("knowledge")}
                variant="outline"
                size="sm"
              >
                <PlusCircle className="h-4 w-4 mr-1" /> 知识库节点
              </Button>
              <Button
                onClick={() => addNode("output")}
                variant="outline"
                size="sm"
              >
                <PlusCircle className="h-4 w-4 mr-1" /> 输出节点
              </Button>
              <Button onClick={handleSave} variant="default" size="sm">
                <Save className="h-4 w-4 mr-1" /> 保存
              </Button>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
