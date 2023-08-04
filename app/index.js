import {Button, View, Text, TextInput} from "react-native";
import * as SecureStore from "expo-secure-store";
import {Link, useRouter} from "expo-router";
import {useContext, useState} from 'react';
import {AppContext} from "./_layout";

export default function Index() {
  const [fromURL, setFromURL] = useState('');
  const appContext = useContext(AppContext);
  const router = useRouter();

  const loadFromURL = (url, lorisAPI = false) => {
    appContext.setFileURL(url);
    router.push({
      pathname: 'viewer',
      params: {
        isLorisRequest: lorisAPI,
        isBrainWebRequest: false,
        brainWebBody: null,
      }
    });
  }

  const loadFromBrainWeb = (body) => {
    console.log(`body: ${body}`);
    appContext.setFileURL('https://brainweb.bic.mni.mcgill.ca/cgi/brainweb1');
    router.push({
      pathname: 'viewer',
      params: {
        isLorisRequest: false,
        isBrainWebRequest: true,
        brainWebBody: body.replaceAll('&', '@'),
      }
    });
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-evenly', }}>
      <View style={{ flex: 1, display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }}>
        <Text style={{
          textAlign: "center", fontSize: 25
        }}>
        Welcome to our Mobile Native BrainViewer!
        </Text>
        <Text style={{
          textAlign: "center", fontSize: 15
        }}>
        By Dave MacFarlane, Camille Beaudoin, and Jefferson Casimir
        </Text>
        {
          appContext.token
          ? (
            <>
              <View style={{ alignItems: 'center', }}>
                <Text>LORIS status: Logged in</Text>
                <Text selectable={true}>URL: {appContext.apiURL}</Text>
              </View>
              <View style={{ display: 'flex', width: '75%', flexDirection: 'row', justifyContent: 'space-evenly' }}>
                <Button
                  title="View Demo"
                  onPress={() =>
                    loadFromURL(
                      `${appContext.apiURL}/candidates/587630/V1/images/demo_587630_V1_t2_001_t2-defaced_001.mnc`,
                    true
                    )
                  }
                />
                <Button
                  title="LORIS Logout"
                  onPress={() => {
                    SecureStore.deleteItemAsync('loris_token', null);
                    SecureStore.deleteItemAsync('loris_url', null);
                    appContext.setApiURL(null);
                    appContext.setToken(null);
                  }}
                />
              </View>
            </>
          )
          : (
            <>
              <Text>LORIS status: Not logged in</Text>
              <Link href="/login" asChild>
                <Button title="LORIS Login"/>
              </Link>
            </>
          )
        }
      </View>
      <View style={{ flex: 1, display: 'flex', justifyContent: 'space-evenly' }}>
        <View style={{
          width: '50%',
        }}>
          <TextInput
            style={{
              minWidth: '100%',
              borderWidth: 1,
              marginBottom: 5,
              paddingLeft: 5,
            }}
            value={fromURL}
            placeholder='Enter URL'
            onChangeText={(text) => setFromURL(text)}/>
          <Button
            title="Load from URL"
            onPress={() => loadFromURL(fromURL)}
            disabled={!fromURL}
          />
        </View>
        <Button
          title="Get from BrainWeb"
          onPress={() => loadFromBrainWeb('do_download_alias=subject04_crisp&format_value=minc&zip_value=none&who_name=&who_institution=&who_email=&download_for_real=%5BStart+download%21%5D')}
        />
        <Button
          title="Select Local File"
          onPress={() => alert('Not yet implemented')}
        />
      </View>
    </View>
  );
}