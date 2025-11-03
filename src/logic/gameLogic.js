export function handleTouch(x, y, spacingX, spacingY, lines, cols, rows) {
  if (spacingX <= 0 || spacingY <= 0) return null;

  const col = Math.floor(x / spacingX);
  const row = Math.floor(y / spacingY);

  const offsetX = x - col * spacingX;
  const offsetY = y - row * spacingY;

  const thresholdX = spacingX / 3;
  const thresholdY = spacingY / 3;

  let newLine = null;

  if (offsetY < thresholdY) {
    const r = row;
    const c = Math.min(Math.max(col, 0), cols - 1);
    if (!lines.find((l) => l.row === r && l.col === c && l.dir === "H")) {
      newLine = { row: r, col: c, dir: "H" };
    }
  } else if (offsetY > spacingY - thresholdY) {
    const r = row + 1;
    const c = Math.min(Math.max(col, 0), cols - 1);
    if (r <= rows && !lines.find((l) => l.row === r && l.col === c && l.dir === "H")) {
      newLine = { row: r, col: c, dir: "H" };
    }
  } else if (offsetX < thresholdX) {
    const r = Math.min(Math.max(row, 0), rows - 1);
    const c = col;
    if (!lines.find((l) => l.row === r && l.col === c && l.dir === "V")) {
      newLine = { row: r, col: c, dir: "V" };
    }
  } else if (offsetX > spacingX - thresholdX) {
    const r = Math.min(Math.max(row, 0), rows - 1);
    const c = col + 1;
    if (c <= cols && !lines.find((l) => l.row === r && l.col === c && l.dir === "V")) {
      newLine = { row: r, col: c, dir: "V" };
    }
  }

  if (newLine) {
    if (newLine.row < 0 || newLine.col < 0) return null;
    if (newLine.dir === "H" && newLine.row > rows) return null;
    if (newLine.dir === "V" && newLine.col > cols) return null;
  }

  return newLine;
}

export function checkBoxCompletion(newLine, lines, boxes, cols, rows) {
  const completed = [];

  const checkBox = (row, col) => {
    if (row < 0 || col < 0 || row >= rows || col >= cols) return;
    const hasTop = lines.find((l) => l.row === row && l.col === col && l.dir === "H");
    const hasBottom = lines.find((l) => l.row === row + 1 && l.col === col && l.dir === "H");
    const hasLeft = lines.find((l) => l.row === row && l.col === col && l.dir === "V");
    const hasRight = lines.find((l) => l.row === row && l.col === col + 1 && l.dir === "V");
    if (hasTop && hasBottom && hasLeft && hasRight) {
      if (!boxes.find((b) => b.row === row && b.col === col)) {
        completed.push({ row, col });
      }
    }
  };

  if (newLine.dir === "H") {
    checkBox(newLine.row - 1, newLine.col);
    checkBox(newLine.row, newLine.col);
  } else if (newLine.dir === "V") {
    checkBox(newLine.row, newLine.col - 1);
    checkBox(newLine.row, newLine.col);
  }

  return completed;
}
