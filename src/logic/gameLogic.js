export function handleTouch(x, y, spacingX, spacingY, lines, cols, rows) {
  const col = Math.round(x / spacingX);
  const row = Math.round(y / spacingY);

  const dx = Math.abs(x - col * spacingX);
  const dy = Math.abs(y - row * spacingY);

  let newLine = null;

  if (dx < spacingX / 4 && row < rows) {
    // vertical
    if (col > 0 && !lines.find(l => l.row === row && l.col === col && l.dir === 'V')) {
      newLine = { row, col, dir: 'V' };
    }
  } else if (dy < spacingY / 4 && col < cols) {
    // horizontal
    if (row > 0 && !lines.find(l => l.row === row && l.col === col && l.dir === 'H')) {
      newLine = { row, col, dir: 'H' };
    }
  }

  return newLine;
}

export function checkBoxCompletion(newLine, lines, boxes, cols, rows) {
  const completed = [];

  const checkBox = (row, col) => {
    const hasTop = lines.find(l => l.row === row && l.col === col && l.dir === 'H');
    const hasBottom = lines.find(l => l.row === row + 1 && l.col === col && l.dir === 'H');
    const hasLeft = lines.find(l => l.row === row && l.col === col && l.dir === 'V');
    const hasRight = lines.find(l => l.row === row && l.col === col + 1 && l.dir === 'V');

    if (hasTop && hasBottom && hasLeft && hasRight) {
      if (!boxes.find(b => b.row === row && b.col === col)) {
        completed.push({ row, col });
      }
    }
  };

  if (newLine.dir === 'H') {
    if (newLine.row > 0) checkBox(newLine.row - 1, newLine.col);
    if (newLine.row < rows - 1) checkBox(newLine.row, newLine.col);
  } else if (newLine.dir === 'V') {
    if (newLine.col > 0) checkBox(newLine.row, newLine.col - 1);
    if (newLine.col < cols - 1) checkBox(newLine.row, newLine.col);
  }

  return completed;
}
