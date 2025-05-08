import { PrismaClient, Round, Card } from "@prisma/client";
import { generateBingoCard, checkForWin } from "../utils/helpers";
import { UserService } from "./UserService";
import { RoomService } from "./RoomService";

const prisma = new PrismaClient();

export class GameService {
  static async startRound(roomId: string, roundNumber: number): Promise<Round> {
    return prisma.round.create({
      data: {
        roomId,
        number: roundNumber,
        status: "active",
        drawnNumbers: "[]",
      },
    });
  }

  static async generateCardForParticipant(
    participantId: string,
    roundId: string
  ): Promise<Card> {
    const numbers = generateBingoCard();

    return prisma.card.create({
      data: {
        participantId,
        roundId,
        numbers: JSON.stringify(numbers),
        markedNumbers: "[]",
      },
    });
  }

  static async drawNumber(
    roundId: string
  ): Promise<{ drawnNumber: number; allDrawnNumbers: number[] } | null> {
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      select: { drawnNumbers: true },
    });

    if (!round) {
      throw new Error("Round not found");
    }

    const drawnNumbers: number[] = JSON.parse(round.drawnNumbers);
    if (drawnNumbers.length >= 75) {
      // Todos os números já foram sorteados
      return null;
    }
    let newNumber: number;

    // Generate a number that hasn't been drawn yet
    do {
      newNumber = Math.floor(Math.random() * 75) + 1;
    } while (drawnNumbers.includes(newNumber));

    drawnNumbers.push(newNumber);

    await prisma.round.update({
      where: { id: roundId },
      data: { drawnNumbers: JSON.stringify(drawnNumbers) },
    });

    return { drawnNumber: newNumber, allDrawnNumbers: drawnNumbers };
  }

  static async markNumberOnCard(cardId: string, number: number): Promise<Card> {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new Error("Card not found");
    }

    const markedNumbers: number[] = JSON.parse(card.markedNumbers);
    const cardNumbers: number[] = JSON.parse(card.numbers);

    if (cardNumbers.includes(number) && !markedNumbers.includes(number)) {
      markedNumbers.push(number);

      return prisma.card.update({
        where: { id: cardId },
        data: { markedNumbers: JSON.stringify(markedNumbers) },
      });
    }

    return card;
  }

  static async checkBingo(
    cardId: string,
    pattern: string = "any"
  ): Promise<{ isWinner: boolean; winningPattern?: string }> {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        round: {
          select: {
            drawnNumbers: true,
            id: true,
            roomId: true,
          },
        },
      },
    });

    if (!card) {
      throw new Error("Card not found");
    }

    const cardNumbers: number[] = JSON.parse(card.numbers);
    const drawnNumbers: number[] = JSON.parse(card.round.drawnNumbers);

    // Check for winning patterns
    let winningPattern: string | undefined;

    if (pattern === "any") {
      const patterns = ["row", "column", "diagonal", "full"];
      for (const p of patterns) {
        if (checkForWin(cardNumbers, drawnNumbers, p)) {
          winningPattern = p;
          break;
        }
      }
    } else {
      if (checkForWin(cardNumbers, drawnNumbers, pattern)) {
        winningPattern = pattern;
      }
    }

    if (winningPattern) {
      // Get the card's participant
      const participant = await prisma.participant.findUnique({
        where: { id: card.participantId },
        include: { user: true, room: true },
      });

      if (participant) {
        // Award prize
        await UserService.updateBalance(
          participant.userId,
          participant.room.entryFee * 0.9
        );

        // Update participant winnings
        await prisma.participant.update({
          where: { id: participant.id },
          data: { winnings: { increment: participant.room.entryFee * 0.9 } },
        });

        // Mark round as finished
        await prisma.round.update({
          where: { id: card.round.id },
          data: {
            status: "finished",
            winnerId: participant.userId,
          },
        });

        // Check if this was the last round
        const room = await RoomService.getRoomById(card.round.roomId);
        const completedRounds = await prisma.round.count({
          where: {
            roomId: card.round.roomId,
            status: "finished",
          },
        });

        if (room && completedRounds >= room.roundCount) {
          await RoomService.updateRoomStatus(room.id, "finished");
        }
      }

      return { isWinner: true, winningPattern };
    }

    return { isWinner: false };
  }

  static async getParticipantCardsForRound(
    participantId: string,
    roundId: string
  ): Promise<Card[]> {
    return prisma.card.findMany({
      where: {
        participantId,
        roundId,
      },
    });
  }
}
