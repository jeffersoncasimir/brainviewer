import 'react-native-gesture-handler';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StatusBar} from 'expo-status-bar';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
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

  const loadHDF5 = (data) => {
    return new Promise((resolve, reject) => {
      const result = hdf5Loader(data);
      resolve(result);
      reject("Failed to load data");
    });
  }

  const fetchData = (url) => {
    return new Promise((resolve, reject) => {
      // Fetch in react native does not support ArrayBuffer
      const req = new XMLHttpRequest();
      req.open('GET', url, true);
      req.responseType = "arraybuffer";
      req.onerror = (evt) => {
        reject(`Failed to load URL: ${appContext.fileURL}.`);
      }
      req.onload = (evt) => {
        if (req.status < 200 || req.status >= 300) {
          console.log('response status', req.status);
          if (isLorisRequest && req.status !== 404) {
            SecureStore.deleteItemAsync('loris_token', null);
            SecureStore.deleteItemAsync('loris_url', null);
            appContext.setApiURL(null);
            appContext.setToken(null);
            reject('Invalid token or request. Please log in again.');
            return;
          }
          reject('File not found.');
          return;
        }
        resolve(req.response);
      };

      if (isLorisRequest) {
        req.setRequestHeader('Authorization', 'Bearer ' + appContext.token);
      }
      req.send(null);
    });
  }

  useEffect(() => {
    if (!appContext.fileURL || (isLorisRequest && !appContext.token)) {
        router.back();
        return;
    }
    
    fetchData(appContext.fileURL)
      .then((data) => {
        loadHDF5(data)
          .then((result) => {
            setRawData(result.raw_data);
            setHeaderData(JSON.parse(result.header_text));
          })
          .catch((reason) => {
            alert(reason);
            router.back();
          });
      })
      .catch((reason) => {
        alert(reason);
        router.back();
      });
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
