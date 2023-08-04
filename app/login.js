import { StatusBar } from "expo-status-bar";
import React, {useContext, useState} from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
} from "react-native";
import * as SecureStore from 'expo-secure-store';
import {useRouter} from "expo-router";
import {AppContext} from "./_layout";

async function save(key, value) {
    await SecureStore.setItemAsync(key, value);
}

export default function Login() {
    const appContext = useContext(AppContext);
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [lorisURL, setLorisURL] = useState('');

    const handleLogin = () => {
        const apiURL = lorisURL ? lorisURL : appContext.defaultAPI;

        fetch(`${apiURL}/login`, {
            method: 'POST',
            body: JSON.stringify({
                username : username,
                password : password,
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
        .then((response) => {
           response.json().then((responseJSON) => {
                if (responseJSON.token) {
                    save('loris_token', responseJSON.token).then(() => {
                        save('loris_url', apiURL)
                          .then(() => {
                            appContext.setApiURL(apiURL);
                            appContext.setToken(responseJSON.token);
                            router.back();
                        });
                    });
                    return true;
                }
                alert('Unable to authenticate with the credentials provided.');
            });
        })
        .catch((err) => {
            console.error(err.message);
        });
    }

    return (
        <View style={styles.container}>
            <Text style={styles.titleText}>API URL</Text>
            <View style={styles.urlView}>
                <TextInput
                  style={styles.TextInput}
                  placeholder={appContext.defaultAPI}
                  textContentType='URL'
                  autoComplete='off'
                  placeholderTextColor="#003f5c"
                  onChangeText={(url) => setLorisURL(url)}
                />
            </View>
            <Text style={styles.titleText}>Enter your credentials</Text>
            <View style={styles.inputView}>
                <TextInput
                    style={styles.TextInput}
                    placeholder="Email."
                    textContentType='username'
                    autoComplete='username'
                    placeholderTextColor="#003f5c"
                    onChangeText={(username) => setUsername(username)}
                />
            </View>
            <View style={styles.inputView}>
                <TextInput
                    style={styles.TextInput}
                    placeholder="Password."
                    textContentType='password'
                    autoComplete='password'
                    placeholderTextColor="#003f5c"
                    secureTextEntry={true}
                    onChangeText={(password) => setPassword(password)}
                />
            </View>
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                <Text style={styles.loginText}>LOGIN</Text>
            </TouchableOpacity>
            <StatusBar style="auto"/>
        </View>
    );

}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    titleText: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    image: {
        marginBottom: 40,
    },
    urlView: {
        backgroundColor: "#fa9d6c",
        borderRadius: 30,
        width: "70%",
        height: 45,
        marginBottom: 20,
        alignItems: "center",
    },
    inputView: {
        backgroundColor: "#1ac1ec",
        borderRadius: 30,
        width: "70%",
        height: 45,
        marginBottom: 20,
        alignItems: "center",
    },
    TextInput: {
        height: 50,
        flex: 1,
        padding: 10,
        marginLeft: 20,
        color: "#ffffff",
    },
    forgot_button: {
        height: 30,
        marginBottom: 30,
    },
    loginBtn: {
        width: "80%",
        borderRadius: 25,
        height: 50,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 40,
        backgroundColor: "#8595ee",
    },
    loginText: {},
});