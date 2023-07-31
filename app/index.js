import {Button, View, Text} from "react-native";
import * as SecureStore from "expo-secure-store";
import {Link} from "expo-router";
import {useContext} from 'react';
import {AppContext} from "./_layout";

export default function Index() {
  const appContext = useContext(AppContext);

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
        <Button
          title="Load from URL"
          onPress={() => console.log('Not yet implemented')}
        />
        <Button
          title="Select Local File"
          onPress={() => console.log('Not yet implemented')}
        />
      </View>
    </View>
  );
}