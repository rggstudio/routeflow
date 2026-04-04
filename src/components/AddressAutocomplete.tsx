import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';

type Suggestion = {
  mapbox_id: string;
  name: string;
  place_formatted: string;
  full_address: string;
};

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  sessionToken: string;
};

const MAPBOX_TOKEN: string = Constants.expoConfig?.extra?.mapboxKey ?? '';
const SUGGEST_URL = 'https://api.mapbox.com/search/searchbox/v1/suggest';

function formatAddress(suggestion: Suggestion): string {
  if (suggestion.full_address) return suggestion.full_address;
  if (suggestion.place_formatted) return `${suggestion.name}, ${suggestion.place_formatted}`;
  return suggestion.name;
}

export function AddressAutocomplete({ label, value, onChangeText, placeholder, sessionToken }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef('');
  const suppressFetchRef = useRef(false);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!MAPBOX_TOKEN || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        access_token: MAPBOX_TOKEN,
        session_token: sessionToken,
        types: 'address,street',
        limit: '6',
        language: 'en',
        country: 'us',
      });

      const response = await fetch(`${SUGGEST_URL}?${params}`);
      if (!response.ok) throw new Error('Mapbox suggest failed');

      const data = await response.json();
      if (lastQueryRef.current === query) {
        setSuggestions(data.suggestions ?? []);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
    lastQueryRef.current = text;
    suppressFetchRef.current = false;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      if (!suppressFetchRef.current) {
        void fetchSuggestions(text);
      }
    }, 300);
  }, [fetchSuggestions, onChangeText]);

  const handleSelect = useCallback((suggestion: Suggestion) => {
    const address = formatAddress(suggestion);
    suppressFetchRef.current = true;
    onChangeText(address);
    setSuggestions([]);
    Keyboard.dismiss();
  }, [onChangeText]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setTimeout(() => setSuggestions([]), 150);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const showSuggestions = isFocused && suggestions.length > 0;

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-slate-300">{label}</Text>

      <View
        className={`rounded-3xl border bg-white/5 ${
          isFocused ? 'border-cyan-400/60' : 'border-white/10'
        }`}
      >
        <View className="flex-row items-center px-4 py-3">
          <Ionicons name="location-outline" size={16} color={isFocused ? '#67e8f9' : '#64748b'} />
          <TextInput
            className="ml-2 flex-1 text-white"
            placeholder={placeholder ?? 'Search address…'}
            placeholderTextColor="#64748b"
            value={value}
            onChangeText={handleChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            returnKeyType="done"
          />
          {isLoading ? (
            <ActivityIndicator size="small" color="#67e8f9" />
          ) : value.length > 0 ? (
            <Pressable
              onPress={() => {
                onChangeText('');
                setSuggestions([]);
              }}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {showSuggestions && (
        <View className="mt-1 overflow-hidden rounded-2xl border border-white/10 bg-slate-800">
          {suggestions.map((suggestion, index) => (
            <Pressable
              key={suggestion.mapbox_id}
              onPress={() => handleSelect(suggestion)}
              className={`flex-row items-start gap-3 px-4 py-3 active:bg-white/10 ${
                index < suggestions.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              <Ionicons name="location-outline" size={15} color="#67e8f9" style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-sm font-medium text-white" numberOfLines={1}>
                  {suggestion.name}
                </Text>
                {suggestion.place_formatted ? (
                  <Text className="mt-0.5 text-xs text-slate-400" numberOfLines={1}>
                    {suggestion.place_formatted}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
