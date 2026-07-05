import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {DocumentsScreen} from '../../../screens/homeTab/documents/DocumentsScreen.tsx';
import {FileScreen} from '../../../screens/homeTab/documents/FileScreen.tsx';
import {FolderScreen} from '../../../screens/homeTab/documents/FolderScreen.tsx';
import {HomeScreen} from '../../../screens/homeTab/HomeScreen.tsx';
import {NotificationsScreen} from '../../../screens/homeTab/NotificationsScreen.tsx';
import {SearchScreen} from '../../../screens/homeTab/documents/SearchScreen.tsx';
import type {FolderBreadcrumbItemDto} from '../../api/apiDocuments.ts';
import type {PrescriptionDocumentDto} from '../../api/drugs/apiDrugs.ts';

export type HomeTabStackParamList = {
  HomeScreen: undefined;
  NotificationsScreen: undefined;
  DocumentsScreen: undefined;
  FolderScreen: {parentId: string; title: string};
  SearchScreen: undefined;
  FileScreen: {
    document: PrescriptionDocumentDto;
    breadcrumb?: FolderBreadcrumbItemDto[];
  };
};

const Stack = createNativeStackNavigator<HomeTabStackParamList>();

export const HomeTabStack = () => {
  return (
    <Stack.Navigator initialRouteName="HomeScreen" screenOptions={{headerShown: false}}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
      <Stack.Screen name="DocumentsScreen" component={DocumentsScreen} />
      <Stack.Screen name="FolderScreen" component={FolderScreen} />
      <Stack.Screen name="SearchScreen" component={SearchScreen} />
      <Stack.Screen name="FileScreen" component={FileScreen} />
    </Stack.Navigator>
  );
};
