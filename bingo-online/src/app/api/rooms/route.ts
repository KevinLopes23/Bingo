import { NextRequest, NextResponse } from "next/server";
import { RoomService } from "@/services/RoomService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Create a room
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Você precisa estar logado para criar uma sala" },
        { status: 401 }
      );
    }

    const { name, entryFee, roundCount } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Nome da sala é obrigatório" },
        { status: 400 }
      );
    }

    const room = await RoomService.createRoom(
      session.user.id,
      name,
      entryFee || 0,
      roundCount || 1
    );

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar sala:", error);
    return NextResponse.json({ error: "Falha ao criar sala" }, { status: 500 });
  }
}

// Get rooms for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Você precisa estar logado para ver suas salas" },
        { status: 401 }
      );
    }

    const rooms = await RoomService.getRoomsHostedByUser(session.user.id);

    return NextResponse.json(rooms, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar salas:", error);
    return NextResponse.json(
      { error: "Falha ao buscar salas" },
      { status: 500 }
    );
  }
}
