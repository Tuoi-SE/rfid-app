import { useState } from 'react';
import { LocationData } from '../types';
import { useTableSort, type SortConfig } from '@/hooks/use-table-sort';
import { useTableSelection } from '@/hooks/use-table-selection';
import { useLocationMutations } from './use-location-mutations';

export function useLocationsTableLogic(locations: LocationData[], mutations: ReturnType<typeof useLocationMutations>) {
  // Dialog states
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<LocationData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Sorting
  const customSort = (a: LocationData, b: LocationData, config: SortConfig<LocationData>) => {
    if (config.key === 'tags_count') {
      const aVal = a.tags_count || 0;
      const bVal = b.tags_count || 0;
      if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
      return 0;
    }
    return 0;
  };

  const { sortedItems, sortConfig, handleSort } = useTableSort<LocationData>(locations, customSort);

  // Pagination
  const totalItems = sortedItems.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Prevent currentPage from exceeding totalPages when deleting items
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const paginatedItems = sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Selection
  const { selectedIds, handleToggleSelect, handleSelectAll, clearSelection } = useTableSelection(paginatedItems);

  // Handlers
  const openCreate = () => {
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (loc: LocationData) => {
    setEditItem(loc);
    setShowForm(true);
  };

  const handleConfirmBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => mutations.deleteMutation.mutateAsync(id)));
      clearSelection();
      setShowBulkDeleteConfirm(false);
    } catch (e) {
      console.error('Lỗi khi xoá nhiều:', e);
    }
  };

  return {
    state: {
      showForm,
      editItem,
      deleteId,
      showBulkDeleteConfirm,
      sortedItems: paginatedItems,
      sortConfig,
      selectedIds,
      currentPage,
      totalPages,
      totalItems,
      pageSize,
      isSaving: mutations.createMutation.isPending || mutations.updateMutation.isPending,
      isDeleting: mutations.deleteMutation.isPending,
      formError: (mutations.createMutation.error || mutations.updateMutation.error)?.message,
    },
    actions: {
      setShowForm,
      setEditItem,
      setDeleteId,
      setShowBulkDeleteConfirm,
      openCreate,
      openEdit,
      handleSort,
      handleToggleSelect,
      handleSelectAll,
      setCurrentPage,
      clearSelection,
      handleConfirmBulkDelete,
    }
  };
}
