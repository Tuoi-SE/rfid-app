const xlsx = require('xlsx');
const path = require('path');
const filePath = path.resolve(__dirname, '../template/BÁO GIÁ SỈ T10.2025xlsx.xlsx');

try {
  const workbook = xlsx.readFile(filePath);
  const analysis = {};

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    analysis[sheetName] = {
      total_rows: data.length,
      sample_hierarchy: []
    };

    let currentSubCategory = 'Không phân loại';

    data.forEach(row => {
      if (!row || !Array.isArray(row)) return;

      const col0 = row[0];
      const col1 = row[1];
      
      const isCol0Number = typeof col0 === 'number';
      const col0Str = typeof col0 === 'string' ? col0.trim() : '';
      const col1Str = typeof col1 === 'string' ? col1.trim() : '';

      if (isCol0Number) {
         if (analysis[sheetName].sample_hierarchy.length < 15) {
           analysis[sheetName].sample_hierarchy.push({
             type: 'PRODUCT',
             parent: currentSubCategory,
             stt: col0,
             name: col1Str,
             sku: String(row[2] || 'NO_SKU').trim(),
           });
         }
      } 
      else {
        if (col0Str && col0Str !== 'STT' && col0Str.length > 2 && !col0Str.includes('CÔNG TY') && !col0Str.includes('Ghi chú') && !col0Str.includes('BẢNG BÁO GIÁ') && !col0Str.includes('Bảng giá')) {
           currentSubCategory = col0Str;
           if (analysis[sheetName].sample_hierarchy.length < 15) {
               analysis[sheetName].sample_hierarchy.push({ type: 'SUB_CATEGORY', name: currentSubCategory });
           }
        } else if (!col0Str && col1Str && col1Str === col1Str.toUpperCase() && col1Str !== 'TÊN SẢN PHẨM ' && col1Str !== 'TÊN SẢN PHẨM' && !col1Str.includes('CÔNG TY')) {
           currentSubCategory = col1Str;
           if (analysis[sheetName].sample_hierarchy.length < 15) {
               analysis[sheetName].sample_hierarchy.push({ type: 'SUB_CATEGORY', name: currentSubCategory });
           }
        }
      }
    });
  });

  console.log(JSON.stringify(analysis, null, 2));
} catch (err) {
  console.error('Error:', err);
}
