import React, {useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Dot from "../components/Dot";
import Line from "../components/Line";
import Box from "../components/Box";
import { handleTouch, checkBoxCompletion } from "../logic/gameLogic";
import { LinearGradient } from "expo-linear-gradient";

export default function GameBoard({ mode, goBack, cols = 8, rows = 12 }) {
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [lines, setLines] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [turn, setTurn] = useState("P1");
  const [scores, setScores] = useState({ P1: 0, P2: 0 });
  //Game Over
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);


  const spacingX = boardSize.width / cols;
  const spacingY = boardSize.height / rows;
  const handleBoardPress = (evt) => {
    if (gameOver) return; // don't allow moves after game ends

    const { locationX, locationY } = evt.nativeEvent;
    const newLine = handleTouch(locationX, locationY, spacingX, spacingY, lines, cols, rows);

    if (newLine) {
      const newLines = [...lines, newLine];
      const completed = checkBoxCompletion(newLine, newLines, boxes, cols, rows);

      if (completed.length > 0) {
        const newScore = scores[turn] + completed.length * 10;
        setBoxes([
          ...boxes,
          ...completed.map((c) => ({ ...c, owner: turn })),
        ]);
        setScores({ ...scores, [turn]: newScore });

        // ✅ check for 100 points win
        if (newScore >= 100) {
          setGameOver(true);
          setWinner(turn);
        }
      } else {
        setTurn(turn === "P1" ? "P2" : "P1");
      }
      setLines(newLines);
    }
  };
  useEffect(() => {
    if (turn === "P2") {
      debugger;
      setTimeout(() => {
        makeComputerMove();
      }, 100); // delay for realism
    }
  }, [turn]);
  // ...rest of your component
  const makeComputerMove = () => {
    if (gameOver) return;
    const possibleMoves = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!lines.find(l => l.row === r && l.col === c && l.dir === "H")) {
          possibleMoves.push({ row: r, col: c, dir: "H" });
        }
        if (!lines.find(l => l.row === r && l.col === c && l.dir === "V")) {
          possibleMoves.push({ row: r, col: c, dir: "V" });
        }
      }
    }
    if (possibleMoves.length === 0) return;
    const newLine = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    const newLines = [...lines, newLine];
    const completed = checkBoxCompletion(newLine, newLines, boxes, cols, rows);
    if (completed.length > 0) {
      const newScore = scores.P2 + completed.length * 10;
      setBoxes([...boxes, ...completed.map(b => ({ ...b, owner: "P2" }))]);
      setScores({ ...scores, P2: newScore });
      // ✅ check for 100 points win
      if (newScore >= 100) {
        setGameOver(true);
        setWinner("P2");
      }
    } else {
      setTurn("P1");
    }
    setLines(newLines);
  };

  return (
    <LinearGradient colors={["#1a0033", "#2e0066"]} style={{ flex: 1, paddingTop: 40 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={goBack} style={{ padding: 5 }}>
          <Text style={{ color: "red", fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 18 }}>
          {turn === "P1" ? "🔵 Your Turn" : "🔴 Opponent Turn"}
        </Text>
        <Text style={{ color: "#fff", fontSize: 18 }}>
          {scores.P1} | {scores.P2}
        </Text>
      </View>

      {/* Board */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          marginVertical: 20,
        }}
      >
        <View
          style={{
            borderWidth: 2,
            borderColor: "#6666ff",
            borderRadius: 12,
            aspectRatio: cols / rows,
            width: "92%",
            backgroundColor: "rgba(255,255,255,0.05)",
          }}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setBoardSize({ width, height });
          }}
          onStartShouldSetResponder={() => true}
          onResponderRelease={handleBoardPress}
        >
          {/* Dots */}
          {Array.from({ length: rows + 1 }).map((_, row) =>
            Array.from({ length: cols + 1 }).map((_, col) => (
              <Dot key={`dot-${row}-${col}`} x={col * spacingX} y={row * spacingY} />
            ))
          )}

          {/* Lines */}
          {lines.map((line, i) => (
            <Line key={`line-${i}`} line={line} spacingX={spacingX} spacingY={spacingY} />
          ))}

          {/* Boxes */}
          {boxes.map((box, i) => (
            <Box key={`box-${i}`} box={box} spacingX={spacingX} spacingY={spacingY} />
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Text style={{ color: "#bbb", marginBottom: 5 }}>
          🔹 Tap on the lines to connect the dots and form boxes
        </Text>
      </View>
      {/* Footer / Game Over */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        {gameOver ? (
          <>
            <Text style={{ color: "#fff", fontSize: 22, marginBottom: 10 }}>
              🎉 {winner === "P1" ? "You Win!" : "Computer Wins!"}
            </Text>
            <TouchableOpacity
              onPress={goBack}
              style={{ backgroundColor: "#ff0066", padding: 10, borderRadius: 8 }}
            >
              <Text style={{ color: "#fff", fontSize: 18 }}>Go Back</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={{ color: "#bbb", marginBottom: 5 }}>
            🔹 Tap on the lines to connect the dots and form boxes
          </Text>
        )}
      </View>
    </LinearGradient>
  );
}
