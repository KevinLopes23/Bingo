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
      console.error("Usuário não autenticado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: roomId } = await params;
    console.log(
      "Iniciando jogo na sala:",
      roomId,
      "por usuário:",
      session.user.id
    );

    // Get room details
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      console.error("Sala não encontrada");
      return NextResponse.json(
        { error: "Sala não encontrada" },
        { status: 404 }
      );
    }

    // Check if user is the host
    if (room.hostId !== session.user.id) {
      console.error("Usuário não é o anfitrião");
      return NextResponse.json(
        { error: "Apenas o anfitrião pode iniciar o jogo" },
        { status: 403 }
      );
    }

    // Check if the room is in waiting status
    if (room.status !== "waiting") {
      console.error("Sala não está aguardando, status:", room.status);
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
      console.error("Menos de 1 participante na sala");
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
      { error: error?.message || "Falha ao iniciar o jogo" },
      { status: 500 }
    );
  }
}
