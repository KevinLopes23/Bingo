"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [rooms, setRooms] = useState([]);
  const [userBalance, setUserBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [addBalanceAmount, setAddBalanceAmount] = useState("100");
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Redirecionamento se não estiver autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Buscar salas e saldo
  useEffect(() => {
    if (status === "authenticated") {
      const fetchData = async () => {
        try {
          // Buscar salas
          const roomsResponse = await fetch("/api/rooms");
          const roomsData = await roomsResponse.json();

          // Buscar saldo
          const balanceResponse = await fetch("/api/balance");
          const balanceData = await balanceResponse.json();

          setRooms(roomsData || []);
          setUserBalance(balanceData.balance || 0);
          setIsLoading(false);
        } catch (err) {
          console.error("Erro ao buscar dados:", err);
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [status]);

  const handleAddBalance = async () => {
    if (isProcessing) return;

    setError("");
    setIsProcessing(true);

    try {
      const amount = parseFloat(addBalanceAmount);

      if (isNaN(amount) || amount <= 0) {
        throw new Error("Por favor, insira um valor válido");
      }

      const response = await fetch("/api/balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao adicionar saldo");
      }

      // Atualizar saldo exibido
      setUserBalance(data.balance);
      setShowAddBalanceModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === "loading" || isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="p-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Seu Perfil</h2>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Nome:</span>{" "}
            {session?.user?.name || "Usuário"}
          </p>
          <p>
            <span className="font-medium">Email:</span>{" "}
            {session?.user?.email || "email@exemplo.com"}
          </p>
          <p>
            <span className="font-medium">Saldo:</span> R${" "}
            {userBalance.toFixed(2)}
          </p>
        </div>
        <div className="mt-4">
          <button
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
            onClick={() => setShowAddBalanceModal(true)}
          >
            Adicionar Saldo
          </button>
        </div>
      </div>

      {/* Modal para adicionar saldo */}
      {showAddBalanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Adicionar Saldo</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Valor (R$)
              </label>
              <input
                id="amount"
                type="number"
                step="1"
                min="1"
                value={addBalanceAmount}
                onChange={(e) => setAddBalanceAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="100"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                onClick={() => setShowAddBalanceModal(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                onClick={handleAddBalance}
                disabled={isProcessing}
              >
                {isProcessing ? "Processando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
