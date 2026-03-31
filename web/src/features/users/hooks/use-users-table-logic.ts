import { useState } from 'react';
import { User } from '../types';
import { useTableSort, type SortConfig } from '@/hooks/use-table-sort';
import { useTableSelection } from '@/hooks/use-table-selection';
import { useUserMutations } from './use-user-mutations';

export function useUsersTableLogic(users: User[], mutations: ReturnType<typeof useUserMutations>) {
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Sorting
  const customSort = (a: User, b: User, config: SortConfig<User>) => {
    // custom sort logic if needed
    if (config.key === 'location') {
      const aVal = a.location?.name || '';
      const bVal = b.location?.name || '';
      if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
      return 0;
    }
    return 0;
  };

  const { sortedItems, sortConfig, handleSort } = useTableSort<User>(users, customSort);

  // Selection
  const { selectedIds, handleToggleSelect, handleSelectAll, clearSelection } = useTableSelection(sortedItems);

  // Handlers
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
      showBulkDeleteConfirm,
      sortedItems,
      sortConfig,
      selectedIds,
      isDeleting: mutations.deleteMutation.isPending,
    },
    actions: {
      setShowBulkDeleteConfirm,
      handleSort,
      handleToggleSelect,
      handleSelectAll,
      clearSelection,
      handleConfirmBulkDelete,
    }
  };
}
