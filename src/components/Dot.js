import React from "react";
import { View } from "react-native";

export default function Dot({ x, y }) {
  return (
    <View
      style={{
        position: "absolute",
        left: x - 4,
        top: y - 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#000",
      }}
    />
  );
}
