import { NextRequest } from "next/server";
import { initSocketServer } from "@/lib/socket";
import { NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Inicializar o servidor Socket.IO (vai rodar na porta 3001)
    await initSocketServer();

    // Retornar informação sobre o servidor para o cliente
    return NextResponse.json({
      success: true,
      socketUrl: "http://localhost:3001",
    });
  } catch (error) {
    console.error("Socket initialization error:", error);
    return NextResponse.json(
      { error: "Falha ao inicializar a conexão do socket" },
      { status: 500 }
    );
  }
}
