import { PrismaClient, Room } from "@prisma/client";
import { generateRoomCode } from "../utils/helpers";

const prisma = new PrismaClient();

export class RoomService {
  static async createRoom(
    hostId: string,
    name: string,
    entryFee: number,
    roundCount: number
  ): Promise<Room> {
    const code = await generateRoomCode();

    const room = await prisma.room.create({
      data: {
        name,
        code,
        entryFee,
        roundCount,
        hostId,
        status: "waiting",
      },
    });

    await prisma.participant.create({
      data: {
        userId: hostId,
        roomId: room.id,
      },
    });

    return room;
  }

  static async getRoomByCode(code: string): Promise<Room | null> {
    return prisma.room.findUnique({
      where: { code },
    });
  }

  static async getRoomById(id: string): Promise<Room | null> {
    return prisma.room.findUnique({
      where: { id },
    });
  }

  static async updateRoomStatus(roomId: string, status: string): Promise<Room> {
    return prisma.room.update({
      where: { id: roomId },
      data: { status },
    });
  }

  static async getRoomsHostedByUser(userId: string): Promise<Room[]> {
    return prisma.room.findMany({
      where: { hostId: userId },
    });
  }

  static async joinRoom(userId: string, roomId: string): Promise<boolean> {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room || room.status !== "waiting") {
      return false;
    }

    await prisma.participant.create({
      data: {
        userId,
        roomId,
      },
    });

    return true;
  }
}
