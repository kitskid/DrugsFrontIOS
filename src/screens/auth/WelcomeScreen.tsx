import {useEffect, useState} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ME_STORAGE_KEY} from '../../features/api/index.ts';
import {AuthStartHero} from '../../widgets/auth/AuthStartHero.tsx';

export const WelcomeScreen = () => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    return () => {
      StatusBar.setBarStyle('dark-content');
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = JSON.parse((await AsyncStorage.getItem(ME_STORAGE_KEY))!);
        setName(me.name || null);
      } catch {
        setName(null);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <AuthStartHero topInset={insets.top} name={name} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
