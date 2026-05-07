import { createNavigationContainerRef } from '@react-navigation/native';

export type RootParamList = {
  Login: undefined;
  Main: undefined;
};

export const navigationRef = createNavigationContainerRef<RootParamList>();
