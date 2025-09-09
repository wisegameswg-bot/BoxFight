import React from 'react';
import { View, Text } from 'react-native';

export default function Box({ box, spacingX, spacingY }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: box.col * spacingX,
        top: box.row * spacingY,
        width: spacingX,
        height: spacingY,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
        {box.owner}
      </Text>
    </View>
  );
}
