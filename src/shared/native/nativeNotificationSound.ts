import {NativeModules, Platform} from 'react-native';

type DrugsFrontNotificationSoundNative = {
  getRingtoneTitle: (soundUri: string) => Promise<string | null>;
};

const nativeModule = NativeModules.DrugsFrontNotificationSound as
  | DrugsFrontNotificationSoundNative
  | undefined;

export async function getAndroidRingtoneTitle(
  soundUri?: string | null,
): Promise<string | null> {
  if (Platform.OS !== 'android' || !soundUri?.trim() || !nativeModule) {
    return null;
  }

  try {
    const title = await nativeModule.getRingtoneTitle(soundUri.trim());
    return title?.trim() || null;
  } catch {
    return null;
  }
}
