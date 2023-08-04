import 'react-native-gesture-handler';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StatusBar} from 'expo-status-bar';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import {mincLoader} from "../helpers/MincLoader";
import * as SecureStore from "expo-secure-store";
import {AppContext} from "../app/_layout";
import {Viewer} from "./Viewer";
import {useLocalSearchParams, useRouter} from "expo-router";

export default function ViewerContainer() {
  const [rawData, setRawData] = useState(null);
  const [headerData, setHeaderData] = useState(null);
  const [loadingText, setLoadingText] = useState('');
  const appContext = useContext(AppContext);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isLorisRequest, isBrainWebRequest, brainWebBody } = params;

  const loadMINC = (data) => {
    return new Promise((resolve, reject) => {
      const result = mincLoader(data);
      if (result) {
        console.log('result');
        console.log(result);
        resolve(result);
      } else {
        reject("Failed to load data");
      }
    });
  }

  const fetchData = (url, brainWebBody = null) => {
    return new Promise((resolve, reject) => {
      // Fetch in react native does not support ArrayBuffer
      const req = new XMLHttpRequest();
      req.open(isBrainWebRequest === 'true' ? 'POST' : 'GET', url, true);
      req.responseType = "arraybuffer";
      req.onerror = (evt) => {
        console.log(evt);
        reject(`Failed to load URL: ${appContext.fileURL}.`);
      }
      req.onload = (evt) => {
        if (req.status < 200 || req.status >= 300) {
          console.log('response status', req.status);
          if (isLorisRequest === 'true' && req.status !== 404) {
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

      if (isLorisRequest === 'true') {
        console.log('setting loris header');
        req.setRequestHeader('Authorization', 'Bearer ' + appContext.token);
      } else if (isBrainWebRequest === 'true') {
        console.log('setting bw headers');
        req.setRequestHeader("accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7");
        req.setRequestHeader("accept-language", "en-US,en;q=0.9");
        req.setRequestHeader("cache-control", "max-age=0");
        req.setRequestHeader("content-type", "application/x-www-form-urlencoded");
        req.setRequestHeader("sec-ch-ua", "\"Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"115\", \"Chromium\";v=\"115\"");
        req.setRequestHeader("sec-ch-ua-mobile", "?0");
        req.setRequestHeader("sec-ch-ua-platform", "\"macOS\"");
        req.setRequestHeader("sec-fetch-dest", "document");
        req.setRequestHeader("sec-fetch-mode", "navigate");
        req.setRequestHeader("sec-fetch-site", "same-origin");
        req.setRequestHeader("sec-fetch-user", "?1");
        req.setRequestHeader("upgrade-insecure-requests", "1");
        req.setRequestHeader("referrer", "https://brainweb.bic.mni.mcgill.ca/cgi/brainweb1?alias=subject04_crisp&download=1");
        req.setRequestHeader("referrerPolicy", "strict-origin-when-cross-origin");
        req.withCredentials = true;
      }
      req.send(brainWebBody);
    });
  }

  useEffect(() => {
    if (!appContext.fileURL || (isLorisRequest && !appContext.token)) {
        router.back();
        return;
    }

    console.log(`isLorisRequest: ${isLorisRequest}`);
    console.log(`isBrainWebRequest: ${isBrainWebRequest}`);
    console.log(`brainWebBody: ${brainWebBody}`);

    setLoadingText('Downloading file...');
    fetchData(appContext.fileURL,
    isBrainWebRequest
      ? brainWebBody.replaceAll('@', '&')
      : null
    )
    .then((data) => {
      setLoadingText('Loading file...');
      loadMINC(data)
        .then((result) => {
          setLoadingText('Loading raw data...');
          setRawData(result.raw_data);
          setLoadingText('Loading header data...');
          setHeaderData(JSON.parse(result.header_text));
        })
        .catch((reason) => {
          console.error('Failed to loadMINC');
          console.error(reason);
          if (reason instanceof ReferenceError) {
            alert('Invalid or unsupported file type.');
          } else {
            alert(reason);
          }
          router.back();
        });
        // .finally(() => {
        //   setLoadingText('');
        // })
    })
    .catch((reason) => {
      console.log('Failed to fetchData');
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
        loadingText={loadingText}
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
