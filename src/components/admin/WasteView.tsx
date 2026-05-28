import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TIME_RANGES = {
  TODAY: "Today",
  LAST_7_DAYS: "Last 7 Days",
  LAST_30_DAYS: "Last 30 Days",
  ALL_TIME: "All Time",
  CUSTOM_DATE: "Specific Date",
};

export function WasteView() {
  const [wasteLogs, setWasteLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Log form
  const [note, setNote] = useState('');
  const [value, setValue] = useState('');

  // Analytics timeframe
  const [timeRange, setTimeRange] = useState<keyof typeof TIME_RANGES>("LAST_7_DAYS");
  const [customDateValue, setCustomDateValue] = useState(new Date().toISOString().split("T")[0]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/waste');
      if (res.ok) {
        const data = await res.json();
        setWasteLogs(data);
      }
    } catch (e) {
      toast.error('Failed to fetch waste logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || isNaN(Number(value))) {
      toast.error('Please enter a valid value');
      return;
    }

    try {
      const res = await fetch('/api/waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note || 'No note', value: parseFloat(value) })
      });

      if (res.ok) {
        toast.success('Waste log added');
        setNote('');
        setValue('');
        fetchLogs();
      } else {
        toast.error('Failed to add waste log');
      }
    } catch (e) {
      toast.error('Error adding waste log');
    }
  };

  const { filteredLogs, totalWasteValue } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startDate = new Date(0);
    let endDate: Date | null = null;

    if (timeRange === "TODAY") {
      startDate = todayStart;
    } else if (timeRange === "LAST_7_DAYS") {
      startDate = new Date(todayStart.getTime() - 6 * 86400000);
    } else if (timeRange === "LAST_30_DAYS") {
      startDate = new Date(todayStart.getTime() - 29 * 86400000);
    } else if (timeRange === "CUSTOM_DATE") {
      startDate = new Date(customDateValue);
      endDate = new Date(startDate.getTime() + 86400000);
    } // ALL_TIME keeps startDate at 0

    const fLogs = wasteLogs.filter((log: any) => {
      const d = new Date(log.createdAt);
      if (endDate) return d >= startDate && d < endDate;
      return d >= startDate;
    });

    const val = fLogs.reduce((sum: number, log: any) => sum + log.value, 0);
    return { filteredLogs: fLogs, totalWasteValue: val };
  }, [wasteLogs, timeRange, customDateValue]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold font-serif text-primary">Waste Management</h2>
        
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-primary/50" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border-none bg-secondary/20 text-sm font-medium focus:ring-0 cursor-pointer rounded-md p-2"
          >
            {Object.keys(TIME_RANGES).map((k) => (
              <option key={k} value={k}>
                {TIME_RANGES[k as keyof typeof TIME_RANGES]}
              </option>
            ))}
          </select>
          {timeRange === "CUSTOM_DATE" && (
            <input
              type="date"
              value={customDateValue}
              onChange={(e) => setCustomDateValue(e.target.value)}
              className="border border-secondary/30 rounded px-2 py-1 text-sm outline-none"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Card */}
        <div className="bg-background rounded-xl p-6 shadow-sm border border-primary/5 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <Trash2 size={20} />
            <span className="font-semibold text-sm uppercase tracking-wider">Total Waste Value</span>
          </div>
          <p className="text-4xl font-bold font-serif text-primary">
            ₹{totalWasteValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-primary/50 mt-2">
            During {timeRange === 'CUSTOM_DATE' ? customDateValue : TIME_RANGES[timeRange].toLowerCase()}
          </p>
        </div>

        {/* Add Form */}
        <div className="md:col-span-2 bg-background rounded-xl p-6 shadow-sm border border-primary/5">
          <form onSubmit={handleAddLog}>
            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <Plus size={18} /> Record New Waste
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-primary/70 mb-1">Note (Product Name / Reason)</label>
                <input 
                  type="text" 
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. 2x Expired Chocolate Truffle Cakes"
                  className="w-full px-3 py-2 border border-secondary/30 rounded focus:outline-none focus:border-accent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-primary/70 mb-1">Value (₹)</label>
                <input 
                  type="number" 
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder="e.g. 500"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-secondary/30 rounded focus:outline-none focus:border-accent text-sm"
                  required
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                type="submit"
                className="bg-accent text-white px-4 py-2 rounded text-sm font-semibold hover:bg-accent/90 transition-colors"
                disabled={loading}
              >
                Save Record
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-background rounded-xl shadow-sm border border-primary/5 overflow-hidden">
        <div className="p-4 border-b border-secondary/20">
          <h3 className="font-semibold text-primary">Waste Logs</h3>
        </div>
        
        {loading ? (
          <div className="p-8 justify-center flex">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-primary/50">
            <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
            <p>No waste recorded for this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/10 border-b border-secondary/20">
                  <th className="p-4 text-xs font-semibold text-primary/70 uppercase">Date</th>
                  <th className="p-4 text-xs font-semibold text-primary/70 uppercase">Note / Reason</th>
                  <th className="p-4 text-xs font-semibold text-primary/70 uppercase text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary/10">
                {filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-secondary/5 transition-colors">
                    <td className="p-4 text-sm whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm text-primary/80">
                      {log.note}
                    </td>
                    <td className="p-4 text-sm font-medium text-red-600 text-right">
                      ₹{log.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
