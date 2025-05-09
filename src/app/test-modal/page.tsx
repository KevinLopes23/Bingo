"use client";

import { useState } from "react";

export default function TestModal() {
  const [showModal, setShowModal] = useState(false);
  const [value, setValue] = useState("100");

  console.log("Estado do modal:", showModal);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste do Modal</h1>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => {
          console.log("Clicou no botão");
          setShowModal(true);
        }}
      >
        Abrir Modal
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Modal de Teste</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor de Teste
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                onClick={() => {
                  console.log("Fechando modal");
                  setShowModal(false);
                }}
              >
                Fechar
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => {
                  alert(`Valor: ${value}`);
                  setShowModal(false);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
