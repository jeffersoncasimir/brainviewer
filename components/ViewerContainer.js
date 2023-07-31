import 'react-native-gesture-handler';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StatusBar} from 'expo-status-bar';
import {StyleSheet, View, Text, ScrollView} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import {hdf5Loader} from "../MincLoader";
import * as SecureStore from "expo-secure-store";
import {AppContext} from "../app/_layout";
import {Viewer} from "./Viewer";
import {useRouter} from "expo-router";

export default function ViewerContainer() {
  const [rawData, setRawData] = useState(null);
  const [headerData, setHeaderData] = useState(null);
  const appContext = useContext(AppContext);
  const router = useRouter();

  useEffect(() => {
    // Get file from LORIS
    if (!appContext.token) {
      return;
    }

    //    Fetch in react native does not support ArrayBuffer
    const req = new XMLHttpRequest();
    req.open('GET', 'https://demo-25-0.loris.ca/api/v0.0.3/candidates/587630/V1/images/demo_587630_V1_t2_001_t2-defaced_001.mnc', true);
    req.responseType = "arraybuffer";
    req.setRequestHeader('Authorization', 'Bearer ' + appContext.token);
    req.onload = (evt) => {
      if (req.status < 200 || req.status >= 300) {
        console.log('response status', req.status);
        SecureStore.deleteItemAsync('loris_token', null);
        appContext.setToken(null);
        alert('Invalid Token. Please log in again.');
        router.replace('/');
        return;
      }

      const result = hdf5Loader(req.response);
      setRawData(result.raw_data);
      setHeaderData(JSON.parse(result.header_text));
    };
    req.send(null);
  }, []);


  return (
    // ScrollView
    <ScrollView scrollEnabled={appContext.shouldScroll} style={styles.container}>
      <GestureHandlerRootView>
      <View >
        <Text style={{
          textAlign: "center", fontSize: 25
        }}>
          {`Viewing: _filename_`}
        </Text>
      </View>
      <Viewer
        rawData={rawData}
        headers={headerData}
        onGestureStart={ () =>  appContext.setShouldScroll(false) }
        onGestureEnd={ () =>  appContext.setShouldScroll(true) }
        screenOrientation={appContext.screenOrientation}
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
  },
});
