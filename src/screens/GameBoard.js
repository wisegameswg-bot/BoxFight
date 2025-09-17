import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Dot from "../components/Dot";
import Line from "../components/Line";
import Box from "../components/Box";
import { handleTouch, checkBoxCompletion } from "../logic/gameLogic";
import { LinearGradient } from "expo-linear-gradient";

export default function GameBoard({ mode, goBack, cols = 8, rows = 12 }) {
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [lines, setLines] = useState([]); // active lines (with owner)
  const [boxes, setBoxes] = useState([]);
  const [turn, setTurn] = useState("P1");
  const [scores, setScores] = useState({ P1: 0, P2: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  // Edge padding (space between outermost dots and board edge)
  const EDGE_PADDING = 16; // tweak if you want more/less
  const aiTimerRef = useRef(null);

  // compute usable area (inside edge padding)
  const usableWidth = Math.max(0, boardSize.width - EDGE_PADDING * 2);
  const usableHeight = Math.max(0, boardSize.height - EDGE_PADDING * 2);

  const spacingX = cols > 0 ? usableWidth / cols : 0;
  const spacingY = rows > 0 ? usableHeight / rows : 0;

  // handle touch on board — pass board-relative coordinates to gameLogic
  const handleBoardPress = (evt) => {
    if (gameOver) return;
    const { locationX, locationY } = evt.nativeEvent;

    // Convert to coordinates relative to the inner (padded) grid
    const rx = locationX - EDGE_PADDING;
    const ry = locationY - EDGE_PADDING;

    // if outside the usable area, ignore
    if (rx < -spacingX * 0.2 || ry < -spacingY * 0.2) return;
    if (rx > usableWidth + spacingX * 0.2 || ry > usableHeight + spacingY * 0.2) return;

    const newLine = handleTouch(rx, ry, spacingX, spacingY, lines, cols, rows);
    if (!newLine) return;

    // prevent duplicates (extra guard)
    if (lines.find((l) => l.row === newLine.row && l.col === newLine.col && l.dir === newLine.dir)) {
      return;
    }

    newLine.owner = "P1";
    const newLines = [...lines, newLine];
    const completed = checkBoxCompletion(newLine, newLines, boxes, cols, rows);

    if (completed.length > 0) {
      const newScore = scores.P1 + completed.length * 10;
      setBoxes((prev) => [...prev, ...completed.map((c) => ({ ...c, owner: "P1" }))]);
      setScores((s) => ({ ...s, P1: newScore }));
      if (newScore >= 100) {
        setGameOver(true);
        setWinner("P1");
      }
      // Player gets another turn (do not switch)
    } else {
      setTurn("P2");
    }
    setLines(newLines);
  };

  useEffect(() => {
    // when it's AI's turn, delay by 2s before making a move
    if (turn === "P2" && !gameOver) {
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
  }, [turn, gameOver, lines, boxes]);

  const makeComputerMove = () => {
    if (gameOver) return;
    // build possible moves
    const possibleMoves = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!lines.find((l) => l.row === r && l.col === c && l.dir === "H")) {
          possibleMoves.push({ row: r, col: c, dir: "H" });
        }
        if (!lines.find((l) => l.row === r && l.col === c && l.dir === "V")) {
          possibleMoves.push({ row: r, col: c, dir: "V" });
        }
      }
    }
    if (possibleMoves.length === 0) {
      // no moves left — end game and compute winner
      setGameOver(true);
      const winnerPlayer = scores.P1 >= scores.P2 ? "P1" : "P2";
      setWinner(winnerPlayer);
      return;
    }

    const choice = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    const newLine = { ...choice, owner: "P2" };

    // prevent duplicates (safety)
    if (lines.find((l) => l.row === newLine.row && l.col === newLine.col && l.dir === newLine.dir)) {
      // try again next tick
      setTurn("P1");
      return;
    }

    const newLines = [...lines, newLine];
    const completed = checkBoxCompletion(newLine, newLines, boxes, cols, rows);

    if (completed.length > 0) {
      const newScore = scores.P2 + completed.length * 10;
      setBoxes((prev) => [...prev, ...completed.map((b) => ({ ...b, owner: "P2" }))]);
      setScores((s) => ({ ...s, P2: newScore }));
      if (newScore >= 100) {
        setGameOver(true);
        setWinner("P2");
      }
      // AI gets another turn: keep turn as P2
      setLines(newLines);
      setTimeout(() => {
        // small delay to chain AI moves if it completed boxes
        if (!gameOver) {
          // compute again via effect (set turn to P2 keeps it in AI)
          setTurn("P2");
        }
      }, 300);
      return;
    } else {
      setLines(newLines);
      setTurn("P1");
    }
  };

  return (
    <LinearGradient colors={["#1a0033", "#2e0066"]} style={{ flex: 1, paddingTop: 40 }}>
      {/* Header / Score Row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={goBack} style={{ padding: 5 }}>
          <Text style={{ color: "red", fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: "#fff", fontSize: 18 }}>
          {turn === "P1" ? "🔵 Your Turn" : "🔴 Opponent Turn"}
        </Text>

        <View style={{ alignItems: "center" }}>
          <Text style={{ color: "#fff", fontSize: 18 }}>{scores.P1} | {scores.P2}</Text>
        </View>
      </View>

      {/* separation between score and board (20px) */}
      <View style={{ height: 20 }} />

      {/* Board container */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", marginVertical: 0 }}>
        <View
          style={{
            borderWidth: 2,
            borderColor: "#6666ff",
            borderRadius: 12,
            aspectRatio: cols / rows,
            width: "92%",
            backgroundColor: "#ffffff", // board white
            overflow: "hidden",
          }}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setBoardSize({ width, height });
          }}
          onStartShouldSetResponder={() => true}
          onResponderRelease={handleBoardPress}
        >
          {/* draw faint (inactive) grid lines first */}
          {/* Horizontal faint lines */}
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

          {/* Vertical faint lines */}
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

          {/* Dots */}
          {Array.from({ length: rows + 1 }).map((_, row) =>
            Array.from({ length: cols + 1 }).map((_, col) => (
              <Dot
                key={`dot-${row}-${col}`}
                x={EDGE_PADDING + col * spacingX}
                y={EDGE_PADDING + row * spacingY}
              />
            ))
          )}

          {/* Active lines (player/computer) - render above inactive lines */}
          {lines.map((line, i) => (
            <Line key={`line-${i}`} line={line} spacingX={spacingX} spacingY={spacingY} edgePad={EDGE_PADDING} />
          ))}

          {/* Boxes */}
          {boxes.map((box, i) => (
            <Box key={`box-${i}`} box={box} spacingX={spacingX} spacingY={spacingY} edgePad={EDGE_PADDING} />
          ))}
        </View>
      </View>

      {/* separation between board and bottom description (20px) */}
      <View style={{ height: 20 }} />

      {/* Bottom description (single) */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Text style={{ color: "#bbb", marginBottom: 5 }}>
          🔹 Tap between two dots to draw a line and form boxes.
        </Text>
      </View>

      {/* End game modal area (simple) */}
      {gameOver && (
        <View style={{ alignItems: "center", marginBottom: 30 }}>
          <Text style={{ color: "#fff", fontSize: 22, marginBottom: 10 }}>
            {winner === "P1" ? "🎉 You Win!" : "😞 Computer Wins!"}
          </Text>
          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 8 }}>
            Final Scores — You: {scores.P1} | Computer: {scores.P2}
          </Text>
          <TouchableOpacity
            onPress={goBack}
            style={{ backgroundColor: "#ff0066", padding: 10, borderRadius: 8 }}
          >
            <Text style={{ color: "#fff", fontSize: 18 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}
