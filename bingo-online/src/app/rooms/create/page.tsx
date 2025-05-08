"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function CreateRoom() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    entryFee: "0",
    roundCount: "1",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirecionamento se não estiver autenticado
  if (status === "loading") {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          entryFee: parseFloat(formData.entryFee),
          roundCount: parseInt(formData.roundCount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar sala");
      }

      // Sala criada com sucesso, redireciona para a página da sala
      router.push(`/rooms/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center p-6 bg-gradient-to-b from-blue-800 to-blue-600">
      <nav className="w-full max-w-4xl py-4 px-2 mb-8">
        <Link href="/dashboard" className="text-white hover:underline">
          &larr; Voltar ao Painel
        </Link>
      </nav>

      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-800">Criar Sala</h1>
          <p className="mt-2 text-sm text-gray-600">
            Configure sua sala de bingo
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Nome da Sala
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Bingo da Família"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label
                htmlFor="entryFee"
                className="block text-sm font-medium text-gray-700"
              >
                Valor de Entrada (R$)
              </label>
              <input
                id="entryFee"
                name="entryFee"
                type="number"
                step="0.01"
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.entryFee}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">
                Defina 0 para jogos gratuitos
              </p>
            </div>

            <div>
              <label
                htmlFor="roundCount"
                className="block text-sm font-medium text-gray-700"
              >
                Número de Rodadas
              </label>
              <select
                id="roundCount"
                name="roundCount"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.roundCount}
                onChange={handleChange}
              >
                <option value="1">1 rodada</option>
                <option value="3">3 rodadas</option>
                <option value="5">5 rodadas</option>
                <option value="10">10 rodadas</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? "Criando..." : "Criar Sala"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
