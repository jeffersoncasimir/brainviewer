import React, {useState, useEffect} from 'react';
import { Pressable, View, Text } from 'react-native';
import { GLView } from 'expo-gl';
import Expo2DContext from "expo-2d-context";
import { SegmentSlider } from './SegmentSlider';
import {PlaneViewer} from './PlaneViewer';


function preprocess(rawdata) {
  const dv = new DataView(rawdata);
  const floatArray = new Float32Array(rawdata.byteLength / 4);
  let min = null;
  let max = null;
  for(let i = 0; i < rawdata.byteLength; i += 4) {
    // FIXME: This should be based on the type that came back from
    // the headers
    const val = dv.getFloat32(i, true);
    if (min == null || val < min) {
      min = val;
    }
    if (max == null || val > max) {
      max = val;
    }
    floatArray[i / 4] = val;
  }
  console.log('min, max', min, max, floatArray.byteLength);
  return {
    min: min,
    max: max,
    floats: floatArray,
  }
}

export function Viewer({rawData, headers}) {
    const [data, setData] = useState(null);
    const [coord, setCoord] = useState({x: 0, y: 0, z: 0});
    useEffect( () => {
        if (!rawData) {
            return;
        }
        setData(preprocess(rawData));
    }, [rawData]);
    useEffect( () => {
        if (!headers) {
            return;
        }
        setCoord({
            x: Math.floor(headers.xspace.space_length / 2),
            y: Math.floor(headers.yspace.space_length / 2),
            z: Math.floor(headers.zspace.space_length / 2),
        });
    }, [headers]);

    if(!headers) {
      return <View><Text>Loading headers..</Text></View>;
    }
    if (!rawData){
      return <View><Text>Loading raw data..</Text></View>
    }

    // These have the fixed plane be z, x, y so that they're the
    // same direction brainbrowser shows it in the LORIS imaging browser
    // This was reached by trial and error with 1 sample file and
    // is not reliable
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <PlaneViewer data={data} plane='z' headers={headers}
            SliceNo={coord.z}
            onSliceChange={
                (value) => {
                    setCoord({...coord, z: value})
                }
            }
            crosshairs={ {x: coord.x, y: coord.y} }
        />
        <PlaneViewer data={data} plane='x' headers={headers}
            SliceNo={coord.x}
            onSliceChange={
                (value) => {
                    setCoord({...coord, x: value})
                }
            }
            crosshairs={ {x: coord.y, y: coord.z} }
            />
        <PlaneViewer data={data}
            headers={headers}
            plane='y' 
            SliceNo={coord.y}
            onSliceChange={
                (value) => {
                    setCoord({...coord, y: value})
                }
            }
            crosshairs={ {x: coord.x, y: coord.z} }
           />
      </View>
    );
}
