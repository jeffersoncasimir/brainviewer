import React, {useState, useEffect} from 'react';
import { Dimensions, View, Text } from 'react-native';
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

export function Viewer({rawData, headers, onGestureStart, onGestureEnd, screenOrientation}) {
    const [data, setData] = useState(null);
    const [coord, setCoord] = useState({x: 0, y: 0, z: 0});
    const [viewWidth, setViewWidth] = useState(0);

    useEffect(() => {
      setViewWidth(screenOrientation < 3
        ? Dimensions.get('window').width * 0.85   // Portrait
        : Dimensions.get('window').width * 0.3    // Landscape
      );
    }, [screenOrientation]);

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
      <View style={{
        display: 'flex',
        // alignItems: 'center',
        justifyContent: 'space-evenly',
        flexDirection: screenOrientation < 3 ? 'column' : 'row',
      }}>
        <PlaneViewer data={data} plane='z' headers={headers}
            SliceNo={coord.z}
            label="Sagittal"
            onSliceChange={
                (value) => {
                    setCoord({...coord, z: value})
                }
            }
            setPosition={ (x, y, z) => {
                setCoord({x: x, y: y, z: z});
            }}
            crosshairs={ {x: coord.x, y: coord.y} }
            onGestureStart={onGestureStart}
            onGestureEnd={onGestureEnd}
            viewWidth={viewWidth}
        />
        <PlaneViewer data={data} plane='x' headers={headers}
            SliceNo={coord.x}
            label="Coronal"
            onSliceChange={
                (value) => {
                    setCoord({...coord, x: value})
                }
            }
            setPosition={ (x, y, z) => {
                setCoord({x: x, y: y, z: z});
            }}
            crosshairs={ {x: coord.y, y: coord.z} }
            onGestureStart={onGestureStart}
            onGestureEnd={onGestureEnd}
            viewWidth={viewWidth}
        />
        <PlaneViewer data={data}
            headers={headers}
            onGestureStart={onGestureStart}
            onGestureEnd={onGestureEnd}
            setPosition={ (x, y, z) => {
                setCoord({x: x, y: y, z: z});
            }}
            plane='y' 
            label="Axial"
            SliceNo={coord.y}
            onSliceChange={
                (value) => {
                    setCoord({...coord, y: value})
                }
            }
            crosshairs={ {x: coord.x, y: coord.z} }
            viewWidth={viewWidth}
        />
      </View>
    );
}
