import 'react-native-gesture-handler';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StatusBar} from 'expo-status-bar';
import {StyleSheet, View, Text, ScrollView} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import {hdf5Loader} from "../MincLoader";
import * as SecureStore from "expo-secure-store";
import {AppContext} from "../app/_layout";
import {Viewer} from "./Viewer";
import {useLocalSearchParams, useRouter} from "expo-router";

export default function ViewerContainer() {
  const [rawData, setRawData] = useState(null);
  const [headerData, setHeaderData] = useState(null);
  const appContext = useContext(AppContext);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isLorisRequest } = params;

  useEffect(() => {
    if (!appContext.fileURL || (isLorisRequest && !appContext.token)) {
        router.back();
        return;
    }
    // Fetch in react native does not support ArrayBuffer
    const req = new XMLHttpRequest();
    req.open('GET', appContext.fileURL, true);
    req.responseType = "arraybuffer";
    req.onerror = (evt) => {
      alert(`Failed to load URL: ${appContext.fileURL}.`);
      router.back();
    }
    req.onload = (evt) => {
      if (req.status < 200 || req.status >= 300) {
        console.log('response status', req.status);
        if (isLorisRequest && req.status !== 404) {
          SecureStore.deleteItemAsync('loris_token', null);
          SecureStore.deleteItemAsync('loris_url', null);
          appContext.setApiURL(null);
          appContext.setToken(null);
          alert('Invalid token or request. Please log in again.');
          router.back();
          return;
        }
        alert('File not found.');
        router.back();
      }

      const result = hdf5Loader(req.response);
      setRawData(result.raw_data);
      setHeaderData(JSON.parse(result.header_text));
    };

    if (isLorisRequest) {
      req.setRequestHeader('Authorization', 'Bearer ' + appContext.token);
    }
    req.send(null);
  }, []);


  return (
    // ScrollView
    <ScrollView scrollEnabled={appContext.shouldScroll} style={styles.container}>
      <GestureHandlerRootView>
      <View >
        <Text style={{
          textAlign: "center", fontSize: 20, padding: 20
        }}>
          {`File: ${appContext.fileURL.split('/').slice(-1)}`}
        </Text>
      </View>
      <Viewer
        rawData={rawData}
        headers={headerData}
        onGestureStart={() => appContext.setShouldScroll(false)}
        onGestureEnd={() => appContext.setShouldScroll(true)}
        screenOrientation={appContext.screenOrientation}
      />
      <View style={{
        paddingBottom: 40,
      }}/>
      </GestureHandlerRootView>
      <StatusBar style="auto" />
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    display: 'flex',
    backgroundColor: '#fff',
  },
});
