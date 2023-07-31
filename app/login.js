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


    const handleLogin = () => {
        fetch('https://demo-25-0.loris.ca/api/v0.0.3/login/', {
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
                    console.log('response ok');
                    save('loris_token', responseJSON.token).then(() => {
                        appContext.setToken(responseJSON.token);
                        router.back();
                    });
                    return true;
                }
                alert('Unable to authenticate with the credentials provided.');
            });
        })
        .catch((err) => {
            console.log(err.message);
        });
    }

    return (
        <View style={styles.container}>
            <Text style={styles.titleText}>Enter your credentials</Text>
            <StatusBar style="auto"/>
            <View style={styles.inputView}>
                <TextInput
                    style={styles.TextInput}
                    placeholder="Email."
                    placeholderTextColor="#003f5c"
                    onChangeText={(username) => setUsername(username)}
                />
            </View>
            <View style={styles.inputView}>
                <TextInput
                    style={styles.TextInput}
                    placeholder="Password."
                    placeholderTextColor="#003f5c"
                    secureTextEntry={true}
                    onChangeText={(password) => setPassword(password)}
                />
            </View>
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                <Text style={styles.loginText}>LOGIN</Text>
            </TouchableOpacity>
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