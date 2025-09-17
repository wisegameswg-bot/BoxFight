import React from "react";
import { View, Text } from "react-native";

export default function Box({ box, spacingX, spacingY, edgePad = 0 }) {
  return (
    <View
      style={{
        position: "absolute",
        left: edgePad + box.col * spacingX,
        top: edgePad + box.row * spacingY,
        width: spacingX,
        height: spacingY,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
      }}
    >
      <Text
        style={{
          fontWeight: "700",
          fontSize: 16,
          color: box.owner === "P1" ? "blue" : box.owner === "P2" ? "red" : "#000",
        }}
      >
        {box.owner}
      </Text>
    </View>
  );
}
