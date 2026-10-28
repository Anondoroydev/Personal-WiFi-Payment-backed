import { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Set up pdf.js worker using CDN to avoid Vite build issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import {
  Upload,
  Plus,
  Trash2,
  Wifi,
  Key,
  Package,
  RefreshCw,
  Clock,
  Search,
} from "lucide-react";
import { api, Package as ApiPackage, Voucher } from "../services/api";
import { toast } from "sonner";
import { formatBanglaDateTime } from "../utils/date";
import { subscribeToRealtimeEvents, notifyDataChanged } from "../utils/events";

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read the file as text"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file"));
    reader.readAsText(file);
  });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result);
      else reject(new Error("Could not read the file as binary data"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file"));
    reader.readAsArrayBuffer(file);
  });
}

export function VoucherManagement() {
  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filter, setFilter] = useState<"AVAILABLE" | "USED">("AVAILABLE");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [packageId, setPackageId] = useState("");
  const [csv, setCsv] = useState("");
  const [stats, setStats] = useState({ available: 0, used: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 10;

  const [selectedPackageFilter, setSelectedPackageFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();

    // Instant real-time listener across tabs and windows (no timer reloads needed)
    const unsubscribe = subscribeToRealtimeEvents('vouchers', () => {
      loadData(true);
    });

    return () => {
      unsubscribe();
    };
  }, [filter]);

  const loadData = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const [pkgList, voucherList, voucherStats] = await Promise.all([
        api.getPackages(),
        api.getVouchers(filter),
        api.getVoucherStats(),
      ]);
      setPackages(pkgList);
      setVouchers(voucherList);
      setStats(voucherStats);
      // Do not auto-select a package — require explicit user selection in the UI
      // This prevents accidental uploads to the first package. Keep packageId as "" by default.
      if (!silent) {
        setCurrentPage(1);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Voucher load failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSingleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !packageId) return;
    try {
      await api.uploadVoucher({ username, password, packageId });
      toast.success("Voucher added");
      setUsername("");
      setPassword("");
      notifyDataChanged('vouchers');
      await loadData(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Add failed");
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csv.trim() || !packageId) return;
    try {
      const result = await api.bulkUploadVouchers(packageId, csv);
      toast.success(`${result.created} vouchers uploaded`);
      setCsv("");
      notifyDataChanged('vouchers');
      await loadData(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setExtractingPdf(true);

      if (file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")) {
        const text = await readFileAsText(file);
        setCsv(text);
        toast.success("CSV ফাইল লোড হয়েছে!");
        setExtractingPdf(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      const arrayBuffer = await readFileAsArrayBuffer(file);
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      let debugInfo = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        debugInfo += `Page ${i}: ${textContent.items.length} items found.\n`;
        
        // Group items by Y coordinate (with a small tolerance of 5 pixels)
        const rows: { y: number; items: any[] }[] = [];
        
        for (const item of textContent.items as any[]) {
          // item.transform is [scaleX, skewY, skewX, scaleY, translateX, translateY]
          const x = item.transform ? item.transform[4] : 0;
          const y = item.transform ? item.transform[5] : 0;
          const text = item.str ? item.str.trim() : "";
          
          if (!text) continue;
          
          const existingRow = rows.find(r => Math.abs(r.y - y) < 5);
          if (existingRow) {
            existingRow.items.push({ x, text });
          } else {
            rows.push({ y, items: [{ x, text }] });
          }
        }
        
        // Sort rows by Y descending (PDF coordinates usually start from bottom)
        rows.sort((a, b) => b.y - a.y);
        
        // Sort items in each row by X ascending
        for (const row of rows) {
          row.items.sort((a, b) => a.x - b.x);
          const rowText = row.items.map(item => item.text).join(" ");
          fullText += rowText + "\n";
        }
      }

      // Now fullText represents the text in reading order (top to bottom, left to right)
      
      const lines = fullText.split('\n').filter(Boolean);
      
      let usernames: string[] = [];
      let passwords: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        
        // If a line contains "username", the NEXT line usually contains the actual usernames
        if (line.includes("username") || line.includes("usernaem")) {
          if (i + 1 < lines.length) {
             const userTokens = lines[i + 1].split(/\s+/).filter(t => !t.toLowerCase().includes("password") && !t.includes("[") && !t.toLowerCase().includes("mikhmon"));
             usernames.push(...userTokens);
          }
        }
        
        // If a line contains "password", the NEXT line usually contains the actual passwords
        if (line.includes("password") || line.includes("pass")) {
          if (i + 1 < lines.length) {
             const passTokens = lines[i + 1].split(/\s+/).filter(t => !t.toLowerCase().includes("tk") && !t.toLowerCase().includes("1d") && !t.includes("http"));
             passwords.push(...passTokens);
          }
        }
      }

      let extractedCsv = "username,password\n";
      let count = 0;
      
      // Pair them up
      const minLen = Math.min(usernames.length, passwords.length);
      for (let i = 0; i < minLen; i++) {
         if (usernames[i] && passwords[i]) {
            extractedCsv += `${usernames[i]},${passwords[i]}\n`;
            count++;
         }
      }

      if (count > 0) {
        setCsv(extractedCsv);
        toast.success(`PDF থেকে ${count} টি ভাউচার পাওয়া গেছে! নিচে চেক করুন।`);
      } else {
        // Fallback: If we couldn't parse it automatically, just show the raw text
        setCsv(`--- DEBUG INFO ---\n${debugInfo}\n--- EXTRACTED TEXT ---\n${fullText || "NO TEXT FOUND. PDF might be an image or using an unsupported format."}`);
        toast.error("ভাউচারগুলো অটোমেটিক আলাদা করা যায়নি। বক্সে কাঁচা লেখা দেওয়া হলো, দয়া করে ঠিক করে নিন।");
      }
      
    } catch (_error) {
      toast.error("PDF রিড করতে সমস্যা হয়েছে।");
    } finally {
      setExtractingPdf(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই ভাউচারটি ডিলিট করতে চান?")) return;
    try {
      await api.deleteVoucher(id);
      toast.success("ভাউচার ডিলিট হয়েছে");
      notifyDataChanged('vouchers');
      await loadData(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete ALL vouchers? This action cannot be undone.")) return;
    try {
      setLoading(true);
      const result = await api.deleteAllVouchers();
      toast.success(`Deleted ${result.deleted} vouchers`);
      notifyDataChanged('vouchers');
      await loadData(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete all failed");
    } finally {
      setLoading(false);
    }
  };

  const filteredVouchers = vouchers.filter((v) => {
    if (selectedPackageFilter !== "ALL" && v.packageId !== selectedPackageFilter) {
      return false;
    }
    const query = searchQuery.trim().toLowerCase();
    if (
      query &&
      ![v.username, v.assignedUser?.name, v.assignedUser?.phone]
        .some((value) => value?.toLowerCase().includes(query))
    ) {
      return false;
    }
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVouchers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 text-gray-900">
      <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-600" />
            Voucher Management
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            Available Vouchers: <span className="font-bold text-emerald-600">{stats.available}</span> | Used: <span className="font-bold text-gray-600">{stats.used}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 2xl:gap-6 mb-8">
        <form onSubmit={handleSingleAdd} className="space-y-3 border border-purple-100 bg-purple-50/30 rounded-md p-4">
          <h3 className="font-semibold text-purple-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-600" /> Single Voucher Add
          </h3>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">প্যাকেজ নির্বাচন করুন *</label>
            <select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- প্যাকেজ নির্বাচন করুন --</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  📦 {p.name} - ৳{p.price} ({p.duration})
                </option>
              ))}
            </select>
          </div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono bg-white text-gray-900"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono bg-white text-gray-900"
          />
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md font-bold shadow transition-all"
          >
            Add Voucher
          </button>
        </form>

        <form onSubmit={handleBulkUpload} className="space-y-3 border border-indigo-100 bg-indigo-50/30 rounded-md p-4">
          <div className="flex flex-col gap-2 mb-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="min-w-0 font-bold text-indigo-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" /> Bulk CSV / PDF Upload
            </h3>
            <div className="relative">
              <input
                type="file"
                accept="application/pdf,.csv"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md text-xs font-bold shadow transition-all ${extractingPdf ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {extractingPdf ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                Upload PDF / CSV
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">প্যাকেজ নির্বাচন করুন (Voucher Specific Package) *</label>
            <select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- প্যাকেজ নির্বাচন করুন (Voucher Specific Package) --</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  📦 {p.name} - ৳{p.price} ({p.duration})
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="username,password&#10;10001,abc123&#10;10002,xyz456"
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-xs bg-white text-gray-900"
          />
          <button
            type="submit"
            disabled={loading || !csv.trim() || !packageId || extractingPdf}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md font-bold shadow transition-all disabled:opacity-50"
          >
            Upload Vouchers
          </button>
        </form>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 mb-5 bg-gray-50 p-3.5 rounded-md border border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status:</span>
          {(["AVAILABLE", "USED"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setFilter(s);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === s
                  ? s === "AVAILABLE"
                    ? "bg-emerald-600 text-white shadow"
                    : "bg-purple-600 text-white shadow"
                  : "bg-white text-gray-700 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 2xl:grid-cols-[minmax(12rem,1fr)_minmax(12rem,auto)_auto] 2xl:items-center">
          <label className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ইউজারনেম / গ্রাহকের নাম / ফোন"
              aria-label="ইউজারনেম বা গ্রাহকের নাম/ফোন দিয়ে ভাউচার খুঁজুন"
              className="w-full bg-white border border-gray-300 text-gray-900 text-xs rounded-lg pl-9 pr-3 py-2 font-medium focus:ring-2 focus:ring-purple-500"
            />
          </label>
          <label className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-xs font-bold text-gray-500 uppercase tracking-wider">Package:</span>
            <select
              value={selectedPackageFilter}
              onChange={(e) => {
                setSelectedPackageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="min-w-0 flex-1 bg-white border border-gray-300 text-gray-900 text-xs rounded-md px-3 py-2 font-bold focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Packages ({vouchers.length})</option>
              {packages.map((pkg) => {
                const count = vouchers.filter((v) => v.packageId === pkg.id).length;
                return (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} ({count})
                  </option>
                );
              })}
            </select>
          </label>

          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={loading || vouchers.length === 0}
            className="flex w-full items-center justify-center gap-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-xs font-bold disabled:opacity-50 transition-colors 2xl:w-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete All
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="space-y-3 2xl:hidden">
        {currentItems.map((v) => (
          <article key={v.id} className="min-w-0 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-all font-mono font-bold text-gray-900">{v.username}</p>
                <p className="mt-1 break-all font-mono text-sm text-gray-700">{v.password}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(v.id)}
                className="shrink-0 rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                title="Delete voucher"
                aria-label={`Delete voucher ${v.username}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
              <span className="max-w-full break-words rounded-md border border-purple-200 bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-900">
                {v.package?.name || "Unknown"}
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${
                v.status === "AVAILABLE"
                  ? "border-green-200 bg-green-100 text-green-800"
                  : "border-gray-300 bg-gray-100 text-gray-700"
              }`}>
                {v.status}
              </span>
            </div>
            {v.assignedUser && (
              <div className="mt-3 break-words text-xs text-gray-600">
                <p className="font-medium text-gray-900">{v.assignedUser.name}</p>
                <p>{v.assignedUser.phone}</p>
                {v.usedAt && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                    <Clock className="h-3 w-3 shrink-0" />
                    {formatBanglaDateTime(v.usedAt, '—')}
                  </p>
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-md border border-gray-200 2xl:block">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b text-gray-700 font-bold bg-gray-100/80 text-xs uppercase tracking-wider">
              <th className="py-3 px-3">Username</th>
              <th className="py-3 px-3">Password</th>
              <th className="py-3 px-3">Package</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Assigned User</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentItems.map((v) => (
              <tr key={v.id} className="hover:bg-purple-50/40 transition-colors text-gray-800">
                <td className="py-3 px-3">
                  <span className="font-mono font-bold text-gray-900">{v.username}</span>
                </td>
                <td className="py-3 px-3 font-mono font-bold text-gray-700">{v.password}</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200 shadow-sm">
                    📦 {v.package?.name || "Unknown"}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                      v.status === "AVAILABLE"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-gray-100 text-gray-700 border border-gray-300"
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-xs text-gray-600">
                  {v.assignedUser ? (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-900">{v.assignedUser.name}</span>
                      <span className="text-gray-500">{v.assignedUser.phone}</span>
                      {v.usedAt && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded w-fit border border-emerald-200 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatBanglaDateTime(v.usedAt, '—')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">-</span>
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleDelete(v.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    title="Delete voucher"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredVouchers.length === 0 && (
        <div className="rounded-md border border-dashed border-gray-200 py-10 text-center text-gray-500">
          <p className="font-semibold text-base">কোনো {filter === "AVAILABLE" ? "available" : "used"} ভাউচার পাওয়া যায়নি</p>
          <p className="text-xs text-gray-400 mt-1">Status, search বা package filter পরিবর্তন করে দেখতে পারেন</p>
        </div>
      )}

      {/* Pagination */}
      {filteredVouchers.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 pt-2">
          <span className="text-xs font-semibold text-gray-500">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredVouchers.length)} of {filteredVouchers.length} vouchers
          </span>
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="whitespace-nowrap text-xs font-semibold text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
