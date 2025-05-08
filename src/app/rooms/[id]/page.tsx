"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";
import Link from "next/link";

type Participant = {
  id: string;
  userId: string;
  roomId: string;
  user: {
    id: string;
    name: string;
  };
};

type Room = {
  id: string;
  name: string;
  code: string;
  entryFee: number;
  hostId: string;
  status: string;
  roundCount: number;
};

type Card = {
  id: string;
  participantId: string;
  roundId: string;
  numbers: number[][];
  markedNumbers: number[];
};

export default function RoomPage() {
  const router = useRouter();
  const { id } = useParams();
  const { data: session, status } = useSession();
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [lastDrawnNumber, setLastDrawnNumber] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [socket, setSocket] = useState<any | null>(null);
  const [gameInProgress, setGameInProgress] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [winner, setWinner] = useState<{
    userId: string;
    userName: string;
    pattern: string;
  } | null>(null);

  // Redirecionamento se não estiver autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Função para buscar dados da sala
  const fetchRoomData = async () => {
    if (status !== "authenticated" || !id) return;

    try {
      const response = await fetch(`/api/rooms/${id}`);

      if (!response.ok) {
        throw new Error("Falha ao carregar dados da sala");
      }

      const data = await response.json();
      setRoom(data.room);
      setParticipants(data.participants);
      setIsHost(data.room.hostId === session?.user?.id);

      if (data.cards && data.cards.length > 0) {
        setCards(
          data.cards.map((card: any) => ({
            ...card,
            numbers: JSON.parse(card.numbers),
            markedNumbers: JSON.parse(card.markedNumbers),
          }))
        );
      }

      if (data.currentRound) {
        setCurrentRound(data.currentRound.number);
        setDrawnNumbers(JSON.parse(data.currentRound.drawnNumbers));

        if (data.currentRound.status === "active") {
          setGameInProgress(true);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados da sala inicialmente
  useEffect(() => {
    fetchRoomData();
  }, [id, status, session?.user?.id]);

  // Inicializar socket
  useEffect(() => {
    if (status !== "authenticated" || !id || !room?.code) return;

    const socketInit = async () => {
      try {
        // Inicializar o endpoint do socket primeiro
        const socketResponse = await fetch("/api/socket");
        const socketData = await socketResponse.json();

        if (!socketResponse.ok) {
          throw new Error("Falha ao inicializar o socket");
        }

        // Usar o socket.io-client para conectar ao servidor independente
        const socketIO = io(socketData.socketUrl, {
          transports: ["websocket", "polling"],
        });

        setSocket(socketIO);

        // Configurar eventos do socket
        socketIO.on("connect", () => {
          console.log("Socket conectado ao servidor:", socketIO.id);
          // Entrar na sala do socket
          socketIO.emit("join-room", room.code, session?.user?.id);
        });

        socketIO.on("user-joined", (userId) => {
          console.log(`Usuário ${userId} entrou na sala`);
          // Recarregar lista de participantes
          fetchRoomData();
        });

        socketIO.on("game-started", () => {
          setGameInProgress(true);
          // Iniciar contagem regressiva
          setCountdown(5);
        });

        socketIO.on("new-number", (number, allNumbers) => {
          setLastDrawnNumber(number);
          setDrawnNumbers(allNumbers);
        });

        socketIO.on("bingo-verification", (userId, cardId, pattern) => {
          console.log(
            `Verificando bingo para usuário ${userId}, cartela ${cardId}`
          );
          // Apenas o host verifica o bingo
          if (isHost) {
            verifyBingo(userId, cardId, pattern);
          }
        });

        socketIO.on("bingo-confirmed", (userId, isValid, pattern) => {
          if (isValid) {
            // Encontrar nome do usuário
            const winnerUser = participants.find((p) => p.userId === userId);
            if (winnerUser) {
              setWinner({
                userId,
                userName: winnerUser.user.name,
                pattern: pattern || "any",
              });
            }
          }
        });

        socketIO.on("round-complete", (winnerId) => {
          console.log(`Rodada finalizada. Vencedor: ${winnerId}`);
        });

        socketIO.on("game-complete", () => {
          console.log("Jogo finalizado");
          setGameInProgress(false);
        });

        return () => {
          socketIO.off("connect");
          socketIO.off("user-joined");
          socketIO.off("game-started");
          socketIO.off("new-number");
          socketIO.off("bingo-verification");
          socketIO.off("bingo-confirmed");
          socketIO.off("round-complete");
          socketIO.off("game-complete");
          socketIO.disconnect();
        };
      } catch (error) {
        console.error("Erro ao inicializar socket:", error);
        setError("Falha ao conectar ao servidor. Tente novamente mais tarde.");
      }
    };

    socketInit();
  }, [status, id, room?.code, session?.user?.id, isHost, participants]);

  // Contagem regressiva
  useEffect(() => {
    if (countdown === null) return;

    if (countdown <= 0) {
      setCountdown(null);

      // Se for o host, sortear o primeiro número
      if (isHost && gameInProgress) {
        drawNumber();
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isHost, gameInProgress]);

  // Verificar bingo (função para o host)
  const verifyBingo = async (
    userId: string,
    cardId: string,
    pattern: string
  ) => {
    try {
      const response = await fetch(`/api/rooms/${id}/verify-bingo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, cardId, pattern }),
      });

      const data = await response.json();

      // Emitir resultado da verificação
      if (socket) {
        socket.emit(
          "bingo-result",
          room?.code,
          userId,
          data.isWinner,
          data.winningPattern
        );
      }

      // Se for vencedor, finalizar a rodada
      if (data.isWinner) {
        socket?.emit("round-ended", room?.code, userId);

        // Verificar se é a última rodada
        if (currentRound >= (room?.roundCount || 1)) {
          socket?.emit("game-ended", room?.code);
        } else {
          // Preparar próxima rodada
          setCurrentRound((prev) => prev + 1);
          setDrawnNumbers([]);
          setLastDrawnNumber(null);
          setWinner(null);
        }
      }
    } catch (err) {
      console.error("Erro ao verificar bingo:", err);
    }
  };

  // Sortear número (função para o host)
  const drawNumber = async () => {
    if (!isHost || !gameInProgress) return;

    try {
      const response = await fetch(`/api/rooms/${id}/draw-number`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roundId: currentRound }),
      });

      const data = await response.json();

      // Emitir número sorteado para todos os jogadores
      if (socket) {
        socket.emit(
          "number-drawn",
          room?.code,
          data.drawnNumber,
          data.allDrawnNumbers
        );
      }
    } catch (err) {
      console.error("Erro ao sortear número:", err);
    }
  };

  // Iniciar jogo (função para o host)
  const startGame = async () => {
    if (!isHost) return;

    try {
      const response = await fetch(`/api/rooms/${id}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Falha ao iniciar o jogo");
      }

      // Emitir início do jogo para todos os jogadores
      if (socket) {
        socket.emit("start-game", room?.code);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Chamada de bingo
  const callBingo = (cardId: string) => {
    if (!socket || !gameInProgress) return;

    // Emitir chamada de bingo para verificação
    socket.emit("bingo-called", room?.code, session?.user?.id, cardId, "any");
  };

  if (status === "loading" || isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-lg w-full">
          {error}
        </div>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Voltar ao Painel
        </Link>
      </div>
    );
  }

  if (!room) {
    return <div className="p-8 text-center">Sala não encontrada</div>;
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-blue-800 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{room.name}</h1>
            <p className="text-sm">
              Código: <span className="font-mono font-bold">{room.code}</span>
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-3 py-1 rounded border border-white text-sm hover:bg-blue-700 transition-colors"
          >
            Sair da Sala
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-6 px-4">
        <div>
          {/* Conteúdo da sala */}
          <p>Total de jogadores: {participants.length}</p>

          {isHost && !gameInProgress && (
            <button
              onClick={startGame}
              className="mt-4 bg-green-600 text-white py-2 px-4 rounded"
            >
              Iniciar Jogo
            </button>
          )}

          {gameInProgress && (
            <div className="mt-4">
              <p>Jogo em andamento - Rodada {currentRound}</p>
              {lastDrawnNumber && (
                <p className="text-2xl font-bold">
                  Último número: {lastDrawnNumber}
                </p>
              )}
            </div>
          )}

          {cards.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-bold">Suas cartelas</h2>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card) => (
                  <div key={card.id} className="border p-4 rounded bg-white">
                    <div className="grid grid-cols-5 gap-2">
                      {card.numbers.map((row, rowIndex) =>
                        row.map((number, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`
                              w-10 h-10 flex items-center justify-center border rounded
                              ${
                                drawnNumbers.includes(number)
                                  ? "bg-green-200"
                                  : "bg-white"
                              }
                            `}
                          >
                            {number}
                          </div>
                        ))
                      )}
                    </div>

                    {gameInProgress && (
                      <button
                        onClick={() => callBingo(card.id)}
                        className="mt-4 bg-red-600 text-white py-1 px-3 rounded text-sm"
                      >
                        BINGO!
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {winner && (
            <div className="mt-6 p-4 bg-yellow-100 border border-yellow-400 rounded">
              <h3 className="text-lg font-bold">Temos um vencedor!</h3>
              <p>
                {winner.userName} completou o padrão: {winner.pattern}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
