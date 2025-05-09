if (winningPattern) {
  // Get the card's participant
  const participant = await prisma.participant.findUnique({
    where: { id: card.participantId },
    include: { user: true, room: true },
  });

  if (participant) {
    // Calculate prize for this round
    const participantsInRound = await prisma.participant.count({
      where: { roomId: participant.room.id },
    });

    const prizePerRound =
      (participant.room.entryFee * participantsInRound * 0.9) /
      participant.room.roundCount;

    // Award prize in a transaction
    await prisma.$transaction(async (tx) => {
      // Update user balance
      await tx.user.update({
        where: { id: participant.userId },
        data: { balance: { increment: prizePerRound } },
      });

      // Update participant winnings
      await tx.participant.update({
        where: { id: participant.id },
        data: { winnings: { increment: prizePerRound } },
      });

      // Mark round as finished
      await tx.round.update({
        where: { id: card.round.id },
        data: {
          status: "finished",
          winnerId: participant.userId,
          prize: prizePerRound,
        },
      });
    });

    // Check if this was the last round
    const completedRounds = await prisma.round.count({
      where: {
        roomId: card.round.roomId,
        status: "finished",
      },
    });

    if (completedRounds >= participant.room.roundCount) {
      await RoomService.updateRoomStatus(participant.room.id, "finished");
    }
  }

  return { isWinner: true, winningPattern };
}
