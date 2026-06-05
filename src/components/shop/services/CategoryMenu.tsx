import { Eye, EyeOff, MoreVertical, Pencil, PlusCircle, Trash2 } from "lucide-react";
import DropdownMenu from "../../ui/DropdownMenu";

interface Props {
  isActive?: boolean;
  onAddItem: () => void;
  onEditCategory: () => void;
  onDeleteCategory: () => void;
  onToggleCategory: () => void;
}

export default function CategoryMenu({
  isActive = true,
  onAddItem,
  onEditCategory,
  onDeleteCategory,
  onToggleCategory,
}: Props) {
  return (
    <DropdownMenu
      trigger={
        <button className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
          <MoreVertical size={14} className="text-gray-400" />
        </button>
      }
      items={[
        { label: "Add Item", onClick: onAddItem, icon: <PlusCircle size={14} /> },
        { label: "Edit Category", onClick: onEditCategory, icon: <Pencil size={14} /> },
        {
          label: isActive ? "Mark as Inactive" : "Mark as Active",
          onClick: onToggleCategory,
          icon: isActive ? <EyeOff size={14} /> : <Eye size={14} />,
        },
        {
          label: "Delete Category",
          onClick: onDeleteCategory,
          icon: <Trash2 size={14} />,
          destructive: true,
        },
      ]}
    />
  );
}
