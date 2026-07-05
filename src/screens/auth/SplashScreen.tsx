import {Image, StyleSheet, View} from 'react-native';

export const SplashScreen = () => {
    return (
        <View style={styles.container}>
            <Image source={require('../../../assets/images/logoLarge.png')} style={styles.logo}/>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 1)',
    },
    logo: {
        width: 200,
        height: 164,
    },
});
