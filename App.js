import 'react-native-gesture-handler';
import { GestureHandlerRootView} from 'react-native-gesture-handler';
import {StatusBar} from 'expo-status-bar';
import {StyleSheet, View, Text, ScrollView} from 'react-native';
import React, {useEffect, useState} from 'react';
import {hdf5Loader} from './MincLoader';
import {Viewer} from './Viewer';
import {Login} from './Login';
import * as SecureStore from 'expo-secure-store';
import * as ScreenOrientation from 'expo-screen-orientation';

async function getValueFor(key) {
  return await SecureStore.getItemAsync(key);
}

export default function App() {
  const [token, setToken] = useState(null);
  const [returnData, setReturnData] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [headerData, setHeaderData] = useState(null);
  const [shouldScroll, setShouldScroll] = useState(true);
  const [screenOrientation, setScreenOrientation] = useState(0);

  useEffect(() => {
    checkOrientation();
    const subscription = ScreenOrientation.addOrientationChangeListener(
      handleOrientationChange
    );
    return () => {
      ScreenOrientation.removeOrientationChangeListeners(subscription);
    };
  }, []);
  const checkOrientation = async () => {
    const orientation = await ScreenOrientation.getOrientationAsync();
    setScreenOrientation(orientation);
  };
  const handleOrientationChange = (o) => {
    setScreenOrientation(o.orientationInfo.orientation);
  };

  useEffect(() => {
    if (token)
      return;
    getValueFor('loris_token').then((lorisToken) => {
      if (lorisToken)
        setToken(lorisToken);
    });
  }, [token])

  useEffect(() => {
    // Get file from LORIS
    if (!token) {
      return;
    }
    //    Fetch in react native does not support ArrayBuffer
    const req = new XMLHttpRequest();
    req.open('GET', 'https://demo-25-0.loris.ca/api/v0.0.3/candidates/587630/V1/images/demo_587630_V1_t2_001_t2-defaced_001.mnc', true);
    req.responseType = "arraybuffer";
    req.setRequestHeader('Authorization', 'Bearer ' + token);
    req.onload = (evt) => {
        if (req.status < 200 || req.status >= 300) {
            console.log('response status', req.status);
            SecureStore.deleteItemAsync('loris_token', null);
            setToken(null);
            return;
        }

        var result = hdf5Loader(req.response);
        setRawData(result.raw_data);
        setHeaderData(JSON.parse(result.header_text));
    };
    req.send(null);
  }, [token]);

  if (!token) {
    return (
        <Login
            token={token}
            setToken={setToken}
        />
    )
  }
  return (
    // ScrollView 
    <ScrollView scrollEnabled={shouldScroll} style={styles.container}>
      <GestureHandlerRootView>
      <View >
        <Text style={{
          textAlign: "center", fontSize: 25
        }}>
        Welcome to our Mobile Native BrainViewer!
        </Text>
      </View>
      <View >
        <Text style={{
          textAlign: "center", fontSize: 15
        }}>
        By Dave MacFarlane, Camille Beaudoin, and Jefferson Casimir
        </Text>
      </View>
      <Viewer
        rawData={rawData}
        headers={headerData}
        onGestureStart={ () => setShouldScroll(false) }
        onGestureEnd={ () => setShouldScroll(true) }
        screenOrientation={screenOrientation}
      />
      <View style={{
        paddingBottom: 40,
      }}/>
      <StatusBar style="auto" />
      </GestureHandlerRootView>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    display: 'flex',
    backgroundColor: '#fff',
    marginTop: 40,
  },
});
