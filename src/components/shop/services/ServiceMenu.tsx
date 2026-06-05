import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import DropdownMenu from "../../ui/DropdownMenu";

interface Props {
  onEdit: () => void;
  onDelete: () => void;
  onAddCategory: () => void;
  onAddAddon: () => void;
  onManageAddons: () => void;
}

export default function ServiceMenu({
  onEdit,
  onDelete,
  onAddCategory,
  onAddAddon,
  onManageAddons,
}: Props) {
  return (
    <DropdownMenu
      trigger={
        <button className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
          <MoreVertical size={16} className="text-gray-500" />
        </button>
      }
      items={[
        { label: "Edit Service", onClick: onEdit, icon: <Pencil size={14} /> },
        { label: "Add Category", onClick: onAddCategory, icon: <Plus size={14} /> },
        { label: "Add Addon", onClick: onAddAddon, icon: <Plus size={14} className="text-brand-500" /> },
        { label: "Manage Addons", onClick: onManageAddons, icon: <Pencil size={14} className="text-brand-500" /> },
        { label: "Delete Service", onClick: onDelete, icon: <Trash2 size={14} />, destructive: true },
      ]}
    />
  );
}
