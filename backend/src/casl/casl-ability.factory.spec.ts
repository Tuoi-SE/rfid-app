import { CaslAbilityFactory } from './casl-ability.factory';
import { Role } from '.prisma/client';

describe('CaslAbilityFactory', () => {
  let factory: CaslAbilityFactory;

  beforeEach(() => {
    factory = new CaslAbilityFactory();
  });

  describe('ADMIN role', () => {
    it('should grant manage all permissions', () => {
      const ability = factory.createForUser({ id: 'admin-1', role: Role.ADMIN });

      expect(ability.can('manage', 'User')).toBe(true);
      expect(ability.can('create', 'Product')).toBe(true);
      expect(ability.can('delete', 'Order')).toBe(true);
      expect(ability.can('update', 'Tag')).toBe(true);
      expect(ability.can('read', 'Dashboard')).toBe(true);
    });
  });

  describe('WAREHOUSE_MANAGER role', () => {
    let ability: ReturnType<CaslAbilityFactory['createForUser']>;

    beforeEach(() => {
      ability = factory.createForUser({ id: 'mgr-1', role: Role.WAREHOUSE_MANAGER });
    });

    it('should allow read on most resources', () => {
      expect(ability.can('read', 'Category')).toBe(true);
      expect(ability.can('read', 'Product')).toBe(true);
      expect(ability.can('read', 'Tag')).toBe(true);
      expect(ability.can('read', 'Order')).toBe(true);
      expect(ability.can('read', 'Location')).toBe(true);
      expect(ability.can('read', 'Inventory')).toBe(true);
    });

    it('should allow create and read Session', () => {
      expect(ability.can('create', 'Session')).toBe(true);
      expect(ability.can('read', 'Session')).toBe(true);
    });

    it('should allow manage Scan', () => {
      expect(ability.can('manage', 'Scan')).toBe(true);
    });

    it('should allow update/delete Order but not Product/User mutations', () => {
      expect(ability.can('create', 'Product')).toBe(false);
      expect(ability.can('update', 'Order')).toBe(true);
      expect(ability.can('delete', 'Order')).toBe(true);
      expect(ability.can('delete', 'User')).toBe(false);
    });

    it('should accept legacy MANAGER role string', () => {
      const legacyAbility = factory.createForUser({ id: 'mgr-legacy', role: 'MANAGER' });
      expect(legacyAbility.can('read', 'Order')).toBe(true);
      expect(legacyAbility.can('update', 'Order')).toBe(true);
      expect(legacyAbility.can('delete', 'Order')).toBe(true);
    });
  });

  describe('STAFF role', () => {
    let ability: ReturnType<CaslAbilityFactory['createForUser']>;

    beforeEach(() => {
      ability = factory.createForUser({ id: 'staff-1', role: Role.STAFF });
    });

    it('should allow read on core resources', () => {
      expect(ability.can('read', 'Category')).toBe(true);
      expect(ability.can('read', 'Product')).toBe(true);
      expect(ability.can('read', 'Tag')).toBe(true);
      expect(ability.can('read', 'Inventory')).toBe(true);
    });

    it('should allow create Session and Scan', () => {
      expect(ability.can('create', 'Session')).toBe(true);
      expect(ability.can('create', 'Scan')).toBe(true);
    });

    it('should NOT allow manage Scan (only create + read)', () => {
      expect(ability.can('delete', 'Scan')).toBe(false);
      expect(ability.can('update', 'Scan')).toBe(false);
    });

    it('should NOT allow create/update/delete on Product, Order, User, Category', () => {
      expect(ability.can('create', 'Product')).toBe(false);
      expect(ability.can('update', 'Category')).toBe(false);
      expect(ability.can('delete', 'Order')).toBe(false);
      expect(ability.can('manage', 'User')).toBe(false);
    });
  });
});
