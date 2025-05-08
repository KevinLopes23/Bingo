import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;
let isInitializing = false;

export const initSocketServer = async () => {
  if (io) return io;
  if (isInitializing) {
    // Aguardar até que a inicialização termine
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!isInitializing) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
    });
    return io;
  }

  try {
    isInitializing = true;

    // Criar um servidor HTTP independente do Next.js
    io = new SocketIOServer({
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Configurar os eventos do socket
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

    // Iniciar o servidor na porta 3001 (diferente da porta do Next.js)
    await new Promise<void>((resolve) => {
      io?.listen(3001);
      console.log("Servidor Socket.IO iniciado na porta 3001");
      resolve();
    });

    return io;
  } catch (error) {
    console.error("Erro ao inicializar o servidor socket:", error);
    throw error;
  } finally {
    isInitializing = false;
  }
};

export const getSocketIO = () => {
  if (!io) {
    throw new Error("Socket.IO não foi inicializado");
  }
  return io;
};
