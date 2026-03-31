import * as xlsx from 'xlsx';

/**
 * Xuất dữ liệu ra file Excel (.xlsx)
 * @param data Mảng các object chứa dữ liệu cần xuất (Key là tên cột, Value là dữ liệu)
 * @param fileName Tên file (không cần mỡ rộng .xlsx cuối)
 * @param sheetName Tên sheet bên trong file (mặc định là 'Data')
 */
export const exportToExcel = (data: any[], fileName: string, sheetName = 'Data') => {
  if (!data || data.length === 0) {
    console.warn('Không có dữ liệu để xuất Excel');
    return;
  }

  // 1. Tạo Worksheet từ Array of Objects
  const worksheet = xlsx.utils.json_to_sheet(data);

  // 2. Chỉnh độ rộng cột tự động dựa trên độ dài nội dung dài nhất của mỗi cột
  const objectKeys = Object.keys(data[0]);
  const wscols = objectKeys.map(key => {
    // So sánh độ dài của tiêu đề cột và nội dung lớn nhất trong cột
    const maxDataLength = Math.max(
      ...data.map(row => (row[key] !== null && row[key] !== undefined ? row[key].toString().length : 0)),
      key.length
    );
    // Tính khoảng trắng thêm, max 50 ký tự
    return { wch: Math.min(maxDataLength + 5, 50) };
  });
  worksheet['!cols'] = wscols;

  // 3. Tạo Workbook
  const workbook = xlsx.utils.book_new();

  // 4. Định dạng hàng Header (Bôi đậm)
  const range = xlsx.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = xlsx.utils.encode_cell({ c: C, r: 0 }); // Row 0 is the header
    if (!worksheet[address]) continue;
    worksheet[address].s = {
      font: { bold: true }
    };
  }

  // 5. Nối chuỗi & Xuất file
  xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
  xlsx.writeFile(workbook, `${fileName}.xlsx`);
};
