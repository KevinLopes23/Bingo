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

    // Usar o params.id com await - no Next.js 15, precisamos usar await em params
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

    // ... rest of the existing code ...
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao obter detalhes da sala" },
      { status: 500 }
    );
  }
}
