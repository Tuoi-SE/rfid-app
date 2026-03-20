'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Tag, Radio, Layers, Activity } from 'lucide-react';

export default function Dashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.login({ username, password });
      localStorage.setItem('token', res.token);
      setToken(res.token);
    } catch (err) {
      alert('Đăng nhập thất bại');
    }
  };

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [tags, sessions] = await Promise.all([
        api.getTags(),
        api.getSessions()
      ]);
      return { totalTags: tags.length, totalSessions: sessions.length };
    },
    enabled: !!token,
  });

  if (!token) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-slate-100">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Radio className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">Đăng nhập Quản trị</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tài khoản</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-2">
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Tổng quan Hệ thống</h1>
      <p className="text-slate-500 mb-8">Theo dõi dữ liệu thiết bị RFID & Thẻ Tag đang được cấp phát.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-lg"><Tag className="w-6 h-6" /></div>
          <div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tổng Thẻ (Tags)</div>
            <div className="text-3xl font-bold text-slate-800 mt-1">{stats?.totalTags || 0}</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg"><Layers className="w-6 h-6" /></div>
          <div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tổng Phiên quét</div>
            <div className="text-3xl font-bold text-slate-800 mt-1">{stats?.totalSessions || 0}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-lg"><Activity className="w-6 h-6" /></div>
          <div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Trạng thái</div>
            <div className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span> Online
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
