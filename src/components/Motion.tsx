import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useExperience } from '../state/ExperienceContext';

export function Entrance({ children, delay = 0, style }: PropsWithChildren<{ delay?: number; style?: StyleProp<ViewStyle> }>) {
  const { reducedMotion } = useExperience();
  const value = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reducedMotion) { value.setValue(1); return; }
    value.setValue(0);
    const animation = Animated.timing(value, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true, isInteraction: false });
    animation.start(); return () => animation.stop();
  }, [delay, reducedMotion, value]);
  return <Animated.View style={[style, { opacity: value, transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>{children}</Animated.View>;
}
export function MotionPressable({ children, containerStyle, onPressIn, onPressOut, ...props }: PressableProps & { containerStyle?: StyleProp<ViewStyle> }) {
  const { reducedMotion } = useExperience();
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (toValue: number) => {
    if (reducedMotion) { scale.setValue(1); return; }
    Animated.spring(scale, { toValue, speed: 35, bounciness: 3, useNativeDriver: true }).start();
  };
  useEffect(() => { if (reducedMotion) scale.setValue(1); return () => scale.stopAnimation(); }, [reducedMotion, scale]);
  return <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
    <Pressable {...props} onPressIn={event => { animate(0.965); onPressIn?.(event); }} onPressOut={event => { animate(1); onPressOut?.(event); }}>{children}</Pressable>
  </Animated.View>;
}
