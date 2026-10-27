import { CheckCircle, X, Wifi, AlertTriangle } from "lucide-react";

interface Transaction {
  id: string;
  packageName: string;
  name: string;
  [key: string]: unknown;
}

interface ApprovePaymentModalProps {
  transaction: Transaction;
  onApprove: () => void;
  onClose: () => void;
  loading?: boolean;
}

export function ApprovePaymentModal({
  transaction,
  onApprove,
  onClose,
  loading = false,
}: ApprovePaymentModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 sm:p-7">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-md flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                পেমেন্ট অনুমোদন
              </h2>
              <p className="text-sm text-gray-500">
                Voucher automatically assign হবে
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center justify-center"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-md p-4 mb-4 border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-900">
              {transaction.packageName}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            গ্রাহক:{" "}
            <span className="font-medium text-gray-900">
              {transaction.name}
            </span>
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Approve করলে system automatically একটি AVAILABLE voucher assign
            করবে। যদি voucher stock না থাকে, approve fail হবে।
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-md font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5" />
            {loading ? "Processing..." : "অনুমোদন করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
