import { NextRequest, NextResponse } from "next/server";
import { RoomService } from "@/services/RoomService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Você precisa estar logado para entrar em uma sala" },
        { status: 401 }
      );
    }

    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: "Código da sala é obrigatório" },
        { status: 400 }
      );
    }

    // Find room by code
    const room = await RoomService.getRoomByCode(code);

    if (!room) {
      return NextResponse.json(
        { error: "Sala não encontrada" },
        { status: 404 }
      );
    }

    if (room.status !== "waiting") {
      return NextResponse.json(
        { error: "Esta sala já está em jogo ou foi finalizada" },
        { status: 400 }
      );
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.participant.findFirst({
      where: {
        userId: session.user.id,
        roomId: room.id,
      },
    });

    if (existingParticipant) {
      return NextResponse.json(
        { error: "Você já está nesta sala", roomId: room.id },
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
    const participant = await prisma.participant.create({
      data: {
        userId: session.user.id,
        roomId: room.id,
      },
    });

    return NextResponse.json(
      {
        message: "Você entrou na sala com sucesso",
        roomId: room.id,
        participantId: participant.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao entrar na sala:", error);
    return NextResponse.json(
      { error: "Falha ao entrar na sala" },
      { status: 500 }
    );
  }
}
