import React, { useState, useEffect, useRef } from 'react';
import { Database, Download, RefreshCw, Archive, CheckCircle, Upload, RotateCcw, Trash2 } from 'lucide-react';
import { LoadingScreen } from '../LoadingScreen';

interface Backup {
  filename: string;
  size: number;
  createdAt: string;
}

export function BackupView() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backup/list');
      const data = await res.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error('Failed to fetch backups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleGenerateLocalBackup = async () => {
    setGenerating(true);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Backup ${data.filename} created successfully on the server.`);
        fetchBackups();
      } else {
        alert(data.error || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
      alert('An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadDirect = () => {
    window.location.href = '/api/backup/download';
  };

  const handleRestoreLocal = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to restore "${filename}"? This will OVERWRITE your current database. You may need to reload the page or restart the server after.`)) {
      return;
    }
    setRestoring(true);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Database "${filename}" restored successfully. Please refresh the page to see changes.`);
      } else {
        alert(data.error || 'Failed to restore backup');
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
      alert('An error occurred');
    } finally {
      setRestoring(false);
    }
  };

  const handleDeleteLocal = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/backup/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Database "${filename}" deleted successfully.`);
        fetchBackups();
      } else {
        alert(data.error || 'Failed to delete backup');
      }
    } catch (error) {
      console.error('Failed to delete backup:', error);
      alert('An error occurred');
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`Are you sure you want to upload and restore from "${file.name}"? This will OVERWRITE your current database.`)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('database', file);

    try {
      const res = await fetch('/api/backup/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Database imported and restored successfully. Please refresh the page.');
        fetchBackups();
      } else {
        alert(data.error || 'Failed to upload and restore');
      }
    } catch (error) {
      console.error('Failed to upload backup:', error);
      alert('An error occurred during upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return <LoadingScreen message="Loading backup settings..." />;

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Card */}
      <div className="bg-white p-6 rounded-xl border border-secondary/20 shadow-sm flex flex-col items-center justify-between gap-4 md:flex-row md:gap-0">
        <div className="w-full text-left md:w-auto">
          <h2 className="text-xl font-serif font-semibold mb-1 flex items-center">
            <Database size={20} className="mr-2" />
            Database Backup & Restore
          </h2>
          <p className="text-sm text-primary/60">
            Download or restore a full copy of the current SQLite database (.db file).
          </p>
        </div>
        <div className="flex space-x-3 w-full md:w-auto justify-start">
          <input 
            type="file" 
            accept=".db,application/octet-stream" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleUploadFile}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || restoring}
            className="px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-primary font-medium rounded-md transition-colors flex items-center disabled:opacity-50"
          >
             {uploading ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <Upload size={16} className="mr-2" />}
            {uploading ? 'Uploading...' : 'Import .db Backup'}
          </button>
          
          <button
            onClick={handleDownloadDirect}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-background font-medium rounded-md shadow-sm transition-colors flex items-center"
          >
            <Download size={16} className="mr-2" />
            Download Currently Active Database
          </button>
        </div>
      </div>

      {successMsg && (
         <div className="bg-green-50 text-green-800 p-4 rounded-md flex items-center text-sm">
           <CheckCircle size={16} className="mr-2" />
           {successMsg}
         </div>
      )}

      {/* Local Server Backups */}
      <div className="bg-white rounded-xl border border-secondary/20 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-secondary/10 bg-secondary/5 flex justify-between items-center">
          <h3 className="font-semibold font-serif">Local Server Archives</h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleGenerateLocalBackup}
              disabled={generating || restoring}
              className="px-3 py-1 bg-white text-xs border border-secondary/20 hover:bg-secondary/5 font-medium rounded transition-colors flex items-center disabled:opacity-50"
            >
              {generating ? <RefreshCw size={14} className="mr-1 animate-spin" /> : <Archive size={14} className="mr-1" />}
              {generating ? 'Archiving...' : 'Create Snapshot Now'}
            </button>
            <span className="text-xs px-2 py-1 bg-secondary/10 rounded-full font-medium">{backups.length} Archives</span>
          </div>
        </div>
        
        {backups.length === 0 ? (
          <div className="p-8 text-center text-primary/50 text-sm">
            No local archives found. Generate one to keep a historical snapshot on the server.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-secondary/10 text-xs uppercase text-primary/50 tracking-wider">
                  <th className="px-6 py-4 font-medium">Filename</th>
                  <th className="px-6 py-4 font-medium">Created At</th>
                  <th className="px-6 py-4 font-medium">Size</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.filename} className="border-b border-secondary/5 hover:bg-secondary/5 transition-colors last:border-0">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm">{backup.filename}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm">
                        {new Date(backup.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-primary/70">{formatSize(backup.size)}</span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleRestoreLocal(backup.filename)}
                          disabled={restoring || uploading || deleting}
                          className="inline-flex items-center text-xs font-medium text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw size={14} className="mr-1" />
                          Restore
                        </button>
                        <button
                          onClick={() => handleDeleteLocal(backup.filename)}
                          disabled={restoring || uploading || deleting}
                          className="inline-flex items-center text-xs font-medium text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </button>
                      </div>
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
