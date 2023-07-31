import React from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';

export function SegmentSlider(props) {
  // Calculate the width based on the screen dimensions
  const sliderWidth =  props.viewWidth * 1.1;

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
