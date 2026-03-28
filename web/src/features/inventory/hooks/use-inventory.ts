import { useQuery } from '@tanstack/react-query';
import { getStockSummary } from '../api/get-stock-summary';

export const useStockSummary = () => {
return useQuery({
queryKey: ['stock-summary'],
queryFn: getStockSummary,
refetchInterval: 15000,
});
};
