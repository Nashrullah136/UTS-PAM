import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Image, StyleSheet, Text, Alert, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

class HomeScreenClass extends React.Component {

    MB = 1024 * 1024;

    styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
        },
        logo: {
            width: 305,
            height: 159,
            marginBottom: 20,
        },
        instructions: {
            color: '#888',
            fontSize: 18,
            marginHorizontal: 15,
            marginBottom: 10,
        },
        button: {
            backgroundColor: 'blue',
            padding: 20,
            borderRadius: 5,
        },
        buttonText: {
            fontSize: 20,
            color: '#fff',
        },
        thumbnail: {
            width: 300,
            height: 300,
            resizeMode: 'contain',
        },
    });


    constructor(props) {
        super(props)
        this.state = {
            imageUri: "https://i.imgur.com/TkIrScD.png",
        };
        this.goToCamara = this.goToCamara.bind(this);
        this.openImagePicker = this.openImagePicker.bind(this);
        this.getOcrImage = this.getOcrImage.bind(this);
        const { navigation } = this.props;
        this.navigation = navigation;
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.route.params?.imageUri && prevState.imageUri !== this.props.route.params?.imageUri) {
            console.log("image uri from camera");
            console.log(this.props.route.params?.imageUri);
            this.setImageUri(this.props.route.params?.imageUri);
            this.navigation.setParams({ imageUri: "" });
        }
    }

    setImageUri(image) {
        this.setState({ imageUri: image });
    }


    async openImagePicker() {
        let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            alert("Permission to access camera roll is required!");
            return;
        }
        const imageUri = await ImagePicker.launchImageLibraryAsync();
        if (imageUri.cancelled === true) {
            return;
        }
        const edittedImage = await ImageManipulator.manipulateAsync(
            imageUri.uri,
            undefined,
            { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
        );
        console.log("picker");
        console.log(edittedImage);
        this.setImageUri(edittedImage.uri);
    }

    goToCamara() {
        return this.navigation.navigate('Camera');
    }

    async getOcrImage() {
        var edittedImageUri = this.state.imageUri;
        var imageInfo = await FileSystem.getInfoAsync(edittedImageUri, { size: true });
        while (imageInfo.size > 1 * this.MB) {
            edittedImageUri = (await ImageManipulator.manipulateAsync(edittedImageUri,
                undefined,
                { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG })).uri;
            imageInfo = await FileSystem.getInfoAsync(edittedImageUri, { size: true });
        }
        console.log("image info");
        console.log(imageInfo);
        var result = await this.postFile(edittedImageUri);
        console.log("result request");
        console.log(result);
        if (result.IsErroredOnProcessing) {
            Alert.alert(
                "Error",
                "Can't get OCR Image",
                [
                    { text: "OK", onPress: () => console.log("OK Pressed") }
                ]
            );
            return;
        }
        var parsedText = result.ParsedResults[0].ParsedText;
        Alert.alert(
            "Result",
            parsedText,
            [
                { text: "OK", onPress: () => console.log("OK Pressed") }
            ]
        );
    }

    async postFile(imageUri) {
        var imageBase64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
        var myHeaders = new Headers();
        myHeaders.append("apiKey", "K86474894488957");

        var formdata = new FormData();
        formdata.append("base64image", "data:image/jpeg;base64," + imageBase64);
        formdata.append("filetype", "png");
        console.log("send data with body request");
        console.log(formdata);
        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: formdata,
            redirect: 'follow'
        };
        var result = await fetch("https://api.ocr.space/parse/image", requestOptions);
        return result.json();
    }

    render() {

        return (
            <View style={this.styles.container}>
                <Image source={{ uri: this.state.imageUri }} style={this.styles.logo} />
                <Text style={this.styles.instructions}>
                    To share a photo from your phone with a friend, just press the button below!
                </Text>

                <TouchableOpacity onPress={this.openImagePicker} style={this.styles.button}>
                    <Text style={this.styles.buttonText}>Pick a photo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={this.goToCamara} style={this.styles.button}>
                    <Text style={this.styles.buttonText}>Take a photo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={this.getOcrImage} style={this.styles.button}>
                    <Text style={this.styles.buttonText}>Get OCR</Text>
                </TouchableOpacity>
            </View>
        );
    }
}

export function HomeScreen(props) {
    const navigation = useNavigation();

    return <HomeScreenClass {...props} navigation={navigation} />;
}