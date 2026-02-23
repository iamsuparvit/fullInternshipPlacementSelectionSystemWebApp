import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Search, ArrowUpDown, AlertCircle } from 'lucide-react';

// Configuration from environment or defaults
const GOOGLE_SCRIPT_URL = (import.meta && (import.meta as any).env) ? (import.meta as any).env.VITE_GOOGLE_SCRIPT_URL : "";
const API_KEY = (import.meta && (import.meta as any).env) ? (import.meta as any).env.VITE_API_KEY : "";

interface RawData {
  shiftRank1: string;
  rank1: string;
  shiftRank2: string;
  rank2: string;
  shiftRank3: string;
  rank3: string;
  shiftRank4: string;
  rank4: string;
  shiftRank5: string;
  rank5: string;
}

interface CapacityData {
  name: string;
  seat1: number;
  seat2: number;
  seat3: number;
}

interface SiteStats {
  name: string;
  shift1: number;
  shift2: number;
  shift3: number;
  total: number;
  cap1: number;
  cap2: number;
  cap3: number;
}

export function Dashboard() {
  const [rawData, setRawData] = useState<RawData[]>([]);
  const [capacities, setCapacities] = useState<CapacityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof SiteStats; direction: 'asc' | 'desc' }>({
    key: 'total',
    direction: 'desc',
  });

  const fetchData = async () => {
    if (!GOOGLE_SCRIPT_URL) {
      setError("Google Script URL is not configured.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchUrl = new URL(GOOGLE_SCRIPT_URL);
      if (API_KEY) {
        fetchUrl.searchParams.append('key', API_KEY);
      }

      const response = await fetch(fetchUrl.toString());
      if (!response.ok) throw new Error('Network response was not ok');
      
      const jsonData = await response.json();
      
      // Handle new structure { responses: [], capacities: [] }
      if (jsonData.responses && Array.isArray(jsonData.responses)) {
        setRawData(jsonData.responses);
        setCapacities(jsonData.capacities || []);
      } else if (Array.isArray(jsonData)) {
        // Fallback for old structure (though likely incompatible now)
        setRawData(jsonData);
        setCapacities([]);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data. Please check your connection and configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const processedData = useMemo(() => {
    const stats = new Map<string, SiteStats>();

    // Initialize with capacities if available
    capacities.forEach(cap => {
      const siteName = String(cap.name).trim();
      if (!siteName) return;
      
      stats.set(siteName, {
        name: siteName,
        shift1: 0,
        shift2: 0,
        shift3: 0,
        total: 0,
        cap1: cap.seat1,
        cap2: cap.seat2,
        cap3: cap.seat3
      });
    });

    rawData.forEach(row => {
      // Iterate through all 5 ranks
      for (let i = 1; i <= 5; i++) {
        const rankKey = `rank${i}` as keyof RawData;
        const shiftRankKey = `shiftRank${i}` as keyof RawData;
        
        const siteName = String(row[rankKey] || '').trim();
        const shiftStr = String(row[shiftRankKey] || '').trim();
        
        if (!siteName) continue;

        let shiftKey: 'shift1' | 'shift2' | 'shift3' | null = null;
        if (shiftStr.includes('1')) shiftKey = 'shift1';
        else if (shiftStr.includes('2')) shiftKey = 'shift2';
        else if (shiftStr.includes('3')) shiftKey = 'shift3';

        if (!shiftKey) continue;

        if (!stats.has(siteName)) {
          // If site not in capacities list, add it with 0 capacity
          stats.set(siteName, { 
            name: siteName, 
            shift1: 0, 
            shift2: 0, 
            shift3: 0, 
            total: 0,
            cap1: 0,
            cap2: 0,
            cap3: 0
          });
        }

        const siteStat = stats.get(siteName)!;
        siteStat[shiftKey]++;
        siteStat.total++;
      }
    });

    return Array.from(stats.values());
  }, [rawData, capacities]);

  const filteredAndSortedData = useMemo(() => {
    let data = [...processedData];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(item => item.name.toLowerCase().includes(lowerTerm));
    }

    data.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [processedData, searchTerm, sortConfig]);

  const handleSort = (key: keyof SiteStats) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const SortIcon = ({ column }: { column: keyof SiteStats }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="ml-2 h-4 w-4 text-stone-400" />;
    return <ArrowUpDown className={`ml-2 h-4 w-4 ${sortConfig.direction === 'asc' ? 'text-blue-600 rotate-180' : 'text-blue-600'}`} />;
  };

  const getCapacityColor = (count: number, capacity: number) => {
    if (capacity === 0) return 'text-red-600 dark:text-red-400 font-bold';
    if (count > capacity) return 'text-red-600 dark:text-red-400 font-bold';
    if (count === capacity) return 'text-amber-600 dark:text-amber-400 font-bold';
    return 'text-green-600 dark:text-green-400';
  };

  const renderCell = (count: number, capacity: number) => {
    return (
      <div className="flex flex-col items-end">
        <span className={getCapacityColor(count, capacity)}>
          {count}
        </span>
        <span className="text-[10px] text-stone-400">
          / {capacity > 0 ? capacity : '-'}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search sites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white border border-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="col-span-2 md:col-span-2 border-stone-200 dark:border-stone-800">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-stone-500 dark:text-stone-400">Total Selections</div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
              <span className="text-4xl font-bold text-stone-900 dark:text-stone-100">
                {processedData.reduce((acc, curr) => acc + curr.total, 0)}
              </span>
              <span className="text-lg font-medium text-stone-500 dark:text-stone-400">
                ({Math.ceil(processedData.reduce((acc, curr) => acc + curr.total, 0) / 5)} people)
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-stone-500 dark:text-stone-400">Shift 1 Total</div>
            <div className="mt-2 text-4xl font-bold text-stone-900 dark:text-stone-100">
              {processedData.reduce((acc, curr) => acc + curr.shift1, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-stone-500 dark:text-stone-400">Shift 2 Total</div>
            <div className="mt-2 text-4xl font-bold text-stone-900 dark:text-stone-100">
              {processedData.reduce((acc, curr) => acc + curr.shift2, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-stone-500 dark:text-stone-400">Shift 3 Total</div>
            <div className="mt-2 text-4xl font-bold text-stone-900 dark:text-stone-100">
              {processedData.reduce((acc, curr) => acc + curr.shift3, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-stone-200 dark:border-stone-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 dark:text-stone-400 font-medium border-b border-stone-200 dark:border-stone-800 sticky top-0 z-10">
              <tr>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Site Name
                    <SortIcon column="name" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-right"
                  onClick={() => handleSort('shift1')}
                >
                  <div className="flex items-center justify-end">
                    Shift 1
                    <SortIcon column="shift1" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-right"
                  onClick={() => handleSort('shift2')}
                >
                  <div className="flex items-center justify-end">
                    Shift 2
                    <SortIcon column="shift2" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-right"
                  onClick={() => handleSort('shift3')}
                >
                  <div className="flex items-center justify-end">
                    Shift 3
                    <SortIcon column="shift3" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-right"
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center justify-end">
                    Total
                    <SortIcon column="total" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800 bg-white dark:bg-stone-950">
              {filteredAndSortedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-stone-500">
                    {loading ? 'Loading data...' : 'No data found'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedData.map((site) => (
                  <tr key={site.name} className="hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-stone-900 dark:text-stone-100">
                      {site.name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {renderCell(site.shift1, site.cap1)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {renderCell(site.shift2, site.cap2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {renderCell(site.shift3, site.cap3)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-stone-900 dark:text-stone-100">
                      {site.total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

