import { useState } from 'react';
import { Product } from '../types';
import { useTableSort, type SortConfig } from '@/hooks/use-table-sort';
import { useTableSelection } from '@/hooks/use-table-selection';
import { useProductMutations } from './use-product-mutations';

export function useProductsTableLogic(products: Product[], mutations: ReturnType<typeof useProductMutations>) {
  // Dialog states
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Sorting
  const customSort = (a: Product, b: Product, config: SortConfig<Product>) => {
    if (config.key === 'rfidCount') {
      const aVal = a._count?.tags || 0;
      const bVal = b._count?.tags || 0;
      if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
      return 0;
    }
    if (config.key === 'categoryId') {
      const aVal = a.category?.name || '';
      const bVal = b.category?.name || '';
      return config.direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return 0;
  };

  const { sortedItems, sortConfig, handleSort } = useTableSort<Product>(products, customSort);

  // Pagination
  const totalItems = sortedItems.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const paginatedItems = sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Selection
  const { selectedIds, handleToggleSelect, handleSelectAll, clearSelection } = useTableSelection(paginatedItems);

  // Handlers
  const handleConfirmBulkDelete = () => {
    if (selectedIds.length === 0) return;
    
    // Xoá tuần tự từng ID
    Promise.all(selectedIds.map(id => mutations.deleteMutation.mutateAsync(id)))
      .then(() => {
        clearSelection();
        setShowBulkDeleteConfirm(false);
      });
  };

  // Handlers
  const openCreate = () => {
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditItem(p);
    setShowForm(true);
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
      setCurrentPage,
      openCreate,
      openEdit,
      handleSort,
      handleToggleSelect,
      handleSelectAll,
      clearSelection,
      setShowBulkDeleteConfirm,
      handleConfirmBulkDelete,
    }
  };
}
