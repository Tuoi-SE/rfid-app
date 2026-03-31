import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLocation } from '../api/create-location';
import { updateLocation } from '../api/update-location';
import { deleteLocation } from '../api/delete-location';
import { LocationFormData } from '../types';

export const useLocationMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['locations'] });

  const createMutation = useMutation({
    mutationFn: (data: LocationFormData) => createLocation(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LocationFormData> }) => updateLocation(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLocation(id),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
};
