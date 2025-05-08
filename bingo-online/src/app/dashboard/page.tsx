"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
  const router = useRouter();
  const { data: session, status } = useSession();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirecionamento se não estiver autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchRooms = async () => {
      if (status !== "authenticated") return;

      try {
        const response = await fetch("/api/rooms");

        if (!response.ok) {
          throw new Error("Falha ao carregar salas");
        }

        const data = await response.json();
        setRooms(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, [status]);

  if (status === "loading") {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-800 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Bingo Online</h1>
          <div className="flex items-center space-x-4">
            <span className="hidden md:inline">
              Olá, {session?.user?.name || "Jogador"}
            </span>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 rounded border border-white text-sm hover:bg-blue-700 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Card */}
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
                <span className="font-medium">Saldo:</span> R$ 100,00
              </p>
            </div>
            <div className="mt-4">
              <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
                Adicionar Saldo
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
            <div className="space-y-3">
              <Link
                href="/rooms/create"
                className="block w-full bg-blue-600 text-white text-center py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Criar Nova Sala
              </Link>
              <Link
                href="/rooms/join"
                className="block w-full bg-green-600 text-white text-center py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Entrar em uma Sala
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Estatísticas</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-md text-center">
                <span className="block text-2xl font-bold">0</span>
                <span className="text-sm text-gray-600">Jogos Ganhos</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-md text-center">
                <span className="block text-2xl font-bold">0</span>
                <span className="text-sm text-gray-600">Jogos Jogados</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-md text-center">
                <span className="block text-2xl font-bold">R$ 0</span>
                <span className="text-sm text-gray-600">Ganhos Totais</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-md text-center">
                <span className="block text-2xl font-bold">{rooms.length}</span>
                <span className="text-sm text-gray-600">Salas Criadas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Your Rooms */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Suas Salas</h2>
          {isLoading ? (
            <p className="text-center py-4">Carregando suas salas...</p>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : rooms.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 px-4 py-6 rounded text-center">
              <p className="mb-3">Você ainda não criou nenhuma sala.</p>
              <Link
                href="/rooms/create"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Criar Sua Primeira Sala
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rodadas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rooms.map((room) => (
                    <tr key={room.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {room.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-bold text-gray-900">
                          {room.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          R$ {room.entryFee.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {room.roundCount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${
                              room.status === "waiting"
                                ? "bg-yellow-100 text-yellow-800"
                                : room.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {room.status === "waiting"
                            ? "Aguardando"
                            : room.status === "active"
                            ? "Ativo"
                            : "Finalizado"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        <Link
                          href={`/rooms/${room.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Entrar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
