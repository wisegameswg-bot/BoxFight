import React, { useState } from "react";
import { View } from "react-native";
import StartScreen from "./src/screens/StartScreen";
import GameBoard from "./src/screens/GameBoard";

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: "#1a0033" }}>
      {started ? (
        <GameBoard goBack={() => setStarted(false)} />
      ) : (
        <StartScreen onStart={() => setStarted(true)} />
      )}
    </View>
  );
}
