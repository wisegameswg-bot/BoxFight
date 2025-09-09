import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function StartScreen({ onStart }) {
  return (
    <LinearGradient
      colors={["#1a0033", "#2e0066"]}
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <Text style={{ fontSize: 32, fontWeight: "bold", color: "#fff", marginBottom: 40 }}>
        BOX FIGHT
      </Text>

      <TouchableOpacity onPress={onStart} activeOpacity={0.8}>
        <LinearGradient
          colors={["#ff00cc", "#3333ff"]}
          style={{
            paddingVertical: 15,
            paddingHorizontal: 50,
            borderRadius: 30,
            marginBottom: 30,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
            Click to Start the Game
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ marginTop: 20 }}>
        <Text style={{ color: "#fff", marginBottom: 8 }}>🔹 Connect dots to form a box</Text>
        <Text style={{ color: "#fff", marginBottom: 8 }}>🔹 Complete a box to earn points</Text>
        <Text style={{ color: "#fff" }}>🔹 Beat the computer's score</Text>
      </View>
    </LinearGradient>
  );
}
