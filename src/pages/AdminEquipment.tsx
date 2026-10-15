import { useState, useEffect, useRef } from 'react';
import { supabase, bustImageCache } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { EquipmentStatusBadge } from '@/components/StatusBadge';
import type { Equipment, EquipmentStatus } from '@/types/database';
import { Package, Plus, Pencil, Trash2, Loader2, MapPin, Search, Upload, X, ImageIcon } from 'lucide-react';

const CATEGORIES = ['Projector', 'Laptop', 'Camera', 'Microphone', 'Tripod', 'Other'];

export function AdminEquipment() {
  const { showToast } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Projector');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<EquipmentStatus>('available');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('equipment').select('*').order('name', { ascending: true });
    if (error) {
      showToast('Failed to load equipment.', 'error');
    } else {
      setEquipment(data as Equipment[]);
    }
    setLoading(false);
  };

  const openAdd = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setCategory('Projector');
    setLocation('');
    setStatus('available');
    setImageUrl('');
    setModalOpen(true);
  };

  const openEdit = (item: Equipment) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
    setCategory(item.category);
    setLocation(item.location);
    setStatus(item.status);
    setImageUrl(item.image_url ?? '');
    setModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be smaller than 5MB.', 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.', 'error');
      return;
    }

    setUploadingPhoto(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `equipment/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('equipment-photos')
      .upload(filePath, file);

    if (uploadError) {
      showToast('Failed to upload image: ' + uploadError.message, 'error');
      setUploadingPhoto(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('equipment-photos')
      .getPublicUrl(filePath);

    setImageUrl(urlData.publicUrl);
    setUploadingPhoto(false);
    showToast('Image uploaded successfully.', 'success');
  };

  const handleRemovePhoto = () => {
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim() || !category.trim() || !location.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setSubmitting(true);

    const payload = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      status,
      image_url: imageUrl.trim() || null,
    };

    let error;
    if (editingItem) {
      ({ error } = await supabase.from('equipment').update(payload).eq('id', editingItem.id));
    } else {
      ({ error } = await supabase.from('equipment').insert(payload));
    }

    setSubmitting(false);

    if (error) {
      showToast('Failed to save equipment: ' + error.message, 'error');
      return;
    }

    showToast(editingItem ? 'Equipment updated successfully.' : 'Equipment added successfully.', 'success');
    setModalOpen(false);
    loadEquipment();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);

    const { error } = await supabase.from('equipment').delete().eq('id', deleteTarget.id);
    setSubmitting(false);

    if (error) {
      showToast('Failed to delete equipment: ' + error.message, 'error');
      return;
    }

    showToast('Equipment removed successfully.', 'success');
    setDeleteTarget(null);
    loadEquipment();
  };

  const filtered = equipment.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Equipment</h1>
          <p className="text-sm text-slate-500 mt-1">Add, edit, and remove equipment</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Equipment
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search equipment..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Category</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Location</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    No equipment found
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-blue-50">
                          {item.image_url ? (
                            <img src={bustImageCache(item.image_url) ?? undefined} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{item.name}</p>
                          <p className="text-xs text-slate-400 truncate md:hidden">{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded">{item.category}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.location}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <EquipmentStatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="text-slate-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Equipment' : 'Add Equipment'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Epson PowerLite Projector"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the equipment..."
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Location *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Library Room 204"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Equipment Photo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-200 group">
                <img src={imageUrl} alt="Equipment preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-700 rounded-lg p-1.5 shadow-md transition-colors"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-lg py-8 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-500 transition-colors disabled:opacity-50"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
                <span className="text-sm font-medium">
                  {uploadingPhoto ? 'Uploading...' : 'Click to upload a photo'}
                </span>
                <span className="text-xs">PNG, JPG up to 5MB</span>
              </button>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Saving...' : editingItem ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Equipment" size="sm">
        <div>
          <p className="text-slate-600 mb-1">
            Are you sure you want to remove <span className="font-semibold text-slate-900">{deleteTarget?.name}</span>?
          </p>
          <p className="text-sm text-slate-500 mb-5">
            This will also delete all associated bookings. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
