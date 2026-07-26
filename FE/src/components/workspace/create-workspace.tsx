interface CreateWorkspaceProps {
  isCreateWorkSpace: boolean;
  setIsCreateWorkSpace: (isCreateWorkSpace: boolean) => void;
}

export default function CreateWorkspace({
  isCreateWorkSpace,
  setIsCreateWorkSpace,
}: CreateWorkspaceProps) {
  return (
    <div className="flex items-center px-3 py-2 border-t-2 border-slate-100"></div>
  );
}
