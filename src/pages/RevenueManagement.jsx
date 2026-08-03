import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Search, 
  RefreshCw, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpRight,
  Filter,
  LineChart as LineChartIcon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const { language } = useLanguage();
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-4 border-t border-border mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        title={language === 'vi' ? 'Trang trước' : 'Prev Page'}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            page === currentPage
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        title={language === 'vi' ? 'Trang tiếp' : 'Next Page'}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

const RevenueManagement = () => {
  const { t, language } = useLanguage();
  const [summaryData, setSummaryData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Filters & State
  const [timeView, setTimeView] = useState('monthly'); // 'daily', 'monthly', 'yearly'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch summary metrics & chart data
  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await API.get('/payment/admin/revenue-summary');
      setSummaryData(res.data);
    } catch (err) {
      console.error('Error fetching revenue summary:', err);
      toast.error('Không thể tải báo cáo tổng quan doanh thu');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch transactions list
  const fetchTransactions = async () => {
    try {
      setLoadingTx(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await API.get('/payment/admin/transactions', { params });
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      toast.error('Không thể tải danh sách giao dịch');
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchTransactions();
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const handleRefresh = () => {
    fetchSummary();
    fetchTransactions();
    toast.success('Đã làm mới dữ liệu doanh thu mới nhất!');
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatCompactVND = (amount) => {
    if (!amount) return '0đ';
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${Math.round(amount / 1000)}k`;
    return `${amount}đ`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination for transactions
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const currentTransactions = transactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Chart series computation
  const chartSeries = summaryData ? summaryData[timeView] || [] : [];
  const maxRevenue = Math.max(...chartSeries.map((item) => item.revenue || 0), 10000);
  const totalChartRevenue = chartSeries.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  const totalChartCount = chartSeries.reduce((acc, curr) => acc + (curr.count || 0), 0);

  // SVG Smooth Line Chart Parameters
  const minPointDistance = timeView === 'daily' ? 45 : 65;
  const chartWidth = Math.max(900, chartSeries.length * minPointDistance);
  const chartHeight = 240;
  const padLeft = 50;
  const padRight = 50;
  const padTop = 35;
  const padBottom = 45;

  const points = chartSeries.map((item, idx) => {
    const n = chartSeries.length;
    const x = n > 1 ? padLeft + (idx / (n - 1)) * (chartWidth - padLeft - padRight) : chartWidth / 2;
    const hFraction = maxRevenue > 0 ? (item.revenue || 0) / maxRevenue : 0;
    const y = (chartHeight - padBottom) - hFraction * (chartHeight - padTop - padBottom);
    return { ...item, x, y, idx };
  });

  let lineD = '';
  let areaD = '';

  if (points.length > 0) {
    lineD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      lineD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }

    const last = points[points.length - 1];
    areaD = `${lineD} L ${last.x} ${chartHeight - padBottom} L ${points[0].x} ${chartHeight - padBottom} Z`;
  }

  // Label step to prevent X-axis text overlap
  const labelStep = timeView === 'daily' ? 3 : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-surface border border-border p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              {t('totalRevenue')}
            </span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              {loadingSummary ? '...' : formatVND(summaryData?.summary?.totalRevenue)}
            </h3>
            <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              <span>Toàn thời gian</span>
            </p>
          </div>
        </div>

        {/* This Month's Revenue */}
        <div className="bg-surface border border-border p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              {t('thisMonthRevenue')}
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              {loadingSummary ? '...' : formatVND(summaryData?.summary?.monthRevenue)}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Doanh thu tháng hiện tại
            </p>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-surface border border-border p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-sky-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              {t('todayRevenue')}
            </span>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              {loadingSummary ? '...' : formatVND(summaryData?.summary?.todayRevenue)}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Phát sinh hôm nay
            </p>
          </div>
        </div>

        {/* Paid / Total Conversion */}
        <div className="bg-surface border border-border p-5 rounded-2xl shadow-xs relative overflow-hidden group hover:border-indigo-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Giao dịch thành công
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              {loadingSummary ? '...' : `${summaryData?.summary?.paidCount || 0} / ${summaryData?.summary?.totalTransactions || 0}`}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              TB: {formatVND(summaryData?.summary?.avgTransactionValue)} / đơn
            </p>
          </div>
        </div>
      </div>

      {/* Line Chart Section */}
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-xs">
              <LineChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <span>Biểu đồ đường tăng trưởng Doanh thu</span>
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {formatVND(totalChartRevenue)} ({totalChartCount} đơn)
                </span>
              </h2>
            </div>
          </div>

          {/* Timeframe Selector & Refresh Button */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setTimeView('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeView === 'daily'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                30 Ngày gần nhất
              </button>
              <button
                onClick={() => setTimeView('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeView === 'monthly'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                12 Tháng
              </button>
              <button
                onClick={() => setTimeView('yearly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeView === 'yearly'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Theo Năm
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loadingSummary || loadingTx}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-surface hover:bg-surface-hover text-text-primary font-semibold text-xs rounded-xl border border-border transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-primary ${(loadingSummary || loadingTx) ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* SVG Line Growth Chart */}
        {loadingSummary ? (
          <div className="h-72 flex flex-col items-center justify-center text-text-secondary">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <span className="text-sm">Đang tải dữ liệu biểu đồ...</span>
          </div>
        ) : chartSeries.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-text-secondary text-sm">
            Chưa có thông tin doanh thu trong khoảng thời gian này.
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto custom-scrollbar">
            <div className="min-w-[700px] relative">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-72 overflow-visible"
              >
                <defs>
                  {/* Area fill gradient */}
                  <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                    <stop offset="70%" stopColor="#10B981" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                  {/* Glowing Filter */}
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Horizontal Guide Lines */}
                {[0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const yVal = (chartHeight - padBottom) - ratio * (chartHeight - padTop - padBottom);
                  return (
                    <g key={idx}>
                      <line
                        x1={padLeft}
                        y1={yVal}
                        x2={chartWidth - padRight}
                        y2={yVal}
                        stroke="currentColor"
                        strokeDasharray="4 4"
                        className="text-border/60"
                        strokeWidth="1"
                      />
                      <text
                        x={padLeft - 8}
                        y={yVal + 3}
                        textAnchor="end"
                        className="fill-text-secondary text-[10px] font-medium"
                      >
                        {formatCompactVND(maxRevenue * ratio)}
                      </text>
                    </g>
                  );
                })}

                {/* Bottom Baseline (0) */}
                <line
                  x1={padLeft}
                  y1={chartHeight - padBottom}
                  x2={chartWidth - padRight}
                  y2={chartHeight - padBottom}
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth="1.5"
                />

                {/* Gradient Area Fill under curve */}
                {areaD && (
                  <path
                    d={areaD}
                    fill="url(#revenueAreaGrad)"
                    className="transition-all duration-700"
                  />
                )}

                {/* Smooth Growth Curve Line */}
                {lineD && (
                  <path
                    d={lineD}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                    className="transition-all duration-700"
                  />
                )}

                {/* Data Node Circles & Hover Trigger */}
                {points.map((pt) => {
                  const labelText = timeView === 'daily' 
                    ? pt.date?.slice(5) 
                    : timeView === 'monthly' 
                      ? pt.label || pt.month 
                      : pt.year;

                  const isHovered = hoveredIndex === pt.idx;
                  const hasValue = pt.revenue > 0;

                  return (
                    <g
                      key={pt.idx}
                      onMouseEnter={() => setHoveredIndex(pt.idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="cursor-pointer group"
                    >
                      {/* Vertical highlight line on hover */}
                      {isHovered && (
                        <line
                          x1={pt.x}
                          y1={padTop}
                          x2={pt.x}
                          y2={chartHeight - padBottom}
                          stroke="#10B981"
                          strokeDasharray="3 3"
                          strokeWidth="1.5"
                          className="opacity-70"
                        />
                      )}

                      {/* Outer Glow Ring on Hover or Non-Zero */}
                      {hasValue && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 10 : 7}
                          fill="#10B981"
                          fillOpacity={isHovered ? "0.3" : "0.15"}
                          className="transition-all duration-300"
                        />
                      )}

                      {/* Core Node Circle */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : hasValue ? 4.5 : 3}
                        fill={hasValue ? "#10B981" : "var(--color-surface, #fff)"}
                        stroke="#10B981"
                        strokeWidth={hasValue ? "2.5" : "1.5"}
                        className="transition-all duration-300"
                      />

                      {/* Top Value Label for Active Nodes */}
                      {hasValue && (
                        <text
                          x={pt.x}
                          y={pt.y - 12}
                          textAnchor="middle"
                          className="fill-primary text-[10px] font-black transition-all"
                        >
                          {formatCompactVND(pt.revenue)}
                        </text>
                      )}

                      {/* Bottom X-Axis Label (Spaced to prevent overlap) */}
                      {(pt.idx % labelStep === 0 || pt.idx === points.length - 1 || hasValue || isHovered) && (
                        <text
                          x={pt.x}
                          y={chartHeight - padBottom + 18}
                          textAnchor="middle"
                          className={`text-[11px] font-bold ${
                            hasValue ? 'fill-primary font-black' : 'fill-text-secondary'
                          }`}
                        >
                          {labelText}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Floating Tooltip Card */}
              {hoveredIndex !== null && points[hoveredIndex] && (
                <div
                  style={{
                    left: `${(points[hoveredIndex].x / chartWidth) * 100}%`,
                    top: `${Math.max(10, points[hoveredIndex].y - 60)}px`
                  }}
                  className="absolute -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold py-2 px-3.5 rounded-xl pointer-events-none z-30 shadow-xl border border-slate-700 animate-fadeIn"
                >
                  <div className="text-slate-400 text-[10px]">
                    {points[hoveredIndex].date || points[hoveredIndex].month || points[hoveredIndex].year}
                  </div>
                  <div className="text-emerald-400 font-black text-sm">
                    {formatVND(points[hoveredIndex].revenue)}
                  </div>
                  <div className="text-slate-300 text-[10px]">
                    {points[hoveredIndex].count} đơn thanh toán
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table Section */}
      <div className="bg-surface border border-border rounded-2xl shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-6 border-b border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">{t('transactionHistory')}</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Hiển thị tất cả giao dịch thanh toán khởi tạo trong hệ thống.
              </p>
            </div>

            {/* Filter and Search controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Select */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-text-primary appearance-none focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="paid">Đã thanh toán (PAID)</option>
                  <option value="pending">Đang chờ (PENDING)</option>
                  <option value="cancelled">Đã hủy (CANCELLED)</option>
                </select>
                <Filter className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Search Input */}
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder={t('searchTransactions')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs font-medium text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                />
                <Search className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loadingTx ? (
          <div className="p-12 flex flex-col items-center justify-center text-text-secondary">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <span className="text-sm">Đang tải lịch sử giao dịch...</span>
          </div>
        ) : currentTransactions.length === 0 ? (
          <div className="p-12 text-center text-text-secondary text-sm">
            Không tìm thấy giao dịch nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/5 dark:bg-white/5 border-b border-border text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  <th className="py-3.5 px-4 sm:px-6">Mã đơn hàng</th>
                  <th className="py-3.5 px-4 sm:px-6">Khách hàng</th>
                  <th className="py-3.5 px-4 sm:px-6">Số tiền</th>
                  <th className="py-3.5 px-4 sm:px-6">Trạng thái</th>
                  <th className="py-3.5 px-4 sm:px-6">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {currentTransactions.map((tx) => {
                  const status = (tx.status || 'pending').toLowerCase();
                  const isPaid = status === 'paid';
                  const isPending = status === 'pending';
                  const userObj = tx.users || {};

                  return (
                    <tr key={tx.id || tx.order_code} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      {/* Order Code */}
                      <td className="py-4 px-4 sm:px-6 font-mono font-bold text-text-primary">
                        #{tx.order_code}
                      </td>

                      {/* User Info */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                            {userObj.avatar_url ? (
                              <img src={userObj.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (userObj.name || userObj.full_name || userObj.email || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-text-primary truncate text-xs sm:text-sm">
                              {userObj.name || userObj.full_name || 'Khách hàng'}
                            </div>
                            <div className="text-text-secondary text-xs truncate">
                              {userObj.email || '---'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 sm:px-6 font-bold text-text-primary">
                        {formatVND(tx.amount)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 sm:px-6">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã thanh toán</span>
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Đang chờ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Đã hủy</span>
                          </span>
                        )}
                      </td>

                      {/* Time */}
                      <td className="py-4 px-4 sm:px-6 text-xs text-text-secondary whitespace-nowrap">
                        {formatDate(tx.paid_at || tx.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>
    </div>
  );
};

export default RevenueManagement;
