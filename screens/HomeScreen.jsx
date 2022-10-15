import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Image, ToastAndroid, Text, Alert, ActivityIndicator, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Center, Container, VStack, HStack, Box, TextArea, Button, ZStack } from 'native-base';
import * as Clipboard from 'expo-clipboard';

class HomeScreenClass extends React.Component {

    MB = 1024 * 1024;

    constructor(props) {
        super(props)
        this.state = {
            imageUri: "https://i.imgur.com/TkIrScD.png",
            ocrResult: "",
            processing: false
        };
        this.goToCamara = this.goToCamara.bind(this);
        this.openImagePicker = this.openImagePicker.bind(this);
        this.getOcrImage = this.getOcrImage.bind(this);
        this.setOcrResult = this.setOcrResult.bind(this);
        this.copyToClipboard = this.copyToClipboard.bind(this);
        this.Loading = this.Loading.bind(this);
        const { navigation } = this.props;
        this.navigation = navigation;
    }

    async componentDidUpdate(prevProps, prevState) {
        if (this.props.route.params?.imageUri && prevState.imageUri !== this.props.route.params?.imageUri) {
            console.log("image uri from camera");
            console.log(this.props.route.params?.imageUri);
            await this.setImageUri(this.props.route.params?.imageUri);
            this.navigation.setParams({ imageUri: "" });
            await this.getOcrImage();
        }
    }

    async setImageUri(image) {
        this.setState({ imageUri: image });
    }

    setOcrResult(result) {
        this.setState({ ocrResult: result });
    }

    async setProcessing(state){
        this.setState({processing: state});
    }

    async openImagePicker() {
        let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            alert("Permission to access camera roll is required!");
            return 0;
        }
        const imageUri = await ImagePicker.launchImageLibraryAsync();
        if (imageUri.cancelled === true) {
            return 0;
        }
        const edittedImage = await ImageManipulator.manipulateAsync(
            imageUri.uri,
            undefined,
            { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
        );
        console.log("picker");
        console.log(edittedImage);
        this.setImageUri(edittedImage.uri);
        return edittedImage.uri;
    }

    goToCamara() {
        return this.navigation.navigate('Camera');
    }

    async getOcrImage() {
        this.setProcessing(true);
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
        var parsedText = result.ParsedResults[0].ParsedText;
        if (result.IsErroredOnProcessing || parsedText.length === 0) {
            Alert.alert(
                "Error",
                "Can't get OCR Image",
                [
                    { text: "OK", onPress: () => console.log("OK Pressed") }
                ]
            );
        }
        this.setOcrResult(parsedText);
        this.setProcessing(false);
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

    async copyToClipboard() {
        await Clipboard.setStringAsync(this.state.ocrResult);
        ToastAndroid.show("Copied!", ToastAndroid.SHORT);
    }

    Loading() {
        if (this.state.processing) {
            return (
                <Box w="full" h="full" bg="rgba(192, 192, 192, 0.5)" flex={1} justifyContent="space-evenly" borderRadius="xl" is>
                    <ActivityIndicator size="large" />
                </Box>);
        }
        return;
    }

    render() {

        return (
            <Center flex={1} px="3" bg="white">
                <Center>
                    <Container size="md">
                        <VStack w="100%" h="100%" space={5} >
                            <Box borderStyle="dashed" shadow="1" flex="1" borderRadius="xl">
                                <ZStack alignItems="center" w="100%" h="100%">
                                    <this.Loading />
                                    <TextArea numberOfLines={4}
                                        w="100%"
                                        h="full"
                                        value={this.state.ocrResult || 'We will put OCR result here'}
                                        borderRadius="xl"
                                        fontSize="md"
                                        color="black"
                                        isDisabled
                                    />
                                </ZStack>
                            </Box>
                            <Box>
                                <HStack justifyContent="space-between">
                                    <Button onPress={this.goToCamara}>Take a Picture</Button>
                                    <Button onPress={this.copyToClipboard}>Copy Result</Button>
                                    <Button onPress={async () => await this.openImagePicker() && await this.getOcrImage()}>Choose a Picture</Button>
                                </HStack>
                            </Box>
                        </VStack>
                    </Container>
                </Center>
            </Center>
        );
    }
}

export function HomeScreen(props) {
    const navigation = useNavigation();

    return <HomeScreenClass {...props} navigation={navigation} />;
}