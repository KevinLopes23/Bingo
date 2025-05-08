import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { GameService } from "@/services/GameService";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Extrair o ID da sala corretamente no Next.js 15
    const { id: roomId } = await params;

    // Get room details
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Sala não encontrada" },
        { status: 404 }
      );
    }

    // Check if user is the host
    if (room.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Apenas o anfitrião pode verificar bingos" },
        { status: 403 }
      );
    }

    // Check if the room is in active status
    if (room.status !== "active") {
      return NextResponse.json(
        { error: "Esta sala não está em jogo" },
        { status: 400 }
      );
    }

    const { userId, cardId, pattern } = await req.json();

    if (!userId || !cardId) {
      return NextResponse.json(
        { error: "Dados de verificação incompletos" },
        { status: 400 }
      );
    }

    // Verificar se o cartão é válido e pertence ao usuário que chamou bingo
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        participant: true,
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Cartela não encontrada" },
        { status: 404 }
      );
    }

    if (card.participant.userId !== userId) {
      return NextResponse.json(
        { error: "Esta cartela não pertence ao usuário" },
        { status: 403 }
      );
    }

    // Verificar se o bingo é válido
    const result = await GameService.checkBingo(cardId, pattern);

    // Se for vencedor, transferir o prêmio
    let premio = 0;
    if (result.isWinner) {
      // Calcular prêmio: 90% do valor arrecadado
      const participantes = await prisma.participant.count({
        where: { roomId },
      });
      premio = Math.floor(room.entryFee * participantes * 0.9);
      await prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: premio } },
      });
    }

    return NextResponse.json({ ...result, premio });
  } catch (error) {
    console.error("Erro ao verificar bingo:", error);
    return NextResponse.json(
      { error: "Falha ao verificar bingo" },
      { status: 500 }
    );
  }
}
