"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { AppVersion } from "@/types/AppVersion";
import { Edit3, Check, X, Loader2, ExternalLink, Smartphone, Monitor } from "lucide-react";
import { updateAppVersion } from "@/lib/actions/appVersions";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";

interface AppVersionTableProps {
  versions: AppVersion[];
}

const VersionRow = ({ version }: { version: AppVersion }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [latest, setLatest] = useState(version.latestVersion);
  const [min, setMin] = useState(version.minSupportedVersion);
  const [url, setUrl] = useState(version.storeUrl);
  const [force, setForce] = useState(version.forceUpdate);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateAppVersion({
        appId: version.appId,
        platform: version.platform,
        latestVersion: latest,
        minSupportedVersion: min,
        storeUrl: url,
        forceUpdate: force,
      });

      if (res.error) {
        alert(res.error);
      } else {
        setIsEditing(false);
        router.refresh();
      }
    } catch (error) {
      alert("Failed to update version");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <TableRow className="bg-brand-50/30 dark:bg-brand-500/5">
        <TableCell className="px-5 py-4">
           <div className="flex items-center gap-2">
            <Badge variant="light" color={version.appId.includes('user') ? 'primary' : 'warning'} className="font-black uppercase text-[10px]">
                {version.appId}
            </Badge>
          </div>
        </TableCell>
        <TableCell className="px-4 py-4">
           {version.platform === 'android' ? <Smartphone size={14} className="text-success-500" /> : <Monitor size={14} className="text-blue-500" />}
           <span className="ml-1 text-xs font-bold uppercase">{version.platform}</span>
        </TableCell>
        <TableCell className="px-4 py-4">
          <input 
            value={latest} 
            onChange={(e) => setLatest(e.target.value)}
            className="w-24 p-2 text-xs border rounded-lg dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="Latest"
          />
        </TableCell>
        <TableCell className="px-4 py-4">
          <input 
            value={min} 
            onChange={(e) => setMin(e.target.value)}
            className="w-24 p-2 text-xs border rounded-lg dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="Min"
          />
        </TableCell>
        <TableCell className="px-4 py-4">
           <div className="flex items-center gap-2">
            <input 
                type="checkbox" 
                checked={force} 
                onChange={(e) => setForce(e.target.checked)}
                className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
            />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Force</span>
           </div>
        </TableCell>
        <TableCell className="px-4 py-4 max-w-[200px]">
          <input 
            value={url} 
            onChange={(e) => setUrl(e.target.value)}
            className="w-full p-2 text-xs border rounded-lg dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="Store URL"
          />
        </TableCell>
        <TableCell className="px-5 py-4 text-right">
          <div className="flex items-center justify-end gap-2 text-start">
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-all disabled:opacity-50"
            >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button
                onClick={() => setIsEditing(false)}
                className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg hover:bg-gray-200 transition-all"
            >
                <X size={14} />
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
      <TableCell className="px-5 py-4">
        <Badge variant="light" color={version.appId.includes('user') ? 'primary' : 'warning'} className="font-black uppercase text-[10px]">
          {version.appId}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-4">
        <div className="flex items-center gap-1.5">
           {version.platform === 'android' ? <Smartphone size={14} className="text-success-500" /> : <Monitor size={14} className="text-blue-500" />}
           <span className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">{version.platform}</span>
        </div>
      </TableCell>
      <TableCell className="px-4 py-4">
        <span className="text-xs font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
          {version.latestVersion}
        </span>
      </TableCell>
      <TableCell className="px-4 py-4 font-mono text-[11px] text-gray-500 dark:text-gray-400">
        v{version.minSupportedVersion}
      </TableCell>
      <TableCell className="px-4 py-4">
        {version.forceUpdate ? (
           <Badge color="error" variant="solid" size="sm" className="bg-rose-500 text-white border-none text-[9px] font-black uppercase px-2">FORCE REQUIRED</Badge>
        ) : (
           <Badge color="success" variant="light" size="sm" className="text-[9px] font-bold uppercase px-2">Optional Upgrade</Badge>
        )}
      </TableCell>
      <TableCell className="px-4 py-4 max-w-[200px] truncate">
        <a 
          href={version.storeUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-theme-xs text-brand-500 hover:underline flex items-center gap-1"
        >
          {version.storeUrl} <ExternalLink size={10} />
        </a>
      </TableCell>
      <TableCell className="px-5 py-4 text-right">
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 text-gray-400 hover:text-brand-500 transition-all rounded-lg hover:bg-brand-50 dark:hover:bg-brand-500/10"
        >
          <Edit3 size={16} />
        </button>
      </TableCell>
    </TableRow>
  );
};

export default function AppVersionTable({ versions }: AppVersionTableProps) {
  return (
    <div className="overflow-hidden bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase tracking-wider">App ID</TableCell>
                        <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase tracking-wider">Platform</TableCell>
                        <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase tracking-wider">Latest Version</TableCell>
                        <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase tracking-wider">Min Supported</TableCell>
                        <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase tracking-wider">Status</TableCell>
                        <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs uppercase tracking-wider min-w-[200px]">Store URL</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-right text-theme-xs uppercase tracking-wider">Actions</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {versions.map((v, i) => (
                        <VersionRow key={v.appId + v.platform} version={v} />
                    ))}
                    {versions.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm italic">
                                No app versions found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
