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

    const roomId = await params.id;

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
        { error: "Apenas o anfitrião pode iniciar o jogo" },
        { status: 403 }
      );
    }

    // Check if the room is in waiting status
    if (room.status !== "waiting") {
      return NextResponse.json(
        { error: "Esta sala já está em jogo ou foi finalizada" },
        { status: 400 }
      );
    }

    // Get participants
    const participants = await prisma.participant.findMany({
      where: { roomId },
    });

    if (participants.length < 1) {
      return NextResponse.json(
        { error: "É necessário pelo menos 1 jogador para iniciar o jogo" },
        { status: 400 }
      );
    }

    // Update room status to active
    await prisma.room.update({
      where: { id: roomId },
      data: { status: "active" },
    });

    // Create the first round
    const round = await GameService.startRound(roomId, 1);

    // Generate cards for all participants
    for (const participant of participants) {
      await GameService.generateCardForParticipant(participant.id, round.id);
    }

    return NextResponse.json({
      message: "Jogo iniciado com sucesso",
      roundId: round.id,
    });
  } catch (error) {
    console.error("Erro ao iniciar jogo:", error);
    return NextResponse.json(
      { error: "Falha ao iniciar o jogo" },
      { status: 500 }
    );
  }
}
