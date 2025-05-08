"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import BingoCard from "@/components/BingoCard";

interface Room {
  id: string;
  name: string;
  code: string;
  entryFee: number;
  roundCount: number;
  status: string;
  hostId: string;
  createdAt: string;
}

interface Participant {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
  };
}

interface Card {
  id: string;
  numbers: number[];
  markedNumbers: number[];
}

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameInProgress, setGameInProgress] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [winner, setWinner] = useState<{
    userId: string;
    userName: string;
    pattern: string;
    premio?: number;
  } | null>(null);
  const [drawError, setDrawError] = useState(false);
  const [roundFinished, setRoundFinished] = useState(false);
  const isFetchingRef = useRef(false);

  // Redirecionamento se não estiver autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Função para buscar dados da sala - agora definida fora dos useEffect como uma função do componente
  const fetchRoomData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (status !== "authenticated" || !id) return;
      const response = await fetch(`/api/rooms/${id}`);
      if (!response.ok) throw new Error("Falha ao carregar dados da sala");
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
      // Apenas loga o erro
      console.error("Erro ao buscar dados da sala:", err);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [id, status, session?.user?.id]);

  // Polling a cada 10 segundos
  useEffect(() => {
    fetchRoomData(); // Chama uma vez ao montar
    const interval = setInterval(() => {
      fetchRoomData();
    }, 10000); // 10 segundos
    return () => clearInterval(interval);
  }, [fetchRoomData]);

  // Inicializar socket
  useEffect(() => {
    if (status !== "authenticated" || !id || !room?.code) return;

    let socketRetryCount = 0;
    const maxSocketRetries = 5;

    const socketInit = async (retryCount = 0) => {
      try {
        const socketResponse = await fetch("/api/socket");
        if (!socketResponse.ok)
          throw new Error("Falha ao inicializar o socket");
        const socketData = await socketResponse.json();
        const socketIO = io(socketData.socketUrl);
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

        socketIO.on("bingo-confirmed", (userId, isValid, pattern, premio) => {
          if (isValid) {
            // Encontrar nome do usuário
            const winnerUser = participants.find((p) => p.userId === userId);
            if (winnerUser) {
              setWinner({
                userId,
                userName: winnerUser.user.name,
                pattern: pattern || "any",
                premio: premio || 0,
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
      } catch (error) {
        console.error(
          "Erro ao inicializar socket (tentando novamente em 5s):",
          error
        );
        socketRetryCount++;
        if (retryCount < maxSocketRetries) {
          setTimeout(() => socketInit(retryCount + 1), 5000);
        } else {
          setError(
            "Falha ao conectar ao servidor de jogo. Tente recarregar a página."
          );
        }
      }
    };

    socketInit();

    // Cleanup function
    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("user-joined");
        socket.off("game-started");
        socket.off("new-number");
        socket.off("bingo-verification");
        socket.off("bingo-confirmed");
        socket.off("round-complete");
        socket.off("game-complete");
        socket.disconnect();
        console.log("Socket desconectado pelo cleanup");
      }
    };
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
      if (!response.ok) throw new Error("Erro ao sortear número");
      const data = await response.json();
      if (data.finished) {
        setRoundFinished(true);
        setGameInProgress(false);
        return;
      }
      if (socket) {
        socket.emit(
          "number-drawn",
          room?.code,
          data.drawnNumber,
          data.allDrawnNumbers
        );
      }
    } catch (err) {
      // Apenas loga o erro, não exibe para o usuário, deixa o próximo ciclo tentar novamente
      console.error(
        "Erro ao sortear número (tentando novamente no próximo ciclo):",
        err
      );
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

  // Sorteio automático para o host
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isHost && gameInProgress && !winner) {
      interval = setInterval(() => {
        drawNumber();
      }, 5000); // 5 segundos
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHost, gameInProgress, winner]);

  // Limpar erro ao reiniciar jogo
  useEffect(() => {
    if (!gameInProgress) setDrawError(false);
  }, [gameInProgress]);

  // Limpar roundFinished ao iniciar nova rodada
  useEffect(() => {
    if (gameInProgress) setRoundFinished(false);
  }, [gameInProgress]);

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
      {/* Header */}
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Game Status */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Status do Jogo</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
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
                    ? "Em Andamento"
                    : "Finalizado"}
                </span>
              </div>

              {isHost && room.status === "waiting" && (
                <button
                  onClick={startGame}
                  className="w-full py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 mb-4"
                >
                  Iniciar Jogo
                </button>
              )}

              {gameInProgress && (
                <>
                  <div className="flex flex-col items-center justify-center mb-4">
                    <p className="text-lg mb-2">
                      Rodada {currentRound} de {room.roundCount}
                    </p>

                    {countdown !== null ? (
                      <div className="text-center mb-4">
                        <p className="text-lg">O jogo começa em:</p>
                        <span className="text-5xl font-bold">{countdown}</span>
                      </div>
                    ) : (
                      <>
                        <div className="bg-blue-700 text-white rounded-full w-20 h-20 flex items-center justify-center mb-2">
                          <span className="text-4xl font-bold">
                            {lastDrawnNumber || "-"}
                          </span>
                        </div>
                        <p className="text-sm">Último número sorteado</p>

                        {isHost && !winner && (
                          <button
                            onClick={drawNumber}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Sortear Número
                          </button>
                        )}

                        {winner && (
                          <div className="mt-4 bg-green-100 text-green-800 px-4 py-2 rounded text-center">
                            <p className="font-bold">
                              {winner.userName} ganhou com um{" "}
                              {winner.pattern === "row"
                                ? "linha"
                                : winner.pattern === "column"
                                ? "coluna"
                                : winner.pattern === "diagonal"
                                ? "diagonal"
                                : winner.pattern === "full"
                                ? "cartela cheia"
                                : "bingo"}
                              !
                            </p>
                            {typeof winner.premio === "number" &&
                              winner.premio > 0 && (
                                <p className="text-lg font-bold mt-2">
                                  Prêmio: R$ {winner.premio.toFixed(2)}
                                </p>
                              )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-2">
                      Números Sorteados:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {drawnNumbers.map((num) => (
                        <span
                          key={num}
                          className="inline-block w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bingo Card */}
            {cards.length > 0 && (
              <div className="mb-6">
                <BingoCard
                  cardId={cards[0].id}
                  numbers={cards[0].numbers}
                  markedNumbers={cards[0].markedNumbers}
                  onBingo={() => callBingo(cards[0].id)}
                />
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div>
            {/* Participants */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">
                Participantes ({participants.length})
              </h2>
              <ul className="space-y-2">
                {participants.map((participant) => (
                  <li
                    key={participant.id}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {participant.user.name}
                      {participant.userId === room.hostId && (
                        <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Host
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Game Info */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Informações do Jogo
              </h2>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">Valor de Entrada:</span>
                  <span className="font-medium">
                    R$ {room.entryFee.toFixed(2)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Rodadas:</span>
                  <span className="font-medium">{room.roundCount}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Prêmio Total:</span>
                  <span className="font-medium">
                    R$ {(room.entryFee * participants.length * 0.9).toFixed(2)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Taxa da Plataforma:</span>
                  <span className="font-medium">
                    R$ {(room.entryFee * participants.length * 0.1).toFixed(2)}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {roundFinished && (
          <div className="mt-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded text-center">
            Rodada finalizada! Todos os números foram sorteados.
          </div>
        )}
      </main>
    </div>
  );
}
