import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserService } from "@/services/UserService";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get user balance
export async function GET(req: NextRequest) {
  try {
    console.log("GET /api/balance - Iniciando requisição");
    const session = await getServerSession(authOptions);
    console.log("Sessão:", session?.user?.id);

    if (!session?.user?.id) {
      console.log("Usuário não autenticado");
      return NextResponse.json(
        { error: "Você precisa estar logado para ver seu saldo" },
        { status: 401 }
      );
    }

    const user = await UserService.getUserById(session.user.id);
    console.log("Usuário encontrado:", user?.id);

    if (!user) {
      console.log("Usuário não encontrado");
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    console.log("Saldo atual:", user.balance);
    return NextResponse.json({ balance: user.balance }, { status: 200 });
  } catch (error) {
    console.error("Erro ao obter saldo:", error);
    return NextResponse.json(
      { error: "Falha ao obter saldo" },
      { status: 500 }
    );
  }
}

// Add balance
export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/balance - Iniciando requisição");
    const session = await getServerSession(authOptions);
    console.log("Sessão:", session?.user?.id);

    if (!session?.user?.id) {
      console.log("Usuário não autenticado");
      return NextResponse.json(
        { error: "Você precisa estar logado para adicionar saldo" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("Corpo da requisição:", body);
    const { amount } = body;

    if (!amount || isNaN(amount) || amount <= 0) {
      console.log("Valor inválido:", amount);
      return NextResponse.json(
        { error: "Valor inválido para adicionar ao saldo" },
        { status: 400 }
      );
    }

    console.log("Iniciando transação para adicionar saldo");
    // Atualizar saldo em uma transação
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { balance: true },
      });

      if (!user) {
        console.log("Usuário não encontrado na transação");
        throw new Error("Usuário não encontrado");
      }

      console.log("Saldo atual:", user.balance);
      console.log("Valor a ser adicionado:", amount);

      const updated = await tx.user.update({
        where: { id: session.user.id },
        data: { balance: { increment: amount } },
        select: { balance: true },
      });

      console.log("Novo saldo:", updated.balance);
      return updated;
    });

    console.log("Transação concluída com sucesso");
    return NextResponse.json(
      {
        message: "Saldo adicionado com sucesso",
        balance: updatedUser.balance,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao adicionar saldo:", error);
    return NextResponse.json(
      { error: error.message || "Falha ao adicionar saldo" },
      { status: 500 }
    );
  }
}
