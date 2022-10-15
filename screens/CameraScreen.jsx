import { Camera, CameraType } from 'expo-camera';
import React, { useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator';
import { Box } from 'native-base'

export class CameraScreenClass extends React.Component {
    styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
        },
        camera: {
            flex: 1,
        },
        buttonContainer: {
            flex: 1,
            flexDirection: 'row',
            backgroundColor: 'transparent',
            margin: 64,
        },
        button: {
            flex: 1,
            alignSelf: 'flex-end',
            alignItems: 'center',
        },
        text: {
            fontSize: 24,
            fontWeight: 'bold',
            color: 'white',
        },
    });

    constructor(props) {
        super(props);
        this.state = {
            // cameraPermission: Camera.getCameraPermissionsAsync(),
            type: CameraType.back,
            isCameraReady: false,
        }
        this.setCameraPermission = this.setCameraPermission.bind(this);
        this.setType = this.setType.bind(this);
        this.toggleCameraType = this.toggleCameraType.bind(this);
        this.cameraIsReady = this.cameraIsReady.bind(this);
        this.takePicture = this.takePicture.bind(this);
        // this.requestPermission = this.requestPermission.bind(this);
    }

    setType(type) {
        this.setState({ type: type });
    }

    setCameraPermission(cameraPermission) {
        this.setState({ cameraPermission: cameraPermission });
    }

    toggleCameraType() {
        this.state.type === CameraType.back ? this.setType(CameraType.front) : this.setType(CameraType.back);
    }

    async takePicture() {
        if (this.props.cameraRef.current) {
            var picture = await this.props.cameraRef.current.takePictureAsync();
            const edittedImage = await ImageManipulator.manipulateAsync(
                picture.uri,
                undefined,
                { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
            );
            return this.props.navigation.navigate({
                name: 'Home',
                params: { imageUri: edittedImage.uri },
                merge: true,
            });
        }
    }

    cameraIsReady() {
        this.setState({ isCameraReady: true });
    }

    render() {
        if (!this.props.permission) {
            // Camera permissions are still loading
            return <View />;
        }

        if (!this.props.permission.granted) {
            // Camera permissions are not granted yet
            return (
                <View style={this.styles.container}>
                    <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
                    <Button onPress={this.props.requestPermission} title="grant permission" />
                </View>
            );
        }

        return (
            <View style={this.styles.container}>
                <Camera ref={this.props.cameraRef} style={this.styles.camera} type={this.state.type} onCameraReady={this.cameraIsReady}>
                    <View style={this.styles.buttonContainer}>
                        <TouchableOpacity style={this.styles.button} onPress={this.takePicture}>
                            <Box rounded="full" w="12" h="12" bg="white"/>
                        </TouchableOpacity>
                    </View>
                </Camera>
            </View>
        );
    }
}

export function CameraScreen(props) {
    const navigation = useNavigation();
    const [permission, requestPermission] = Camera.useCameraPermissions();
    const cameraRef = useRef(null);
    return <CameraScreenClass {...props}
        navigation={navigation}
        permission={permission}
        requestPermission={requestPermission}
        cameraRef={cameraRef} />;
}