"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Room {
  id: string;
  name: string;
  code: string;
  entryFee: number;
  roundCount: number;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [addBalanceAmount, setAddBalanceAmount] = useState("100");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roomsResponse = await fetch("/api/rooms");
        const roomsData = await roomsResponse.json();
        const balanceResponse = await fetch("/api/balance");
        const balanceData = await balanceResponse.json();
        setRooms(roomsData || []);
        setUserBalance(balanceData.balance || 0);
        setIsLoading(false);
      } catch (err) {
        setError("Erro ao buscar dados");
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddBalance = async () => {
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
      setUserBalance(data.balance);
      setAddBalanceAmount("100");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-800 to-blue-600 flex flex-col items-center py-10 px-2 md:px-8">
      <div className="w-full max-w-6xl flex flex-col gap-10">
        {/* Topo: Perfil, Ações e Estatísticas */}
        <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch mb-8">
          {/* Perfil */}
          <div className="bg-white rounded-3xl shadow-xl flex flex-col items-center p-8 gap-4 min-h-[320px] col-span-1 md:col-span-2 justify-center">
            <div className="relative mb-2">
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=256&q=80"
                alt="Avatar"
                className="w-28 h-28 rounded-full border-4 border-blue-200 shadow-lg object-cover"
              />
            </div>
            <h2 className="text-3xl font-bold text-blue-800 mb-1">
              {session?.user?.name || "Usuário"}
            </h2>
            <div className="flex flex-col items-center w-full">
              <div className="flex items-center gap-2 bg-blue-50 rounded-2xl px-6 py-3 mb-2 shadow-inner">
                <span className="text-yellow-500 text-2xl">
                  <svg
                    className="w-7 h-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" fill="#FDE68A" />
                    <text
                      x="12"
                      y="17"
                      textAnchor="middle"
                      fontSize="13"
                      fill="#F59E42"
                      fontWeight="bold"
                    >
                      $
                    </text>
                  </svg>
                </span>
                <span className="text-2xl font-bold text-green-700">
                  R$ {userBalance.toFixed(2)}
                </span>
              </div>
              <div className="flex w-full gap-2 mt-2">
                <input
                  type="number"
                  value={addBalanceAmount}
                  onChange={(e) => setAddBalanceAmount(e.target.value)}
                  min={1}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-lg bg-white"
                  placeholder="Adicionar saldo"
                />
                <button
                  onClick={handleAddBalance}
                  disabled={isProcessing}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow-sm transition-all text-lg"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  {isProcessing ? "..." : "Adicionar"}
                </button>
              </div>
              {error && (
                <div className="text-red-600 mt-2 text-sm bg-red-50 p-2 rounded-lg w-full text-center">
                  {error}
                </div>
              )}
            </div>
          </div>
          {/* Ações */}
          <div className="flex flex-col gap-4 items-center justify-center col-span-1">
            <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-700 to-blue-500 text-white text-lg font-bold py-4 rounded-2xl shadow-lg hover:from-blue-800 hover:to-blue-600 transition-all">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Criar Sala
            </button>
            <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-green-400 text-white text-lg font-bold py-4 rounded-2xl shadow-lg hover:from-cyan-600 hover:to-green-500 transition-all">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
              Entrar na Sala
            </button>
          </div>
          {/* Estatísticas */}
          <div className="flex flex-col gap-4 col-span-1 md:col-span-2 justify-center">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow flex flex-col items-center justify-center px-6 py-4 min-w-[120px]">
                <span className="text-purple-500 text-2xl mb-1">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" fill="#E9D5FF" />
                    <text
                      x="12"
                      y="17"
                      textAnchor="middle"
                      fontSize="13"
                      fill="#A78BFA"
                      fontWeight="bold"
                    >
                      🏆
                    </text>
                  </svg>
                </span>
                <span className="text-xl font-bold text-blue-800">0</span>
                <span className="text-gray-500 text-xs font-light">
                  Jogos Vencidos
                </span>
              </div>
              <div className="bg-white rounded-2xl shadow flex flex-col items-center justify-center px-6 py-4 min-w-[120px]">
                <span className="text-blue-400 text-2xl mb-1">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" fill="#DBEAFE" />
                    <text
                      x="12"
                      y="17"
                      textAnchor="middle"
                      fontSize="13"
                      fill="#60A5FA"
                      fontWeight="bold"
                    >
                      🎲
                    </text>
                  </svg>
                </span>
                <span className="text-xl font-bold text-blue-800">0</span>
                <span className="text-gray-500 text-xs font-light">
                  Jogos Jogados
                </span>
              </div>
              <div className="bg-white rounded-2xl shadow flex flex-col items-center justify-center px-6 py-4 min-w-[120px]">
                <span className="text-green-400 text-2xl mb-1">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" fill="#D1FAE5" />
                    <text
                      x="12"
                      y="17"
                      textAnchor="middle"
                      fontSize="13"
                      fill="#34D399"
                      fontWeight="bold"
                    >
                      $
                    </text>
                  </svg>
                </span>
                <span className="text-xl font-bold text-blue-800">R$ 0</span>
                <span className="text-gray-500 text-xs font-light">
                  Total de Ganhos
                </span>
              </div>
              <div className="bg-white rounded-2xl shadow flex flex-col items-center justify-center px-6 py-4 min-w-[120px]">
                <span className="text-yellow-400 text-2xl mb-1">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" fill="#FEF3C7" />
                    <text
                      x="12"
                      y="17"
                      textAnchor="middle"
                      fontSize="13"
                      fill="#FBBF24"
                      fontWeight="bold"
                    >
                      7
                    </text>
                  </svg>
                </span>
                <span className="text-xl font-bold text-blue-800">
                  {rooms.length}
                </span>
                <span className="text-gray-500 text-xs font-light">
                  Salas Criadas
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Tabela de Salas */}
        <div className="w-full bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-6">
            Salas de Bingo
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-gray-700">
              <thead>
                <tr>
                  <th className="py-3 px-4 font-semibold text-blue-800">
                    Nome
                  </th>
                  <th className="py-3 px-4 font-semibold text-blue-800">
                    Código
                  </th>
                  <th className="py-3 px-4 font-semibold text-blue-800">
                    Valor
                  </th>
                  <th className="py-3 px-4 font-semibold text-blue-800">
                    Rodadas
                  </th>
                  <th className="py-3 px-4 font-semibold text-blue-800">
                    Status
                  </th>
                  <th className="py-3 px-4 font-semibold text-blue-800">
                    Entrar
                  </th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr
                    key={room.id}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold">{room.name}</td>
                    <td className="py-3 px-4 font-mono">{room.code}</td>
                    <td className="py-3 px-4">R$ {room.entryFee.toFixed(2)}</td>
                    <td className="py-3 px-4">{room.roundCount}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          room.status === "waiting"
                            ? "bg-blue-100 text-blue-500"
                            : room.status === "active"
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {room.status === "waiting"
                          ? "Esperando"
                          : room.status === "active"
                          ? "Em Jogo"
                          : "Finalizado"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/rooms/${room.id}`}
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-md shadow-sm transition-all"
                      >
                        Entrar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
