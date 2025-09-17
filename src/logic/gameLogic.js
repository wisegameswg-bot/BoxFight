// gameLogic.js
// handleTouch now expects coordinates relative to the inner padded area (rx, ry)
// spacingX / spacingY are the cell sizes (usable area / cols or rows)
// lines is current active-lines array (with owner)

export function handleTouch(x, y, spacingX, spacingY, lines, cols, rows) {
  // x,y are relative to the padded inner region (top-left of grid = 0,0)

  // Protect against invalid spacing
  if (spacingX <= 0 || spacingY <= 0) return null;

  // determine which cell / grid region the touch is in
  const col = Math.floor(x / spacingX); // 0..cols-1 (for horizontal segments)
  const row = Math.floor(y / spacingY); // 0..rows-1 (for vertical segments)

  // offsets inside the cell
  const offsetX = x - col * spacingX;
  const offsetY = y - row * spacingY;

  // The idea: if offsetY is near the top/bottom edge of the cell -> horizontal line
  // if offsetX is near left/right edge -> vertical line
  // use a threshold that is generous (1/3) to be responsive
  const thresholdX = spacingX / 3;
  const thresholdY = spacingY / 3;

  // candidate line
  let newLine = null;

  // horizontal line detection
  if (offsetY < thresholdY) {
    // top horizontal of this cell -> corresponds to H at (row, col)
    // but note: top horizontal of cell (row,col) maps to H at row, col
    const r = row;
    const c = Math.min(Math.max(col, 0), cols - 1);
    if (!lines.find((l) => l.row === r && l.col === c && l.dir === "H")) {
      newLine = { row: r, col: c, dir: "H" };
    }
  } else if (offsetY > spacingY - thresholdY) {
    // bottom horizontal of this cell -> H at row+1, col
    const r = row + 1;
    const c = Math.min(Math.max(col, 0), cols - 1);
    if (r <= rows && !lines.find((l) => l.row === r && l.col === c && l.dir === "H")) {
      newLine = { row: r, col: c, dir: "H" };
    }
  } else if (offsetX < thresholdX) {
    // left vertical of this cell -> V at row, col
    const r = Math.min(Math.max(row, 0), rows - 1);
    const c = col;
    if (!lines.find((l) => l.row === r && l.col === c && l.dir === "V")) {
      newLine = { row: r, col: c, dir: "V" };
    }
  } else if (offsetX > spacingX - thresholdX) {
    // right vertical of this cell -> V at row, col+1
    const r = Math.min(Math.max(row, 0), rows - 1);
    const c = col + 1;
    if (c <= cols && !lines.find((l) => l.row === r && l.col === c && l.dir === "V")) {
      newLine = { row: r, col: c, dir: "V" };
    }
  }

  // Because touches near very edges can produce out-of-range indices, sanitize:
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
    // top box above this horizontal line
    checkBox(newLine.row - 1, newLine.col);
    // bottom box below
    checkBox(newLine.row, newLine.col);
  } else if (newLine.dir === "V") {
    // left box
    checkBox(newLine.row, newLine.col - 1);
    // right box
    checkBox(newLine.row, newLine.col);
  }

  return completed;
}
