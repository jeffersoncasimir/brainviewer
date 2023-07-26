import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';

export function SegmentSlider(props) {
  // Calculate the width based on the screen dimensions
  const { width } = Dimensions.get('window');
  const sliderWidth = width * 0.9; // 70% of screen width

  const label = props.label ? <View><Text>{props.label}</Text></View> : null;
  return (
    <View style={{flex: 1, flexDirection: 'column'}}>
      {label}
      <Slider
        aria-label={label}
        step={1}
        value={props.val}
        maximumValue={parseInt(props.max, 10)}
        onValueChange={(newValue) => props.onSliderChange(newValue)}
        style={{ width: sliderWidth }}
        valueLabelDisplay="on"
      />
      <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center'}}>
        <Text>{props.val}</Text>
      </View>
	</View>
  );
}
