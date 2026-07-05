import {useRef} from 'react';
import {
    Animated,
    type GestureResponderEvent,
    Pressable,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import type {NavigatorScreenParams} from '@react-navigation/native';
import {
    createBottomTabNavigator,
    type BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';

import {CalendarTabStack} from '../features/navigation/tabs/CalendarTabStack.tsx';
import {DrugsTabStack} from '../features/navigation/tabs/DrugsTabStack.tsx';
import {HomeTabStack} from '../features/navigation/tabs/HomeTabStack.tsx';
import {
    ProfileTabStack,
    type ProfileTabStackParamList,
} from '../features/navigation/tabs/ProfileTabStack.tsx';
import {IconMapper} from '../shared/ui/IconMapper';
import {useSafeAreaInsets} from "react-native-safe-area-context";

export type TabsStackParamList = {
    HomeTab: undefined;
    CalendarTab: undefined;
    DrugsTab: undefined;
    ProfileTab: NavigatorScreenParams<ProfileTabStackParamList> | undefined;
};

const Tab = createBottomTabNavigator<TabsStackParamList>();
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ACTIVE_ICON_COLOR = 'rgba(35, 142, 235, 1)';
const INACTIVE_ICON_COLOR = 'rgba(199, 198, 217, 1)';

const TabBarAnimatedButton = ({
                                  accessibilityState,
                                  accessibilityLabel,
                                  children,
                                  onLongPress,
                                  onPress,
                                  style,
                                  testID,
                              }: BottomTabBarButtonProps) => {
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const longPressTriggeredRef = useRef(false);

    const animatePressIn = () => {
        Animated.parallel([
            Animated.spring(scale, {
                toValue: 0.92,
                tension: 280,
                friction: 14,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0.82,
                duration: 110,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const animatePressOut = () => {
        Animated.parallel([
            Animated.spring(scale, {
                toValue: 1,
                tension: 240,
                friction: 13,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 140,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePress = (event: GestureResponderEvent) => {
        longPressTriggeredRef.current = false;
        onPress?.(event);
    };

    const handleLongPress = (event: GestureResponderEvent) => {
        longPressTriggeredRef.current = true;
        onLongPress?.(event);
    };

    const handlePressOut = (event: GestureResponderEvent) => {
        animatePressOut();
        if (longPressTriggeredRef.current) {
            longPressTriggeredRef.current = false;
            onPress?.(event);
        }
    };

    return (
        <AnimatedPressable
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            testID={testID}
            android_ripple={{color: 'transparent'}}
            onPressIn={animatePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            onLongPress={handleLongPress}
            style={[
                style as StyleProp<ViewStyle>,
                {
                    transform: [{scale}],
                    opacity,
                },
            ]}>
            {children}
        </AnimatedPressable>
    );
};

const renderHomeTabIcon = ({focused}: { focused: boolean }) => (
    <IconMapper
        icon={focused ? 'home-filled' : 'home-outline'}
        size={32}
        color={focused ? ACTIVE_ICON_COLOR : INACTIVE_ICON_COLOR}
    />
);

const renderCalendarTabIcon = ({focused}: { focused: boolean }) => (
    <IconMapper
        icon={focused ? 'calendar-event-filled' : 'calendar-event-outline'}
        size={32}
        color={focused ? ACTIVE_ICON_COLOR : INACTIVE_ICON_COLOR}
    />
);

const renderDrugsTabIcon = ({focused}: { focused: boolean }) => (
    <IconMapper
        icon={focused ? 'pill-filled' : 'pill-outline'}
        size={32}
        color={focused ? ACTIVE_ICON_COLOR : INACTIVE_ICON_COLOR}
    />
);

const renderProfileTabIcon = ({focused}: { focused: boolean }) => (
    <IconMapper
        icon={focused ? 'user-filled' : 'user-outline'}
        size={32}
        color={focused ? ACTIVE_ICON_COLOR : INACTIVE_ICON_COLOR}
    />
);

const renderTabBarButton = (props: BottomTabBarButtonProps) => (
    <TabBarAnimatedButton {...props} />
);

export const TabsStack = () => {
    const insets = useSafeAreaInsets();
    return (
        <Tab.Navigator
            initialRouteName="HomeTab"
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarButton: renderTabBarButton,
                tabBarStyle: {
                    height: 78,
                    paddingTop: 12,
                    paddingBottom: insets.bottom,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(241, 240, 249, 1)',
                    backgroundColor: '#FFFFFF',
                },
            }}>
            <Tab.Screen
                name="HomeTab"
                component={HomeTabStack}
                options={{
                    tabBarIcon: renderHomeTabIcon,
                }}
            />
            <Tab.Screen
                name="CalendarTab"
                component={CalendarTabStack}
                options={{
                    tabBarIcon: renderCalendarTabIcon,
                }}
            />
            <Tab.Screen
                name="DrugsTab"
                component={DrugsTabStack}
                options={{
                    tabBarIcon: renderDrugsTabIcon,
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileTabStack}
                options={{
                    tabBarIcon: renderProfileTabIcon,
                }}
            />
        </Tab.Navigator>
    );
};
