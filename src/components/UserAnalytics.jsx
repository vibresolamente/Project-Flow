import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  PieChart as PieChartIcon, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Share2
} from 'lucide-react';

const UserAnalytics = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">System Intelligence</h2>
          <p className="text-muted-foreground font-medium text-sm">Document activity trends, active users, and architectural health.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none btn border border-border bg-white hover:bg-muted text-xs font-bold">
            <Download size={14} /> Export CSV
          </button>
          <button className="flex-1 md:flex-none btn btn-primary px-6 text-xs font-bold">
            <TrendingUp size={14} /> Full Report
          </button>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Total Reads" value="1.2k" trend="+14%" icon={<FileText />} upward />
        <KPICard label="Active Users" value="84" trend="+5%" icon={<Users />} upward />
        <KPICard label="Auth Requests" value="342" trend="-2%" icon={<TrendingUp />} />
        <KPICard label="Storage Used" value="1.4TB" trend="+12%" icon={<BarChart3 />} upward />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CHART MOCKS */}
        <div className="lg:col-span-2 card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Document Activity trends</h3>
            <div className="flex gap-2">
              <span className="text-[10px] font-bold bg-muted px-2 py-1 rounded">Daily</span>
              <span className="text-[10px] font-bold bg-primary text-white px-2 py-1 rounded">Weekly</span>
            </div>
          </div>
          
          {/* Simulated CSS Bar Chart */}
          <div className="h-48 md:h-64 flex items-end gap-2 md:gap-3 px-2 md:px-4 pb-4 border-b border-border">
            <ChartBar height="40%" label="Mon" />
            <ChartBar height="70%" label="Tue" highlight />
            <ChartBar height="55%" label="Wed" />
            <ChartBar height="90%" label="Thu" highlight />
            <ChartBar height="45%" label="Fri" />
            <ChartBar height="30%" label="Sat" />
            <ChartBar height="20%" label="Sun" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 pt-4">
            <div className="p-3 bg-emerald-50 rounded border border-emerald-100">
              <p className="text-[10px] uppercase font-bold text-emerald-700">Highest Engagement</p>
              <p className="text-sm font-bold">Thursday (8.4k Events)</p>
            </div>
            <div className="p-3 bg-blue-50 rounded border border-blue-100">
              <p className="text-[10px] uppercase font-bold text-blue-700">Top Department</p>
              <p className="text-sm font-bold">Finance (42%)</p>
            </div>
            <div className="p-3 bg-amber-50 rounded border border-amber-100">
              <p className="text-[10px] uppercase font-bold text-amber-700">Avg Session</p>
              <p className="text-sm font-bold">18m 42s</p>
            </div>
          </div>
        </div>

        {/* MOST ACCESSED DOCUMENTS */}
        <div className="card p-6 space-y-6">
          <h3 className="text-lg font-bold">Popular Content</h3>
          <div className="space-y-4">
            <PopularDoc name="HQ_Strategic_Plan.pdf" count="428" />
            <PopularDoc name="Operational_SOP_v3" count="382" />
            <PopularDoc name="Employee_Handbook" count="215" />
            <PopularDoc name="Q2_Tax_Report" count="198" />
            <PopularDoc name="Nairobi_Office_Layout" count="104" />
          </div>
          <button className="w-full btn bg-muted text-xs font-bold py-3 mt-4">View All Access Trends</button>
        </div>
      </div>
    </motion.div>
  );
};

const KPICard = ({ label, value, trend, icon, upward }) => (
  <div className="card p-6 flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-primary">
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${upward ? 'text-emerald-600' : 'text-red-500'}`}>
        {upward ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trend}
      </div>
    </div>
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  </div>
);

const ChartBar = ({ height, label, highlight }) => (
  <div className="flex-1 flex flex-col items-center gap-3">
    <motion.div 
      initial={{ height: 0 }}
      animate={{ height: height }}
      className={`w-full rounded-t ${highlight ? 'bg-primary' : 'bg-primary/20'}`}
    ></motion.div>
    <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
  </div>
);

const PopularDoc = ({ name, count }) => (
  <div className="flex items-center justify-between group cursor-pointer">
    <div className="flex gap-3 items-center">
      <div className="h-2 w-2 rounded-full bg-primary opacity-30 group-hover:opacity-100 transition-opacity"></div>
      <p className="text-sm font-medium group-hover:text-primary transition-colors">{name}</p>
    </div>
    <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded">{count}</span>
  </div>
);

export default UserAnalytics;
