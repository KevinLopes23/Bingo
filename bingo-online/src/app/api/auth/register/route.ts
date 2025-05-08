import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/UserService";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const user = await UserService.register(name, email, password);

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        message: "Usuário registrado com sucesso",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro ao registrar usuário:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email já está em uso" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Falha ao registrar usuário" },
      { status: 500 }
    );
  }
}
