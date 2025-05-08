"use client";

import { useState, useEffect } from "react";

interface BingoCardProps {
  cardId: string;
  numbers: number[];
  markedNumbers: number[];
  onBingo: () => void;
}

export default function BingoCard({
  cardId,
  numbers,
  markedNumbers,
  onBingo,
}: BingoCardProps) {
  const columns = ["B", "I", "N", "G", "O"];

  // Organizar os números em uma grade 5x5
  const organizeNumbers = () => {
    const grid: (number | null)[][] = [];

    for (let row = 0; row < 5; row++) {
      const rowNumbers: (number | null)[] = [];

      for (let col = 0; col < 5; col++) {
        const index = row + col * 5;

        // Se for o centro da cartela (índice 12), é um espaço livre
        if (row === 2 && col === 2) {
          rowNumbers.push(0); // 0 representa o espaço livre
        } else {
          rowNumbers.push(numbers[index]);
        }
      }

      grid.push(rowNumbers);
    }

    return grid;
  };

  const grid = organizeNumbers();

  // Verificar se um número está marcado
  const isMarked = (num: number | null): boolean => {
    if (num === 0) return true; // Espaço livre sempre marcado
    if (num === null) return false;
    return markedNumbers.includes(num);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md mx-auto">
      <div className="bg-blue-800 text-white text-center py-3">
        <h3 className="text-xl font-bold">Cartela de Bingo</h3>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-5 gap-2 mb-4">
          {columns.map((letter, index) => (
            <div
              key={`header-${index}`}
              className="aspect-square flex items-center justify-center bg-blue-700 text-white text-2xl font-bold rounded"
            >
              {letter}
            </div>
          ))}

          {grid.map((row, rowIndex) =>
            row.map((num, colIndex) => (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className={`aspect-square flex items-center justify-center text-xl font-bold rounded-full border-2 transition-all ${
                  isMarked(num)
                    ? "bg-green-500 text-white border-green-600"
                    : "bg-white text-blue-800 border-blue-200 hover:border-blue-400"
                }`}
              >
                {num === 0 ? "★" : num}
              </div>
            ))
          )}
        </div>

        <button
          onClick={onBingo}
          className="w-full py-3 bg-red-600 text-white text-xl font-bold rounded-lg hover:bg-red-700 transition-colors"
        >
          BINGO!
        </button>
      </div>
    </div>
  );
}
