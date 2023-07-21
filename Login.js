import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    TextInput,
    Button,
    TouchableOpacity,
} from "react-native";
import * as SecureStore from 'expo-secure-store';

async function save(key, value) {
    await SecureStore.setItemAsync(key, value);
}

export class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: ''
        }
    };


    handleLogin = () => {
        fetch('https://demo-25-0.loris.ca/api/v0.0.3/login/', {
            method: 'POST',
            body: JSON.stringify({
                username : this.state.username,
                password : this.state.password,
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
                            this.props.setToken(responseJSON.token);
                            return true;
                        });
                    }
                });
            })
            // .then((data) => {
            //     if (data === null) {
            //         console.log('Incorrect credentials');
            //         console.log(`"${this.state.username}" -- "${this.state.password}"`);
            //     } else {
            //         console.log(`saving token: ${data.token}`);
            //
            //     }
            // })
            .catch((err) => {
                console.log(err.message);
            });
    }

    render() {
        return (
            <View style={styles.container}>
                {/*<Image style={styles.image} source={require("./assets/log2.png")} />*/}
                <Text style={styles.titleText}>Enter your credentials</Text>
                <StatusBar style="auto"/>
                <View style={styles.inputView}>
                    <TextInput
                        style={styles.TextInput}
                        placeholder="Email."
                        placeholderTextColor="#003f5c"
                        onChangeText={(username) => this.setState({
                            username: username
                        })}
                    />
                </View>
                <View style={styles.inputView}>
                    <TextInput
                        style={styles.TextInput}
                        placeholder="Password."
                        placeholderTextColor="#003f5c"
                        secureTextEntry={true}
                        onChangeText={(password) => this.setState({
                          password: password
                        })}
                    />
                </View>
                {/*<TouchableOpacity>*/}
                {/*    <Text style={styles.forgot_button}>Forgot Password?</Text>*/}
                {/*</TouchableOpacity>*/}
                <TouchableOpacity style={styles.loginBtn} onPress={this.handleLogin}>
                    <Text style={styles.loginText}>LOGIN</Text>
                </TouchableOpacity>
            </View>
        );
    }
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
});