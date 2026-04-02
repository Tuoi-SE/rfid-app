/**
 * Role helper utilities cho RFID Inventory System.
 *
 * SUPER_ADMIN: quyền tối cao — xem mọi giao diện, CRUD mọi thứ
 * ADMIN: quản trị business — CRUD sản phẩm/danh mục/thẻ/kho, KHÔNG xem Dashboard/Users/Permissions/ActivityLog
 * WAREHOUSE_MANAGER: quản lý kho
 * STAFF: nhân viên (chủ yếu read-only)
 */

/** SUPER_ADMIN — quyền cao nhất, xem mọi giao diện kể cả Dashboard, Users, Permissions, Activity Logs */
export const isSuperAdmin = (role?: string) => role === 'SUPER_ADMIN';

/**
 * ADMIN hoặc SUPER_ADMIN — quyền CRUD business (products, tags, locations, transfers...)
 * Dùng cho các nút Create/Edit/Delete trên UI business modules
 */
export const hasAdminAccess = (role?: string) =>
  role === 'SUPER_ADMIN' || role === 'ADMIN';

/** Hiển thị tên role bằng tiếng Việt */
export const getRoleDisplayName = (role?: string) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'QUẢN TRỊ VIÊN CẤP CAO';
    case 'ADMIN':
      return 'QUẢN TRỊ HỆ THỐNG';
    case 'WAREHOUSE_MANAGER':
      return 'QUẢN LÝ KHO';
    case 'STAFF':
      return 'NHÂN VIÊN';
    default:
      return 'NGƯỜI DÙNG';
  }
};
