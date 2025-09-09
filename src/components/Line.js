import React from 'react';
import { View } from 'react-native';

export default function Line({ line, spacingX, spacingY }) {
  const isHorizontal = line.dir === 'H';
  return (
    <View
      style={{
        position: 'absolute',
        left: line.col * spacingX + (isHorizontal ? 0 : -2),
        top: line.row * spacingY + (isHorizontal ? -2 : 0),
        width: isHorizontal ? spacingX : 4,
        height: isHorizontal ? 4 : spacingY,
        backgroundColor: 'blue',
      }}
    />
  );
}
