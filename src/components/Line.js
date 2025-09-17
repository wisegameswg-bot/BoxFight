import React from "react";
import { View } from "react-native";

export default function Line({ line, spacingX, spacingY, edgePad = 0 }) {
  const isHorizontal = line.dir === "H";
  const color = line.owner === "P1" ? "blue" : line.owner === "P2" ? "red" : "transparent";

  // Positioning:
  // horizontal H(row,col) => left = edgePad + col*spacingX, top = edgePad + row*spacingY - (thickness/2)
  // vertical V(row,col) => left = edgePad + col*spacingX - (thickness/2), top = edgePad + row*spacingY

  const thickness = 4;

  const style = isHorizontal
    ? {
        position: "absolute",
        left: edgePad + line.col * spacingX,
        top: edgePad + line.row * spacingY - thickness / 2,
        width: spacingX,
        height: thickness,
        backgroundColor: color,
        zIndex: 2,
      }
    : {
        position: "absolute",
        left: edgePad + line.col * spacingX - thickness / 2,
        top: edgePad + line.row * spacingY,
        width: thickness,
        height: spacingY,
        backgroundColor: color,
        zIndex: 2,
      };

  return <View style={style} />;
}
