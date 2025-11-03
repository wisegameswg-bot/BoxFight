import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Dot from "../components/Dot";
import Line from "../components/Line";
import Box from "../components/Box";
import { handleTouch, checkBoxCompletion } from "../logic/gameLogic";
import { LinearGradient } from "expo-linear-gradient";

export default function GameBoard({ mode, goBack, cols = 8, rows = 12 }) {
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [lines, setLines] = useState([]); // active lines with owner 'P'|'C'
  const [boxes, setBoxes] = useState([]); // boxes with owner 'P'|'C'
  const [turn, setTurn] = useState("P"); // 'P' or 'C'
  const [scores, setScores] = useState({ P: 0, C: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  const [inputDisabled, setInputDisabled] = useState(false); // prevents player from drawing when AI turn or waiting
  const aiTimerRef = useRef(null);

  // Edge padding and spacing
  const EDGE_PADDING = 16;
  // The board container uses aspectRatio, its width/height determined by layout
  const usableWidth = Math.max(0, boardSize.width - EDGE_PADDING * 2);
  const usableHeight = Math.max(0, boardSize.height - EDGE_PADDING * 2);

  // compute spacing using exact cols/rows so dots matrix centers correctly
  const spacingX = cols > 0 ? usableWidth / cols : 0;
  const spacingY = rows > 0 ? usableHeight / rows : 0;

  // Player touch handler
  const handleBoardPress = (evt) => {
    if (gameOver) return;
    if (inputDisabled) return; // prevent extra player moves while AI pending
    if (turn !== "P") return;

    const { locationX, locationY } = evt.nativeEvent;
    const rx = locationX - EDGE_PADDING;
    const ry = locationY - EDGE_PADDING;

    // allow a small tolerance outside but reject grossly outside taps
    if (rx < -spacingX * 0.25 || ry < -spacingY * 0.25) return;
    if (rx > usableWidth + spacingX * 0.25 || ry > usableHeight + spacingY * 0.25) return;

    const newLine = handleTouch(rx, ry, spacingX, spacingY, lines, cols, rows);
    if (!newLine) return;

    // dedupe
    if (lines.find((l) => l.row === newLine.row && l.col === newLine.col && l.dir === newLine.dir)) {
      return;
    }

    // attach owner 'P'
    const playerLine = { ...newLine, owner: "P" };
    const newLines = [...lines, playerLine];
    const completed = checkBoxCompletion(playerLine, newLines, boxes, cols, rows);

    if (completed.length > 0) {
      // Player completed box(es) -> award and keep player's turn
      const newScore = scores.P + completed.length * 10;
      setBoxes((prev) => [...prev, ...completed.map((c) => ({ ...c, owner: "P" }))]);
      setScores((s) => ({ ...s, P: newScore }));
      if (newScore >= 100) {
        setGameOver(true);
        setWinner("P");
      }
      setLines(newLines);
      // player keeps turn (do not disable input)
    } else {
      // No box completed -> pass to AI. Disable input until AI finishes.
      setLines(newLines);
      setInputDisabled(true);
      setTurn("C");
    }
  };

  // AI effect: when turn === 'C', delay 2s and perform move(s)
  useEffect(() => {
    if (turn === "C" && !gameOver) {
      aiTimerRef.current = setTimeout(() => {
        makeComputerMove();
      }, 2000);
    }
    return () => {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, gameOver, lines, boxes]);

const createsBox = (line, boxes, currentLines) => {
  const simulated = [...currentLines, line];
  const completed = checkCompletedBoxes(simulated, boxes, line, "C");
  return completed.length > 0;
};
// --- Helper: returns all available (unclaimed) lines ---
function getAvailableLines(lines, cols, rows) {
  const moves = [];
  // iterate cells (same approach as other parts of the code)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!lines.find((l) => l.row === r && l.col === c && l.dir === "H")) {
        moves.push({ row: r, col: c, dir: "H" });
      }
      if (!lines.find((l) => l.row === r && l.col === c && l.dir === "V")) {
        moves.push({ row: r, col: c, dir: "V" });
      }
    }
  }
  return moves;
}

// --- Helper: returns completed boxes if 'line' were added (uses existing checkBoxCompletion) ---
function wouldCompleteBoxes(line, currentLines, boxes, cols, rows) {
  const simulatedLines = [...currentLines, line];
  const completed = checkBoxCompletion(line, simulatedLines, boxes, cols, rows);
  return completed; // array (length > 0 means it completes >=1 box)
}

// --- Helper: is a move "risky" (creates at least one box with exactly 3 sides for opponent) ---
function isRiskyMove(move, currentLines, cols, rows) {
  const simulated = [...currentLines, move];

  // examine every box; if any box becomes 3-sided (i.e. gives opponent a completion),
  // then it's risky.
  for (let rr = 0; rr < rows; rr++) {
    for (let cc = 0; cc < cols; cc++) {
      const hasTop = simulated.find((l) => l.row === rr && l.col === cc && l.dir === "H");
      const hasBottom = simulated.find((l) => l.row === rr + 1 && l.col === cc && l.dir === "H");
      const hasLeft = simulated.find((l) => l.row === rr && l.col === cc && l.dir === "V");
      const hasRight = simulated.find((l) => l.row === rr && l.col === cc + 1 && l.dir === "V");

      const sides = [hasTop, hasBottom, hasLeft, hasRight].filter(Boolean).length;
      if (sides === 3) {
        return true;
      }
    }
  }
  return false;
}

const makeComputerMove = () => {
  if (gameOver) return;

  setInputDisabled(true);

  setTimeout(() => {
    const available = getAvailableLines(lines, cols, rows);
    if (available.length === 0) {
      setGameOver(true);
      setWinner(scores.P >= scores.C ? "P" : "C");
      setInputDisabled(false);
      return;
    }

    const lastPlayerLine = [...lines].reverse().find(l => l.owner === "P");
    let chosenLine = null;

    // 🧠 STEP 1: PRIORITY — Complete any box with 3 sides
    const boxCompleteMove = findBoxCompletionMove(lines, boxes, cols, rows);
    if (boxCompleteMove) {
      chosenLine = boxCompleteMove;
    }
    // 🧩 STEP 2: REACTIVE — If player moved, pick near their last line
    else if (lastPlayerLine) {
      const neighbors = getNeighborLines(lastPlayerLine, lines, cols, rows);
      const availableNeighbor = neighbors.find(n =>
        !lines.some(l => l.row === n.row && l.col === n.col && l.dir === n.dir)
      );

      if (availableNeighbor) {
        chosenLine = availableNeighbor;
      }
    }

    // 🎯 STEP 3: Fallback — Choose smart random (safe) move
    if (!chosenLine) {
      const safeMoves = getSafeLines(lines, cols, rows);
      chosenLine = safeMoves.length > 0
        ? safeMoves[Math.floor(Math.random() * safeMoves.length)]
        : available[Math.floor(Math.random() * available.length)];
    }

    const newLines = [...lines, { ...chosenLine, owner: "C" }];
    const completedNow = checkBoxCompletion({ ...chosenLine, owner: "C" }, newLines, boxes, cols, rows);

    if (completedNow.length > 0) {
      setBoxes((prev) => [...prev, ...completedNow.map((b) => ({ ...b, owner: "C" }))]);
      setScores((s) => ({ ...s, C: s.C + completedNow.length * 10 }));
      setLines(newLines);

      const newScore = scores.C + completedNow.length * 10;
      if (newScore >= 100) {
        setGameOver(true);
        setWinner("C");
        setInputDisabled(false);
        return;
      }

      // 🔁 Continue turn if box completed
      // setTimeout(() => makeComputerMove(), 800);
    } else {
      // ⏩ Pass turn back to player
      setLines(newLines);
      setTurn("P");
      setInputDisabled(false);
    }
  }, 2000); // ⏱ 2-sec delay for realism
};
const findBoxCompletionMove = (lines, boxes, cols, rows) => {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const top = lines.find(l => l.row === r && l.col === c && l.dir === "H");
      const bottom = lines.find(l => l.row === r + 1 && l.col === c && l.dir === "H");
      const left = lines.find(l => l.row === r && l.col === c && l.dir === "V");
      const right = lines.find(l => l.row === r && l.col === c + 1 && l.dir === "V");

      const sides = [
        { dir: "H", row: r, col: c, drawn: !!top },
        { dir: "H", row: r + 1, col: c, drawn: !!bottom },
        { dir: "V", row: r, col: c, drawn: !!left },
        { dir: "V", row: r, col: c + 1, drawn: !!right },
      ];

      const drawnCount = sides.filter(s => s.drawn).length;
      if (drawnCount === 3) {
        const missing = sides.find(s => !s.drawn);
        return missing;
      }
    }
  }
  return null;
};
const getNeighborLines = (line, lines, cols, rows) => {
  const neighbors = [];

  if (line.dir === "H") {
    if (line.row > 0)
      neighbors.push({ row: line.row - 1, col: line.col, dir: "V" });
    if (line.row < rows)
      neighbors.push({ row: line.row, col: line.col, dir: "V" });
    if (line.col > 0)
      neighbors.push({ row: line.row, col: line.col - 1, dir: "H" });
    if (line.col < cols)
      neighbors.push({ row: line.row, col: line.col + 1, dir: "H" });
  } else if (line.dir === "V") {
    if (line.col > 0)
      neighbors.push({ row: line.row, col: line.col - 1, dir: "V" });
    if (line.col < cols)
      neighbors.push({ row: line.row, col: line.col + 1, dir: "V" });
    if (line.row > 0)
      neighbors.push({ row: line.row - 1, col: line.col, dir: "H" });
    if (line.row < rows)
      neighbors.push({ row: line.row + 1, col: line.col, dir: "H" });
  }

  return neighbors;
};
const getSafeLines = (lines, cols, rows) => {
  const safe = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const possible = [
        { dir: "H", row: r, col: c },
        { dir: "V", row: r, col: c },
      ];
      possible.forEach((p) => {
        if (!lines.find(l => l.row === p.row && l.col === p.col && l.dir === p.dir)) {
          const testLines = [...lines, p];
          const completed = checkBoxCompletion(p, testLines, [], cols, rows);
          if (completed.length === 0) safe.push(p);
        }
      });
    }
  }

  return safe;
};



  // Render
  return (
    <LinearGradient colors={["#1a0033", "#2e0066"]} style={{ flex: 1, paddingTop: 40 }}>
      {/* Score Row (just above the board) */}
      <View style={{ paddingHorizontal: 20 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* Computer (left) */}
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 14, marginBottom: 4 }}>C</Text>
            <Text style={{ color: "#fff", fontSize: 20 }}>{scores.C}</Text>
          </View>

          {/* Back button center-left */}
          <TouchableOpacity onPress={goBack} style={{ padding: 6 }}>
            <Text style={{ color: "red", fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>

          {/* Player (right) */}
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 14, marginBottom: 4 }}>P</Text>
            <Text style={{ color: "#fff", fontSize: 20 }}>{scores.P}</Text>
          </View>
        </View>
      </View>

      {/* Separator area: 40px gap, 2px white line, 40px gap */}
      <View style={{ height: 40 }} />
      <View style={{ height: 2, backgroundColor: "#ffffff", marginHorizontal: 20 }} />
      <View style={{ height: 40 }} />

      {/* Game Board */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: "92%",
            aspectRatio: cols / rows,
            backgroundColor: "#ffffff", // white board
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 2,
            borderColor: "#6666ff",
          }}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setBoardSize({ width, height });
          }}
          onStartShouldSetResponder={() => true}
          onResponderRelease={handleBoardPress}
        >
          {/* Render faint inactive horizontal lines */}
          {usableWidth > 0 &&
            usableHeight > 0 &&
            Array.from({ length: rows + 1 }).map((_, r) =>
              Array.from({ length: cols }).map((__, c) => {
                const left = EDGE_PADDING + c * spacingX;
                const top = EDGE_PADDING + r * spacingY - 2;
                return (
                  <View
                    key={`inactive-h-${r}-${c}`}
                    style={{
                      position: "absolute",
                      left,
                      top,
                      width: spacingX,
                      height: 4,
                      backgroundColor: "#e6e6e6",
                      zIndex: 0,
                    }}
                  />
                );
              })
            )}

          {/* Render faint inactive vertical lines */}
          {usableWidth > 0 &&
            usableHeight > 0 &&
            Array.from({ length: cols + 1 }).map((_, c) =>
              Array.from({ length: rows }).map((__, r) => {
                const left = EDGE_PADDING + c * spacingX - 2;
                const top = EDGE_PADDING + r * spacingY;
                return (
                  <View
                    key={`inactive-v-${r}-${c}`}
                    style={{
                      position: "absolute",
                      left,
                      top,
                      width: 4,
                      height: spacingY,
                      backgroundColor: "#e6e6e6",
                      zIndex: 0,
                    }}
                  />
                );
              })
            )}

          {/* Dots centered within board using EDGE_PADDING offsets */}
          {Array.from({ length: rows + 1 }).map((_, row) =>
            Array.from({ length: cols + 1 }).map((_, col) => (
              <Dot
                key={`dot-${row}-${col}`}
                x={EDGE_PADDING + col * spacingX}
                y={EDGE_PADDING + row * spacingY}
              />
            ))
          )}

          {/* Active Lines (P or C) */}
          {lines.map((line, i) => (
            <Line
              key={`line-${i}`}
              line={line}
              spacingX={spacingX}
              spacingY={spacingY}
              edgePad={EDGE_PADDING}
            />
          ))}

          {/* Boxes */}
          {boxes.map((box, i) => (
            <Box key={`box-${i}`} box={box} spacingX={spacingX} spacingY={spacingY} edgePad={EDGE_PADDING} />
          ))}
        </View>
      </View>

      {/* Separator area after board: 40px gap, 2px white line, 40px gap */}
      <View style={{ height: 40 }} />
      <View style={{ height: 2, backgroundColor: "#ffffff", marginHorizontal: 20 }} />
      <View style={{ height: 40 }} />

      {/* Bottom description */}
      <View style={{ alignItems: "center", marginBottom: 30 }}>
        <Text style={{ color: "#bbb" }}>🔹 Tap between two dots to draw a line and form boxes.</Text>
      </View>

      {/* Game over display with both final scores */}
      {gameOver && (
        <View style={{ position: "absolute", left: 0, right: 0, top: "30%", alignItems: "center" }}>
          <View style={{ backgroundColor: "#000000cc", padding: 20, borderRadius: 8 }}>
            <Text style={{ color: "#fff", fontSize: 20, marginBottom: 8 }}>
              {winner === "P" ? "🎉 You Win!" : "😞 Computer Wins!"}
            </Text>
            <Text style={{ color: "#fff", marginBottom: 12 }}>Final Scores — P: {scores.P} | C: {scores.C}</Text>
            <TouchableOpacity onPress={goBack} style={{ backgroundColor: "#ff0066", padding: 10, borderRadius: 8 }}>
              <Text style={{ color: "#fff" }}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}
