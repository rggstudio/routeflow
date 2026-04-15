import Ionicons from '@expo/vector-icons/Ionicons';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastTone = 'success' | 'error' | 'info';

type ToastOptions = {
  title: string;
  message?: string;
  tone?: ToastTone;
  duration?: number;
};

type ToastState = ToastOptions & {
  id: number;
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
};

type ToastPalette = {
  border: string;
  background: string;
  title: string;
  message: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
};

const TOAST_DURATION_MS = 2400;

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-18)).current;
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const hideToast = useCallback(() => {
    clearHideTimeout();

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -18,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setToast(null);
      }
    });
  }, [clearHideTimeout, opacity, translateY]);

  const showToast = useCallback(
    ({ duration = TOAST_DURATION_MS, tone = 'success', ...options }: ToastOptions) => {
      clearHideTimeout();
      setToast({ ...options, duration, tone, id: Date.now() });
    },
    [clearHideTimeout]
  );

  useEffect(() => {
    if (!toast) {
      return;
    }

    opacity.setValue(0);
    translateY.setValue(-18);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 180,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start();

    hideTimeoutRef.current = setTimeout(() => {
      hideToast();
    }, toast.duration);

    return clearHideTimeout;
  }, [clearHideTimeout, hideToast, opacity, toast, translateY]);

  const value = useMemo(
    () => ({
      showToast,
      hideToast,
    }),
    [hideToast, showToast]
  );

  const palette: ToastPalette =
    toast?.tone === 'error'
      ? {
          border: 'border-rose-400/40',
          background: 'bg-rose-950/95',
          title: 'text-rose-50',
          message: 'text-rose-100/80',
          icon: 'alert-circle',
          iconColor: '#fda4af',
        }
      : toast?.tone === 'info'
        ? {
            border: 'border-cyan-400/40',
            background: 'bg-slate-900/95',
            title: 'text-cyan-50',
            message: 'text-cyan-100/75',
            icon: 'information-circle',
            iconColor: '#67e8f9',
          }
        : {
            border: 'border-emerald-400/40',
            background: 'bg-emerald-950/95',
            title: 'text-emerald-50',
            message: 'text-emerald-100/80',
            icon: 'checkmark-circle',
            iconColor: '#6ee7b7',
          };

  return (
    <ToastContext.Provider value={value}>
      <View className="flex-1">
        {children}
        {toast ? (
          <View
            pointerEvents="box-none"
            className="absolute left-4 right-4 z-50"
            style={{ top: insets.top + 12 }}
          >
            <Animated.View
              style={{
                opacity,
                transform: [{ translateY }],
                shadowColor: '#020617',
                shadowOffset: { width: 0, height: 14 },
                shadowOpacity: 0.28,
                shadowRadius: 24,
                elevation: 10,
              }}
            >
              <Pressable
                className={`flex-row items-start gap-3 rounded-[28px] border px-4 py-4 ${palette.border} ${palette.background}`}
                onPress={hideToast}
              >
                <Ionicons name={palette.icon} size={20} color={palette.iconColor} />
                <View className="flex-1">
                  <Text className={`text-sm font-semibold ${palette.title}`}>{toast.title}</Text>
                  {toast.message ? (
                    <Text className={`mt-1 text-sm leading-5 ${palette.message}`}>{toast.message}</Text>
                  ) : null}
                </View>
              </Pressable>
            </Animated.View>
          </View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}
