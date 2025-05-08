import { Server as SocketIOServer } from "socket.io";

// Instância global do servidor Socket.IO
let io: SocketIOServer | null = null;

// Inicializa o servidor Socket.IO
export const initSocketServer = async () => {
  // Retorna a instância existente se já estiver inicializada
  if (io) return io;

  console.log("Inicializando servidor Socket.IO...");

  // Cria um novo servidor Socket.IO que escuta na porta 3001
  io = new SocketIOServer({
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // Configure os eventos do socket
  io.on("connection", (socket) => {
    console.log("Socket conectado:", socket.id);

    // Join a room
    socket.on("join-room", (roomCode: string, userId: string) => {
      console.log(`Usuário ${userId} entrando na sala ${roomCode}`);
      socket.join(roomCode);
      socket.to(roomCode).emit("user-joined", userId);
    });

    // Leave a room
    socket.on("leave-room", (roomCode: string, userId: string) => {
      socket.leave(roomCode);
      socket.to(roomCode).emit("user-left", userId);
    });

    // Host starts game
    socket.on("start-game", (roomCode: string) => {
      console.log(`Iniciando jogo na sala ${roomCode}`);
      io?.to(roomCode).emit("game-started");
    });

    // Number drawn
    socket.on(
      "number-drawn",
      (roomCode: string, number: number, allNumbers: number[]) => {
        console.log(`Número sorteado na sala ${roomCode}: ${number}`);
        io?.to(roomCode).emit("new-number", number, allNumbers);
      }
    );

    // Player calls bingo
    socket.on(
      "bingo-called",
      (roomCode: string, userId: string, cardId: string, pattern: string) => {
        console.log(`Usuário ${userId} chamou BINGO na sala ${roomCode}`);
        io?.to(roomCode).emit("bingo-verification", userId, cardId, pattern);
      }
    );

    // Bingo verification result
    socket.on(
      "bingo-result",
      (
        roomCode: string,
        userId: string,
        isValid: boolean,
        pattern?: string
      ) => {
        console.log(
          `Resultado do BINGO na sala ${roomCode}: ${
            isValid ? "válido" : "inválido"
          }`
        );
        io?.to(roomCode).emit("bingo-confirmed", userId, isValid, pattern);
      }
    );

    // Round ended
    socket.on("round-ended", (roomCode: string, winnerId: string) => {
      console.log(
        `Rodada finalizada na sala ${roomCode}. Vencedor: ${winnerId}`
      );
      io?.to(roomCode).emit("round-complete", winnerId);
    });

    // Game ended
    socket.on("game-ended", (roomCode: string) => {
      console.log(`Jogo finalizado na sala ${roomCode}`);
      io?.to(roomCode).emit("game-complete");
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("Socket desconectado:", socket.id);
    });
  });

  // Inicia o servidor na porta 3001 (diferente da porta do Next.js)
  try {
    io.listen(3001);
    console.log("Servidor Socket.IO iniciado na porta 3001");
  } catch (error) {
    console.error("Erro ao iniciar servidor Socket.IO:", error);
    io = null;
    throw error;
  }

  return io;
};

// Obtém a instância do servidor Socket.IO
export const getSocketIO = () => {
  if (!io) {
    throw new Error("Socket.IO não foi inicializado");
  }
  return io;
};
