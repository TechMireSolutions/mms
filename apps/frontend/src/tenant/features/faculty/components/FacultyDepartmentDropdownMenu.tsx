import React, { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export interface DepartmentItem {
  id?: string;
  name: string;
  code?: string;
  isEntity: boolean;
}

export interface FacultyDepartmentDropdownMenuProps {
  items: DepartmentItem[];
  selectedValue: string;
  isPending?: boolean;
  onSelect: (item: DepartmentItem) => void;
  onSaveNew: (name: string) => Promise<void>;
  onUpdate: (id: string, name: string) => Promise<void>;
  onDeleteRequest: (id: string) => void;
}

export function FacultyDepartmentDropdownMenu({
  items,
  selectedValue,
  isPending = false,
  onSelect,
  onSaveNew,
  onUpdate,
  onDeleteRequest,
}: FacultyDepartmentDropdownMenuProps): React.JSX.Element {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleStartEdit = (e: React.MouseEvent, item: DepartmentItem) => {
    e.stopPropagation();
    if (!item.id) return;
    setEditingId(item.id);
    setEditName(item.name);
  };

  const handleSaveEdit = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const trimmed = editName.trim();
    if (!trimmed) return;
    await onUpdate(id, trimmed);
    setEditingId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    await onSaveNew(trimmed);
    setNewName("");
    setIsAdding(false);
  };

  return (
    <div
      role="listbox"
      aria-label={t("faculty.field.department")}
      className="absolute start-0 top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border/80 bg-popover p-1 text-popover-foreground shadow-lg"
    >
      <div className="space-y-0.5">
        {items.map((item) => {
          const isSelected = item.name === selectedValue;
          const isCurrentEditing = editingId === item.id;

          if (isCurrentEditing && item.id) {
            return (
              <div key={item.id} className="flex items-center gap-1 p-1 bg-muted/50 rounded-md" onClick={(e) => e.stopPropagation()}>
                <Input
                  autoFocus
                  size={1}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(e as unknown as React.MouseEvent, item.id!)}
                  className="h-7 text-xs flex-1"
                  disabled={isPending}
                />
                <Button type="button" size="sm" variant="ghost" className="size-7 p-0 text-primary" onClick={(e) => handleSaveEdit(e, item.id!)} title={t("common.save")}>
                  <Check className="size-3.5" aria-hidden />
                </Button>
                <Button type="button" size="sm" variant="ghost" className="size-7 p-0 text-muted-foreground" onClick={handleCancelEdit} title={t("common.cancel")}>
                  <X className="size-3.5" aria-hidden />
                </Button>
              </div>
            );
          }

          return (
            <div
              key={item.id ?? item.name}
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(item)}
              className={cn(
                "group flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground",
                isSelected && "bg-accent/80 font-medium text-accent-foreground",
              )}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="truncate">{item.name}</span>
                {item.code && <span className="text-[10px] text-muted-foreground">({item.code})</span>}
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                {item.isEntity && item.id && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => handleStartEdit(e, item)}
                      className="size-6 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title={t("common.edit")}
                      aria-label={`${t("common.edit")} ${item.name}`}
                    >
                      <Pencil className="size-3" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRequest(item.id!);
                      }}
                      className="size-6 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title={t("common.delete")}
                      aria-label={`${t("common.delete")} ${item.name}`}
                    >
                      <Trash2 className="size-3" aria-hidden />
                    </button>
                  </>
                )}
                {isSelected && <Check className="size-3.5 text-primary ms-1" aria-hidden />}
              </div>
            </div>
          );
        })}

        {items.length === 0 && !isAdding && (
          <p className="px-3 py-2 text-xs text-muted-foreground text-center">{t("faculty.setup.noDepartments")}</p>
        )}
      </div>

      <div className="mt-1 border-t border-border/50 pt-1">
        {isAdding ? (
          <form onSubmit={handleAddNew} className="flex items-center gap-1 p-1 bg-muted/30 rounded-md" onClick={(e) => e.stopPropagation()}>
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("faculty.setup.departmentNamePlaceholder")}
              className="h-7 text-xs flex-1"
              disabled={isPending}
            />
            <Button type="submit" size="sm" variant="ghost" className="size-7 p-0 text-primary" disabled={isPending || !newName.trim()} title={t("common.save")}>
              <Check className="size-3.5" aria-hidden />
            </Button>
            <Button type="button" size="sm" variant="ghost" className="size-7 p-0 text-muted-foreground" onClick={() => setIsAdding(false)} title={t("common.cancel")}>
              <X className="size-3.5" aria-hidden />
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsAdding(true);
            }}
            className="w-full justify-start h-7 px-2 text-xs text-primary hover:text-primary gap-1.5"
          >
            <Plus className="size-3.5" aria-hidden />
            <span>{t("faculty.setup.addDepartment")}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
