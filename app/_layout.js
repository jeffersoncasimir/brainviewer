import React, {useEffect, useState} from "react";
import { Stack } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import * as ScreenOrientation from "expo-screen-orientation";

export const unstable_settings = {
  initialRouteName: "index",
};

export const AppContext = React.createContext(null);

async function getValueFor(key) {
  return await SecureStore.getItemAsync(key);
}

export default function RootLayout() {
  const [token, setToken] = useState(null);
  const [apiURL, setApiURL] = useState(null);
  const [screenOrientation, setScreenOrientation] = useState(0);
  const [shouldScroll, setShouldScroll] = useState(true);
  const DEFAULT_API_URL = 'https://demo-25-0.loris.ca/api/v0.0.3';

  useEffect(() => {
    if (token)
      return;
    getValueFor('loris_token').then((lorisToken) => {
      if (lorisToken) {
        setToken(lorisToken);
        getValueFor('loris_url').then((lorisURL) => {
          if (lorisURL) {
            setApiURL(lorisURL);
          }
        });
      }
    });
  }, [token]);

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


  return (
    <AppContext.Provider value={{
      screenOrientation: screenOrientation,
      token: token,
      setToken: setToken,
      apiURL: apiURL,
      setApiURL: setApiURL,
      shouldScroll: shouldScroll,
      setShouldScroll: setShouldScroll,
      defaultAPI: DEFAULT_API_URL,
    }}>
      <Stack screenOptions={{
        headerTintColor: "#2f7df3",
        headerTitleStyle: {
          fontWeight: "bold"
        }
      }}>
        <Stack.Screen name="index" options={{
          title: 'BrainViewer - Home'
        }}/>
        <Stack.Screen name="login" options={{
          title: 'BrainViewer - LORIS login'
        }}/>
        <Stack.Screen name="projects" options={{
          title: 'BrainViewer - LORIS Projects'
        }}/>
        <Stack.Screen name="images" options={{
          title: 'BrainViewer - Project Images'
        }}/>
        <Stack.Screen name="viewer" options={{
          title: 'BrainViewer - Image Viewer'
        }}/>
      </Stack>
    </AppContext.Provider>
  );
}

