'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Database,
  User,
  LogOut,
  LayoutDashboard,
  FileText,
  Activity
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import projectsData from '@/data/projects.json';

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [rawProjects, setRawProjects] = useState(projectsData);
  const [projects, setProjects] = useState(projectsData);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchProjects = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('last_updated', { ascending: false });

      if (data && data.length > 0) {
        const mapped = data.map((p: any) => ({
          id: p.id,
          proposal_no: p.proposal_no,
          project_name: p.project_name || 'No Name',
          status: p.status || 'Unknown',
          type: p.proposal_no.startsWith('FP/') ? 'Forest' : 
                p.proposal_no.startsWith('WL/') ? 'Wildlife' : 'Manual',
          last_updated_date: p.latest_status_date ? new Date(p.latest_status_date).toLocaleDateString() : 'N/A',
          previous_status: p.previous_status || 'N/A',
          previous_status_date: p.previous_status_date ? new Date(p.previous_status_date).toLocaleDateString() : 'N/A',
          is_parivesh: p.is_parivesh,
          proposal_id: p.proposal_id
        }));
        setRawProjects(mapped);
      }
    } catch (err) {
      console.error('Error fetching from Supabase:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const filtered = rawProjects.filter(p => {
      const matchesSearch = p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.proposal_no.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = selectedFilter === 'all' || 
                           p.type.toLowerCase() === selectedFilter.toLowerCase();
      return matchesSearch && matchesFilter;
    });
    setProjects(filtered);
  }, [searchTerm, selectedFilter, rawProjects]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchProjects();
        alert('Sync completed successfully!');
      } else {
        alert('Sync failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Sync error: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const exportToExcel = () => {
    const exportData = projects.map((p: any) => ({
      'Proposal Name': p.project_name,
      'Status': p.status,
      'Proposal Code': p.proposal_no,
      'Type': p.type,
      'Latest Status Date': p.last_updated_date,
      'Previous Status': p.previous_status,
      'Previous Status Date': p.previous_status_date
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Forest Proposals');
    XLSX.writeFile(wb, 'PWD_Forest_Proposals.xlsx');
  };

  const openPariveshDetails = (project: any) => {
    let url = '';
    if (project.proposal_no.startsWith('FP/')) {
        url = `https://parivesh.nic.in/newupgrade/#/trackYourProposals/proposal-details?proposalId=${project.proposal_id || project.id}`;
    } else if (project.proposal_no.startsWith('WL/')) {
        url = `https://parivesh.nic.in/newupgrade/#/trackYourProposal/proposal-details?proposalNo=${encodeURIComponent(project.proposal_no)}`;
    }
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar ... */}
      <aside className="w-64 glass border-r border-white/5 flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">PWD Forest</h1>
          </div>

          <nav className="space-y-1">
            <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
            <NavItem icon={<FileText size={20} />} label="Proposals" />
            <NavItem icon={<Activity size={20} />} label="Analytics" />
            <NavItem icon={<User size={20} />} label="Team" />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
              <User size={20} />
            </div>
            <div>
              <p className="text-sm font-medium">Administrator</p>
              <p className="text-xs text-slate-400">Top Management</p>
            </div>
          </div>
          <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-full py-2">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">Proposal Management</h2>
            <p className="text-slate-400">Track and manage forest & wildlife clearances across J&K.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-full transition-all text-sm font-medium"
            >
              <FileText size={16} />
              Export Excel
            </button>
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-full transition-all shadow-lg shadow-indigo-600/20 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Activity size={16} className={isSyncing ? 'animate-spin' : 'animate-pulse'} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search..."
                className="bg-slate-900/50 border border-white/5 rounded-full py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Stats Grid ... */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Proposals" value={rawProjects.length.toString()} icon={<FileText className="text-indigo-400" />} change="+12%" />
          <StatCard title="Pending Clearance" value={rawProjects.filter(p => p.status.includes('Pending')).length.toString()} icon={<Clock className="text-amber-400" />} change="+5%" />
          <StatCard title="Approved" value={rawProjects.filter(p => p.status.includes('Approved')).length.toString()} icon={<CheckCircle2 className="text-emerald-400" />} change="+8%" />
          <StatCard title="Wildlife" value={rawProjects.filter(p => p.type === 'Wildlife').length.toString()} icon={<AlertCircle className="text-rose-400" />} change="0%" />
        </section>

        {/* Projects List */}
        <section className="glass rounded-3xl overflow-hidden border border-white/5">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-lg">Detailed Report</h3>
            <div className="flex gap-2">
              <FilterButton label="All" active={selectedFilter === 'all'} onClick={() => setSelectedFilter('all')} />
              <FilterButton label="Forest" active={selectedFilter === 'forest'} onClick={() => setSelectedFilter('forest')} />
              <FilterButton label="Wildlife" active={selectedFilter === 'wildlife'} onClick={() => setSelectedFilter('wildlife')} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-500 bg-slate-900/30">
                  <th className="px-6 py-4 font-medium">Proposal Name</th>
                  <th className="px-6 py-4 font-medium">Proposal Code</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Latest Status</th>
                  <th className="px-6 py-4 font-medium">Latest Date</th>
                  <th className="px-6 py-4 font-medium">Prev Status</th>
                  <th className="px-6 py-4 font-medium">Prev Date</th>
                  <th className="px-6 py-4 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-white/[0.02] transition-colors group text-sm">
                    <td className="px-6 py-5 max-w-xs">
                      <p className="font-medium text-slate-200 line-clamp-2">{project.project_name}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                        {project.proposal_no}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-[10px] px-2 py-1 rounded-full border ${
                        project.type === 'Forest' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10' :
                        project.type === 'Wildlife' ? 'border-amber-500/20 text-amber-400 bg-amber-500/10' :
                        'border-slate-500/20 text-slate-400 bg-slate-500/10'
                      }`}>
                        {project.type}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          project.status.includes('Approved') ? 'bg-emerald-500' :
                          project.status.includes('Pending') ? 'bg-amber-500' :
                          'bg-indigo-500'
                        }`} />
                        <span className="text-slate-300 line-clamp-1">{project.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-400 whitespace-nowrap">{project.last_updated_date || project.last_updated || 'N/A'}</td>
                    <td className="px-6 py-5 text-slate-500 max-w-[100px] truncate">{project.previous_status || 'N/A'}</td>
                    <td className="px-6 py-5 text-slate-500 whitespace-nowrap">{project.previous_status_date || 'N/A'}</td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => openPariveshDetails(project)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors group-hover:text-indigo-400"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-indigo-600/10 text-indigo-400 font-medium border border-indigo-500/20' 
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon, change }: { title: string, value: string, icon: React.ReactNode, change: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-slate-900 rounded-2xl border border-white/5">
          {icon}
        </div>
        <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
          {change}
        </span>
      </div>
      <p className="text-slate-400 text-sm mb-1">{title}</p>
      <h4 className="text-2xl font-bold">{value}</h4>
    </motion.div>
  );
}

function FilterButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm transition-all ${
        active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
          : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );
}
