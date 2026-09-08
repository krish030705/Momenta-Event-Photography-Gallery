// components/ConfirmDialog.jsx
import Modal from "./Modal";

export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", onConfirm, onCancel, danger = true, working = false }) {
  return (
    <Modal title={title} onClose={working ? () => {} : onCancel}>
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={working}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={working}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 ${
            danger ? "bg-red-600 hover:bg-red-700" : "bg-accent hover:opacity-90"
          }`}
        >
          {working ? "Working..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}