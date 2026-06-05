export function getModalTitle(type: string) {
  return {
    "edit-service": "Edit Service",
    "add-service": "Add Service",
    "delete-service": "Delete Service",
    "add-category": "Add Category",
    "edit-category": "Edit Category",
    "delete-category": "Delete Category",
    "add-item": "Add Item",
    "edit-item": "Edit Item",
    "delete-item": "Delete Item",
  }[type]!;
}
