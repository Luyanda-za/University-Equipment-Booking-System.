import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Equipment } from '@/types/database';
import { EquipmentStatusBadge } from '@/components/StatusBadge';
import { Search, Package, MapPin, Loader2, Filter, ImageIcon } from 'lucide-react';

interface EquipmentListProps {
  onSelectEquipment: (id: string) => void;
}

export function EquipmentList({ onSelectEquipment }: EquipmentListProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to load equipment:', error.message);
    } else {
      setEquipment(data as Equipment[]);
    }
    setLoading(false);
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(equipment.map((e) => e.category))).sort();
    return ['all', ...cats];
  }, [equipment]);

  const filtered = useMemo(() => {
    return equipment.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [equipment, search, categoryFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Equipment Catalog</h1>
        <p className="text-sm text-slate-500 mt-1">Browse and book university equipment</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search equipment by name..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="relative sm:w-52">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500 mb-4">
        {filtered.length} {filtered.length === 1 ? 'item' : 'items'} found
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No equipment found</p>
          <p className="text-sm text-slate-400">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectEquipment(item.id)}
              className="group bg-white rounded-xl border border-slate-200 text-left hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              <div className="h-40 bg-slate-100 overflow-hidden relative">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-slate-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <EquipmentStatusBadge status={item.status} />
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors mb-1">{item.name}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{item.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{item.category}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {item.location}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
