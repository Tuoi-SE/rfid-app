import { LocationType } from '@prisma/client';

/**
 * Shared location type constants for order/transfer validation.
 * D-08: Move from duplicate arrays in OrdersService/TransfersService.
 */
export const OUTBOUND_ALLOWED_DESTINATION_TYPES: LocationType[] = [
  LocationType.WAREHOUSE,
  LocationType.WORKSHOP,
  LocationType.HOTEL,
  LocationType.RESORT,
  LocationType.SPA,
  LocationType.CUSTOMER,
];

export const INBOUND_ALLOWED_DESTINATION_TYPES: LocationType[] = [
  LocationType.WORKSHOP,
  LocationType.WORKSHOP_WAREHOUSE,
  LocationType.WAREHOUSE,
];
