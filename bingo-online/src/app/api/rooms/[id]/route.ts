import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { GameService } from "@/services/GameService";

const prisma = new PrismaClient();

// Get room details
export async function GET(
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

    // Get participants
    const participants = await prisma.participant.findMany({
      where: { roomId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Check if user is a participant
    const isParticipant = participants.some(
      (p) => p.userId === session.user.id
    );
    const isHost = room.hostId === session.user.id;

    if (!isParticipant && !isHost) {
      // If not already a participant and not the host, join the room
      if (room.status !== "waiting") {
        return NextResponse.json(
          { error: "Esta sala já está em jogo ou foi finalizada" },
          { status: 400 }
        );
      }

      // Check if user has enough balance
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user || user.balance < room.entryFee) {
        return NextResponse.json(
          { error: "Saldo insuficiente para entrar nesta sala" },
          { status: 400 }
        );
      }

      // Deduct entry fee
      await prisma.user.update({
        where: { id: session.user.id },
        data: { balance: { decrement: room.entryFee } },
      });

      // Create participant
      await prisma.participant.create({
        data: {
          userId: session.user.id,
          roomId,
        },
      });

      // Refresh participants list
      const updatedParticipants = await prisma.participant.findMany({
        where: { roomId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      participants.push(
        ...updatedParticipants.filter((p) => p.userId === session.user.id)
      );
    }

    // Get current round if game is active
    let currentRound = null;
    if (room.status === "active") {
      currentRound = await prisma.round.findFirst({
        where: {
          roomId,
          status: "active",
        },
        orderBy: {
          number: "desc",
        },
      });
    }

    // Get participant's cards for current round
    let cards = [];
    const participant = participants.find((p) => p.userId === session.user.id);

    if (participant && currentRound) {
      cards = await GameService.getParticipantCardsForRound(
        participant.id,
        currentRound.id
      );
    }

    return NextResponse.json({
      room,
      participants,
      currentRound,
      cards,
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes da sala:", error);
    return NextResponse.json(
      { error: "Falha ao buscar detalhes da sala" },
      { status: 500 }
    );
  }
}
