'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/lib/http/client';
import * as XLSX from 'xlsx';
import { UploadCloud, Loader2, FileSpreadsheet, AlertCircle } from 'lucide-react';

const ImportPageClient = () => {
const queryClient = useQueryClient();
const [file, setFile] = useState<File | null>(null);
const [preview, setPreview] = useState<any[]>([]);

const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
const selectedFile = e.target.files?.[0];
if (!selectedFile) return;
setFile(selectedFile);

const reader = new FileReader();
reader.onload = (event) => {
  const data = new Uint8Array(event.target?.result as ArrayBuffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(worksheet);
  setPreview(json);
};
reader.readAsArrayBuffer(selectedFile);
};

const importMutation = useMutation({
mutationFn: async () => {
  const updates = preview.map(row => ({
    epc: row['EPC'] || row['epc'],
    name: row['Tên hiển thị'] || row['name'] || row['Tên'] || 'Unknown Tag',
    category: row['Danh mục'] || row['category'],
    location: row['Vị trí'] || row['location'],
  })).filter(u => u.epc); // Filter out rows without EPC

  if (updates.length === 0) throw new Error("File không có dữ liệu hợp lệ. Cần có cột EPC.");
  
  return httpClient('/tags/bulk', { method: 'POST', body: JSON.stringify({ updates }) });
},
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['tags'] });
  alert('Import dữ liệu thành công!');
  setFile(null);
  setPreview([]);
},
onError: (error: any) => {
  alert(`Import thất bại: ${error.message}`);
}
});

return (
<div className="max-w-4xl mx-auto">
  <div className="mb-8">
    <h1 className="text-3xl font-bold text-slate-800">Nhập dữ liệu Excel</h1>
    <p className="text-slate-500 mt-1">Cập nhật hàng loạt tên và thông tin thẻ RFID từ file danh sách Excel định dạng mẫu.</p>
  </div>

  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
    <div className="p-8">
      <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
        <input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-700 mb-1">Click hoặc kéo thả file Excel vào đây</h3>
        <p className="text-sm text-slate-500">Hỗ trợ các file đuôi .xlsx, .xls</p>
        
        {file && (
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
            <FileSpreadsheet className="w-4 h-4" />
            {file.name}
          </div>
        )}
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800 text-sm">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <div>
          <p className="font-semibold mb-1">Lưu ý định dạng file mẫu:</p>
          <p>Dòng đầu tiên (Header) của bảng Excel bắt buộc phải có cột tên là <strong>EPC</strong> (chứa mã hex). Các cột khác tùy chọn: <strong>Tên hiển thị</strong>, <strong>Danh mục</strong>, <strong>Vị trí</strong>.</p>
        </div>
      </div>
    </div>
  </div>

  {preview.length > 0 && (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-700">Bản xem trước dữ liệu ({preview.length} dòng)</h3>
        <button 
          onClick={() => importMutation.mutate()}
          disabled={importMutation.isPending}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          {importMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Bắt đầu Import
        </button>
      </div>
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-left text-sm text-slate-600 border-collapse">
          <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200 sticky top-0">
            <tr>
              {Object.keys(preview[0] || {}).map(key => (
                <th key={key} className="px-6 py-3 font-semibold whitespace-nowrap">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.slice(0, 100).map((row, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                {Object.values(row).map((val: any, j) => (
                  <td key={j} className="px-6 py-3 whitespace-nowrap">{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {preview.length > 100 && (
          <div className="p-4 text-center text-sm text-slate-500 italic border-t border-slate-100 bg-slate-50">
            Đang ẩn {preview.length - 100} dòng dữ liệu...
          </div>
        )}
      </div>
    </div>
  )}
</div>
);
};

export default ImportPageClient;
