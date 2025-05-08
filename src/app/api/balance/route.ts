import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserService } from "@/services/UserService";

// Get user balance
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Você precisa estar logado para ver seu saldo" },
        { status: 401 }
      );
    }

    const user = await UserService.getUserById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Você precisa estar logado para adicionar saldo" },
        { status: 401 }
      );
    }

    const { amount } = await req.json();

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Valor inválido para adicionar ao saldo" },
        { status: 400 }
      );
    }

    // Em uma aplicação real, aqui seria o lugar para integrar
    // com um gateway de pagamento como PayPal, Stripe, etc.

    // Para este exemplo, simplesmente adicionamos o valor solicitado
    const user = await UserService.updateBalance(session.user.id, amount);

    return NextResponse.json(
      {
        message: "Saldo adicionado com sucesso",
        balance: user.balance,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao adicionar saldo:", error);
    return NextResponse.json(
      { error: "Falha ao adicionar saldo" },
      { status: 500 }
    );
  }
}
