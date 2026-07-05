import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {DocumentsScreen} from '../../../screens/homeTab/documents/DocumentsScreen.tsx';
import {FileScreen} from '../../../screens/homeTab/documents/FileScreen.tsx';
import {FolderScreen} from '../../../screens/homeTab/documents/FolderScreen.tsx';
import {SearchScreen} from '../../../screens/homeTab/documents/SearchScreen.tsx';
import {ProfileScreen} from '../../../screens/profileTab/ProfileScreen.tsx';
import type {FolderBreadcrumbItemDto} from '../../api/apiDocuments.ts';
import type {PrescriptionDocumentDto} from '../../api/drugs/apiDrugs.ts';

export type ProfileTabStackParamList = {
  ProfileScreen: undefined;
  DocumentsScreen: undefined;
  FolderScreen: {parentId: string; title: string};
  SearchScreen: undefined;
  FileScreen: {
    document: PrescriptionDocumentDto;
    breadcrumb?: FolderBreadcrumbItemDto[];
  };
};

const Stack = createNativeStackNavigator<ProfileTabStackParamList>();

export const ProfileTabStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="ProfileScreen"
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="DocumentsScreen" component={DocumentsScreen} />
      <Stack.Screen name="FolderScreen" component={FolderScreen} />
      <Stack.Screen name="SearchScreen" component={SearchScreen} />
      <Stack.Screen name="FileScreen" component={FileScreen} />
    </Stack.Navigator>
  );
};
