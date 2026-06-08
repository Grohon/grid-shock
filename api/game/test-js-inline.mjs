function createBoard(rows, cols) {
  const board = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push({ owner: null, count: 0 });
    }
    board.push(row);
  }
  return board;
}
function initGameState(rows, cols, mode) {
  return {
    board: createBoard(rows, cols),
    currentPlayer: 1, mode, rows, cols, numPlayers: 2, gameOver: false,
    playerNames: { 1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4' },
    playerStats: { wins: 0, loses: 0 },
    initialPlaced: { 1: false, 2: false, 3: false, 4: false },
    isOnline: true,
  };
}
export default async function handler(req, res) {
  const state = initGameState(6, 6, 'classic');
  res.status(200).json({ ok: true, rows: state.rows });
}
