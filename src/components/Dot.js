import React from "react";
import { View } from "react-native";

export default function Dot({ x, y }) {
  const size = 8;
  return (
    <View
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#000",
        zIndex: 3,
      }}
    />
  );
}
