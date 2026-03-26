const xlsx = require('xlsx');
const path = require('path');
const filePath = path.resolve(__dirname, '../template/BÁO GIÁ SỈ T10.2025xlsx.xlsx');
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets['T200'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
data.forEach((row, i) => {
   if (!row || !Array.isArray(row)) return;
   const col0 = row[0];
   if (typeof col0 === 'number') {
      console.log('Row ' + i + ' | STT: ' + col0 + ' | Name: ' + row[1]);
   }
});
