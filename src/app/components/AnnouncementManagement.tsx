import { useState, useEffect } from "react";
import { Megaphone, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { formatBanglaDateTime } from "../utils/date";
import { notifyDataChanged } from "../utils/events";

interface Announcement {
  id: string;
  title: string;
  message?: string;
  content?: string;
  type: "info" | "warning" | "success" | "error";
  isActive: boolean;
  createdAt: string;
}

export function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "success" | "error",
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await api.getAllAnnouncements();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ঘোষণা লোড করা যায়নি");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Update existing announcement
        await api.updateAnnouncement(editingId, {
          title: formData.title,
          message: formData.message,
          content: formData.message,
          type: formData.type,
          isActive: true,
        });
        toast.success("✅ ঘোষণা সফলভাবে আপডেট করা হয়েছে!");
      } else {
        // Create new announcement
        const newAnnouncement = {
          id: Date.now().toString(),
          title: formData.title,
          message: formData.message,
          content: formData.message,
          type: formData.type,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        await api.createAnnouncement(newAnnouncement);
        toast.success("✅ নতুন ঘোষণা তৈরি করা হয়েছে!");
      }

      notifyDataChanged('announcements');
      setFormData({ title: "", message: "", type: "info" });
      setEditingId(null);
      await loadAnnouncements();
    } catch (_error) {
      toast.error("❌ ঘোষণা সংরক্ষণে সমস্যা হয়েছে");
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const announcement = announcements.find((a) => a.id === id);
      if (announcement) {
        await api.updateAnnouncement(id, {
          title: announcement.title,
          message: announcement.message || announcement.content,
          content: announcement.message || announcement.content,
          type: announcement.type || "info",
          isActive: !currentStatus,
        });
        notifyDataChanged('announcements');
        await loadAnnouncements();
        toast.success(currentStatus ? "🔇 ঘোষণা লুকানো হয়েছে" : "📢 ঘোষণা সক্রিয় করা হয়েছে");
      }
    } catch (_error) {
      toast.error("❌ ঘোষণা আপডেটে সমস্যা হয়েছে");
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই ঘোষণাটি মুছে ফেলতে চান?")) return;

    try {
      await api.deleteAnnouncement(id);
      notifyDataChanged('announcements');
      await loadAnnouncements();
      toast.success("🗑️ ঘোষণা মুছে ফেলা হয়েছে");
    } catch (_error) {
      toast.error("❌ ঘোষণা মুছে ফেলতে সমস্যা হয়েছে");
    }
  };

  const startEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      message: announcement.message || announcement.content || "",
      type: announcement.type || "info",
    });
    setEditingId(announcement.id);
    setShowForm(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getTypeBangla = (type: string) => {
    switch (type) {
      case "success":
        return "সবুজ ✅";
      case "warning":
        return "হলুদ ⚠️";
      case "error":
        return "লাল ❌";
      default:
        return "নীল ℹ️";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Megaphone className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              ঘোষণা ব্যবস্থাপনা
            </h2>
            <p className="text-sm text-gray-500">সব ইউজারদের জন্য বার্তা</p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ title: "", message: "", type: "info" });
          }}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          নতুন ঘোষণা
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-purple-50 rounded-md p-4 sm:p-6 mb-6"
        >
          <h3 className="font-bold text-gray-900 mb-4">
            {editingId ? "ঘোষণা সম্পাদনা" : "নতুন ঘোষণা তৈরি"}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                শিরোনাম
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                placeholder="যেমন: গুরুত্বপূর্ণ বিজ্ঞপ্তি"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                বার্তা
              </label>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                rows={3}
                placeholder="আপনার বার্তা এখানে লিখুন..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ধরন (ব্যানার কালার)
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as any })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              >
                <option value="info">তথ্য (নীল ব্যানার) ℹ️</option>
                <option value="success">সফল (সবুজ ব্যানার) ✅</option>
                <option value="warning">সতর্কতা (হলুদ ব্যানার) ⚠️</option>
                <option value="error">ত্রুটি (লাল ব্যানার) ❌</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md transition-colors"
              >
                {editingId ? "আপডেট করুন" : "তৈরি করুন"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ title: "", message: "", type: "info" });
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-md transition-colors"
              >
                বাতিল
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>কোনো ঘোষণা নেই</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`border rounded-lg p-4 ${
                announcement.isActive
                  ? "border-purple-200 bg-white"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900">
                      {announcement.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${getTypeColor(announcement.type || "info")}`}
                    >
                      {getTypeBangla(announcement.type || "info")}
                    </span>
                    {announcement.isActive && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        সক্রিয়
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {announcement.message || announcement.content}
                  </p>
                  <p className="text-xs text-gray-400">
                    তৈরি:{" "}
                    {formatBanglaDateTime(announcement.createdAt, "—")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      toggleActive(announcement.id, announcement.isActive)
                    }
                    className={`p-2 rounded-lg transition-colors ${
                      announcement.isActive
                        ? "bg-green-100 hover:bg-green-200 text-green-700"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-500"
                    }`}
                    title={announcement.isActive ? "লুকান" : "দেখান"}
                  >
                    {announcement.isActive ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => startEdit(announcement)}
                    className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                    title="সম্পাদনা"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(announcement.id)}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
