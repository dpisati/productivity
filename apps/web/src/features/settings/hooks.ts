import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateSettingsInput } from '@productivity/shared';
import { settingsApi } from './api';

const key = ['settings'];

export function useSettings() {
  return useQuery({ queryKey: key, queryFn: () => settingsApi.get() });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSettingsInput) => settingsApi.update(input),
    onSuccess: (data) => qc.setQueryData(key, data),
  });
}
