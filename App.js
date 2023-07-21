import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import React, {useState, useEffect} from 'react';
import { hdf5Loader } from './MincLoader';
import { Viewer } from './Viewer';

export default function App() {
  const [token, setToken] = useState(null);
  const [returnData, setReturnData] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [headerData, setHeaderData] = useState(null);

  useEffect(() => {
    // Get API key
    var loginData = {
      username : '', // username
      password : '', // password
    };
    fetch('https://demo-25-0.loris.ca/api/v0.0.3/login/', {
      method: 'POST',
      body: JSON.stringify(loginData),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    })
    .then((response) => response.json())
    .then((data) => {
      setToken(data.token);
    })
    .catch((err) => {
      console.log(err.message);
    });
  }, []);

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
