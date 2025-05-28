import CreateWorkspaceModal from "@/components/dashboard/CreateWorkspaceModal";
import WorkspaceList from "@/components/dashboard/WorkspaceList";

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">工作区</h1>
        <CreateWorkspaceModal />
      </div>

      <WorkspaceList />
    </div>
  );
}
