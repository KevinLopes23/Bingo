import { PrismaClient, User } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

export class UserService {
  static async register(
    name: string,
    email: string,
    password: string
  ): Promise<User> {
    const hashedPassword = await hash(password, 10);

    return prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        balance: 0,
      },
    });
  }

  static async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  static async updateBalance(userId: string, amount: number): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: amount },
      },
    });
  }
}
