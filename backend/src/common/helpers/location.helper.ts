import { PrismaService } from '@prisma/prisma.service';

/**
 * Returns location IDs that are authorized for a given location.
 * Includes the location itself and all its direct child locations.
 */
export async function getAuthorizedLocationIds(
  prisma: PrismaService,
  locationId?: string,
): Promise<string[]> {
  if (!locationId) return [];
  const locs = await prisma.location.findMany({
    where: { OR: [{ id: locationId }, { parentId: locationId }], deletedAt: null },
    select: { id: true },
  });
  return locs.map((l) => l.id);
}
