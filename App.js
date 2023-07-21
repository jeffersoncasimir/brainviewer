import {StatusBar} from 'expo-status-bar';
import {StyleSheet, View, Text, ScrollView} from 'react-native';
import React, {useEffect, useState} from 'react';
import {hdf5Loader} from './MincLoader';
import {Viewer} from './Viewer';
import {Login} from './Login';
import * as SecureStore from 'expo-secure-store';

async function getValueFor(key) {
  return await SecureStore.getItemAsync(key);
}

export default function App() {
  const [token, setToken] = useState(null);
  const [returnData, setReturnData] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [headerData, setHeaderData] = useState(null);

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
    <ScrollView style={styles.container}>
      <Text></Text>
      <Text> </Text>
      <Text> </Text>
      <Text> </Text>
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
      <Text> </Text>
      <Viewer rawData={rawData} headers={headerData} />
      <StatusBar style="auto" />
      <Text></Text>
      <Text></Text>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
