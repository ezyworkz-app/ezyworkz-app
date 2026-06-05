import React from "react";
import { getModalTitle } from "./helpers";

export function ModalRenderer({
  modal,
  setModal,
}: {
  modal: { type: string; data?: any } | null;
  setModal: (val: any) => void;
}) {
  if (!modal) return null;

  const { component: Component } = modal.data || {};

  if (Component) {
    return (
      <div 
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6"
        onClick={() => setModal(null)}
      >
        <div 
          className="w-full max-w-2xl max-h-[90vh] flex flex-col relative bg-white rounded-[2rem] shadow-2xl overflow-hidden" 
          onClick={(e) => e.stopPropagation()}
        >
          <Component closeModal={() => setModal(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 w-full max-w-lg shadow-xl relative">
        <button
          className="absolute top-2 right-3 text-gray-500 hover:text-gray-700"
          onClick={() => setModal(null)}
        >
          ✖
        </button>

        <h2 className="text-lg font-semibold mb-4">
          {getModalTitle(modal.type)}
        </h2>
        {["add", "edit"].some((p) => modal.type.startsWith(p)) ? (
          <input
            type="text"
            placeholder="Enter name"
            defaultValue={modal.data?.name}
            className="w-full border px-3 py-2 rounded"
          />
        ) : (
          <p>Are you sure you want to delete this?</p>
        )}
        <div className="flex justify-end mt-5 space-x-2">
          <button
            onClick={() => setModal(null)}
            className="px-4 py-2 bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => setModal(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
