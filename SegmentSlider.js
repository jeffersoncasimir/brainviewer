import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';

export function SegmentSlider(props) {
    // Calculate the width based on the screen dimensions
    const { width } = Dimensions.get('window');
    const sliderWidth = width * 0.9; // 70% of screen width

  	return (
	    <>
			<View>
				<Text>{props.label}</Text>
			</View>
			<Slider
				aria-label="Always visible"
 				step={1}
				value={props.val}
				maximumValue={parseInt(props.max, 10)}
				onValueChange={(newValue) => props.onSliderChange(props.valName, newValue)}
				style={{ width: sliderWidth }}
				valueLabelDisplay="on"
			/>
            <View>
                <Text>
                    {props.val}
                </Text>
            </View>
	    </>
  	);
}