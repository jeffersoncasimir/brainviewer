import * as React from 'react';
import {Button, View, Text, Pressable} from "react-native";
import { Link, useNavigation, useRouter } from "expo-router";
import {useContext} from "react";
import {AppContext} from "./_layout";
import * as SecureStore from "expo-secure-store";
import app from "react-native/template/App";

export default function Index() {
  const appContext = useContext(AppContext);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-evenly' }}>
      <View >
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
      </View>
      {
        appContext.token
        ? (
          <View style={{ flex: 0.2, justifyContent: 'space-between' }}>
            <Text>LORIS status: Logged in</Text>
            <Link href="/viewer" asChild>
              <Button title="View Demo"/>
            </Link>
            <Button
              title="LORIS Logout"
              onPress={() => {
                SecureStore.deleteItemAsync('loris_token', null);
                appContext.setToken(null);
              }}
            />
          </View>
        )
        : (
          <View >
            <Text>LORIS status: Not logged in</Text>
            <Link href="/login" asChild>
              <Button title="LORIS Login"/>
            </Link>
          </View>
        )
      }
      <Button
        title="Load from URL"
        onPress={() => console.log('Not yet implemented')}
      />
      <Button
        title="Select Local File"
        onPress={() => console.log('Not yet implemented')}
      />
    </View>
  );
}