import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { FileText, CheckCircle, AlertTriangle, BrainCircuit, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getTagColor = (subject) => {
  const s = subject?.toLowerCase?.() || '';
  if (s.includes('nhân sự')) return 'bg-[#E0F2FE] text-[#0284C7]';
  if (s.includes('hành chính')) return 'bg-[#FAE8FF] text-[#C026D3]';
  if (s.includes('pháp luật')) return 'bg-[#FEF3C7] text-[#D97706]';
  if (s.includes('học tập')) return 'bg-[#DCFCE7] text-[#16A34A]';
  return 'bg-gray-100 text-gray-600';
};

const Overview = () => {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/documents/stats');
        setStats(res.data);
      } catch (error) {
        console.error("Could not fetch stats", error);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Tổng quan</h1>
      <p className="text-text-secondary text-sm mb-8">Thống kê hệ thống quản lý tài liệu AI</p>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="border border-border bg-surface p-6 rounded-xl flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div>
            <p className="text-text-secondary text-sm font-medium mb-2">Tổng tài liệu</p>
            <p className="text-3xl font-bold text-text-primary">{stats.totalDocs}</p>
          </div>
          <FileText className="w-8 h-8 text-[#14b8a6]" />
        </div>
        <div className="border border-border bg-surface p-6 rounded-xl flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div>
            <p className="text-text-secondary text-sm font-medium mb-2">Đã xử lý</p>
            <p className="text-3xl font-bold text-text-primary">{stats.processedDocs}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-[#14b8a6]" />
        </div>
        <div className="border border-border bg-surface p-6 rounded-xl flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div>
            <p className="text-text-secondary text-sm font-medium mb-2">Đang chờ</p>
            <p className="text-3xl font-bold text-text-primary">{stats.pendingDocs}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-secondary" />
        </div>
      </div>

      <div className="border border-border bg-surface p-6 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] mb-4">
        <h3 className="font-bold text-text-primary mb-6">Phân loại theo danh mục</h3>
        <div className="space-y-4">
          {stats.subjectStats.map((item, index) => {
             const percent = stats.totalDocs > 0 ? (item.count / stats.totalDocs) * 100 : 0;
             return (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className={`px-3 py-1 rounded-full text-xs font-medium w-28 text-center ${getTagColor(item.subject)}`}>{item.subject}</span>
                 <div className="flex-1 mx-4 h-2 bg-border rounded-full overflow-hidden">
                   <div className="bg-[#14b8a6] h-full" style={{ width: `${percent}%` }}></div>
                 </div>
                <span className="font-semibold w-4 text-right">{item.count}</span>
              </div>
             )
          })}
          {stats.subjectStats.length === 0 && (
             <p className="text-text-secondary italic text-sm">Chưa có dữ liệu danh mục.</p>
          )}
        </div>
      </div>

      <div className="border border-border bg-surface p-6 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <h3 className="font-bold text-text-primary mb-4">Tài liệu gần đây</h3>
        <div className="space-y-4">
           {stats.recentDocs.map((doc, idx) => (
             <div key={idx} onClick={() => navigate(`/documents/${doc.id}`)} className="flex justify-between items-center text-sm border-b border-border pb-3 cursor-pointer hover:bg-black/5 p-2 rounded transition-colors">
               <div>
                 <p className="font-medium text-text-primary">{doc.title}</p>
                 <p className="text-text-secondary text-xs mt-0.5">{new Date(doc.created_at).toISOString().split('T')[0]}</p>
               </div>
               <span className={`px-3 py-1 rounded-full text-[10px] font-semibold ${getTagColor(doc.subject)}`}>{doc.subject}</span>
             </div>
           ))}
           {stats.recentDocs.length === 0 && (
             <p className="text-text-secondary italic text-sm">Chưa có tài liệu nào.</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
