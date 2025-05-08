"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function JoinRoom() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirecionamento se não estiver autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!code.trim()) {
      setError("Por favor, informe o código da sala");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao entrar na sala");
      }

      // Entrada na sala bem-sucedida, redireciona para a página da sala
      router.push(`/rooms/${data.roomId}`);
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
          <h1 className="text-3xl font-bold text-blue-800">
            Entrar em uma Sala
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Digite o código de convite da sala
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700"
            >
              Código da Sala
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              className="mt-1 block w-full text-center text-2xl font-bold tracking-wider px-3 py-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 uppercase"
              placeholder="XXXXXX"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? "Entrando..." : "Entrar na Sala"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Quer criar sua própria sala?{" "}
            <Link
              href="/rooms/create"
              className="text-blue-600 hover:underline"
            >
              Criar Sala
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
