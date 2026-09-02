import { useRef, useState } from "react";
import { type Session, type TabarrukItem } from '@/lib/data/sessionsData';

interface UseTabarrukTabControllerOptions {
  session: Session;
  onUpdate: (session: Session) => void | Promise<void>;
}

export function useTabarrukTabController({ session, onUpdate }: UseTabarrukTabControllerOptions) {
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<TabarrukItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TabarrukItem | null>(null);
  const [saving, setSaving] = useState(false);
  const deletePendingRef = useRef(false);
  const tabarrukItems = session.tabarruk || [];

  const handleSave = async (entry: TabarrukItem) => {
    const existingEntry = tabarrukItems.find((tabarrukItem) => tabarrukItem.id === entry.id);
    setSaving(true);
    try {
      await onUpdate({
        ...session,
        tabarruk: existingEntry
          ? tabarrukItems.map((tabarrukItem) => tabarrukItem.id === entry.id ? entry : tabarrukItem)
          : [...tabarrukItems, entry],
      });
      setShowModal(false);
      setEditEntry(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    deletePendingRef.current = true;
    try {
      await onUpdate({ ...session, tabarruk: tabarrukItems.filter((tabarrukItem) => tabarrukItem.id !== deleteTarget.id) });
      setDeleteTarget(null);
    } finally {
      deletePendingRef.current = false;
    }
  };

  const openCreateModal = () => {
    setEditEntry(null);
    setShowModal(true);
  };

  const openEditModal = (item: TabarrukItem) => {
    setEditEntry(item);
    setShowModal(true);
  };

  const closeModal = () => {
    if (!saving) {
      setShowModal(false);
      setEditEntry(null);
    }
  };

  return {
    tabarrukItems,
    showModal,
    editEntry,
    deleteTarget,
    saving,
    deletePendingRef,
    handleSave,
    handleDelete,
    openCreateModal,
    openEditModal,
    closeModal,
    setDeleteTarget,
  };
}
