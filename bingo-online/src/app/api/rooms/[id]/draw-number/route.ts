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
        { error: "Apenas o anfitrião pode sortear números" },
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

    // Get the current round
    const round = await prisma.round.findFirst({
      where: {
        roomId,
        status: "active",
      },
      orderBy: {
        number: "desc",
      },
    });

    if (!round) {
      return NextResponse.json(
        { error: "Nenhuma rodada ativa encontrada" },
        { status: 400 }
      );
    }

    // Draw a number
    const result = await GameService.drawNumber(round.id);
    if (!result) {
      return NextResponse.json({ finished: true });
    }
    const { drawnNumber, allDrawnNumbers } = result;

    // Now we need to mark this number on all cards
    const cards = await prisma.card.findMany({
      where: { roundId: round.id },
    });

    for (const card of cards) {
      await GameService.markNumberOnCard(card.id, drawnNumber);
    }

    return NextResponse.json({
      drawnNumber,
      allDrawnNumbers,
    });
  } catch (error) {
    console.error("Erro ao sortear número:", error);
    return NextResponse.json(
      { error: "Falha ao sortear número" },
      { status: 500 }
    );
  }
}
