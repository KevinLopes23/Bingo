import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Generate a unique 6-character room code
export async function generateRoomCode(): Promise<string> {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code: string;
  let existingRoom;

  do {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    existingRoom = await prisma.room.findUnique({
      where: { code },
    });
  } while (existingRoom);

  return code;
}

// Generate a bingo card with 25 numbers (5x5 grid)
export function generateBingoCard(): number[] {
  const card: number[] = [];

  // B column (1-15)
  const bCol = generateUniqueNumbers(1, 15, 5);
  // I column (16-30)
  const iCol = generateUniqueNumbers(16, 30, 5);
  // N column (31-45) with middle free space
  const nCol = generateUniqueNumbers(31, 45, 4);
  // G column (46-60)
  const gCol = generateUniqueNumbers(46, 60, 5);
  // O column (61-75)
  const oCol = generateUniqueNumbers(61, 75, 5);

  // Combine into a single card
  for (let i = 0; i < 5; i++) {
    card.push(bCol[i]);
    card.push(iCol[i]);
    if (i === 2) {
      // Free space in the middle
      card.push(0);
    } else {
      card.push(nCol[i < 2 ? i : i - 1]);
    }
    card.push(gCol[i]);
    card.push(oCol[i]);
  }

  return card;
}

// Generate unique random numbers within a range
function generateUniqueNumbers(
  min: number,
  max: number,
  count: number
): number[] {
  const numbers: number[] = [];

  while (numbers.length < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }

  return numbers;
}

// Check if a card has a winning pattern
export function checkForWin(
  card: number[],
  markedNumbers: number[],
  pattern: string
): boolean {
  const marked = new Set(markedNumbers);

  // Check if all numbers in the card are marked (except free space)
  if (pattern === "full") {
    return card.every((num) => num === 0 || marked.has(num));
  }

  // Check if any row is complete
  if (pattern === "row" || pattern === "any") {
    for (let row = 0; row < 5; row++) {
      const rowStart = row * 5;
      const rowComplete = [0, 1, 2, 3, 4].every((i) => {
        const num = card[rowStart + i];
        return num === 0 || marked.has(num);
      });

      if (rowComplete) return true;
    }
  }

  // Check if any column is complete
  if (pattern === "column" || pattern === "any") {
    for (let col = 0; col < 5; col++) {
      const colComplete = [0, 1, 2, 3, 4].every((i) => {
        const num = card[col + i * 5];
        return num === 0 || marked.has(num);
      });

      if (colComplete) return true;
    }
  }

  // Check for diagonal
  if (pattern === "diagonal" || pattern === "any") {
    // Main diagonal (top-left to bottom-right)
    const diag1Complete = [0, 6, 12, 18, 24].every((i) => {
      const num = card[i];
      return num === 0 || marked.has(num);
    });

    // Other diagonal (top-right to bottom-left)
    const diag2Complete = [4, 8, 12, 16, 20].every((i) => {
      const num = card[i];
      return num === 0 || marked.has(num);
    });

    if (diag1Complete || diag2Complete) return true;
  }

  return false;
}
