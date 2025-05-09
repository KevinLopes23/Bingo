import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  const session = await request.session;
  const roomId = request.params.roomId;

  // Check if user has enough balance
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      balance: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );
  }

  if (user.balance < room.entryFee) {
    return NextResponse.json(
      { error: "Saldo insuficiente para entrar nesta sala" },
      { status: 400 }
    );
  }

  // Deduct entry fee and create participant in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Deduct entry fee
    const updatedUser = await tx.user.update({
      where: { id: session.user.id },
      data: { balance: { decrement: room.entryFee } },
      select: { balance: true },
    });

    // Create participant
    const participant = await tx.participant.create({
      data: {
        userId: session.user.id,
        roomId: room.id,
      },
    });

    return { participant, newBalance: updatedUser.balance };
  });

  return NextResponse.json(
    {
      message: "Você entrou na sala com sucesso",
      roomId: room.id,
      participantId: result.participant.id,
      newBalance: result.newBalance,
    },
    { status: 200 }
  );
}
