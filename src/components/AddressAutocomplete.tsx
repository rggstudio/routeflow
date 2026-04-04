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
const RETRIEVE_URL = 'https://api.mapbox.com/search/searchbox/v1/retrieve';

export function AddressAutocomplete({ label, value, onChangeText, placeholder, sessionToken }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // isFocused drives only the border colour — NOT the dropdown visibility.
  const [isFocused, setIsFocused] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef('');
  const suppressFetchRef = useRef(false);
  // Tracks when the user's finger is down on a suggestion row so the blur
  // timeout doesn't collapse the list before onPress fires.
  const isPressingSuggestionRef = useRef(false);

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

  const handleSelect = useCallback(async (suggestion: Suggestion) => {
    // Suppress any in-flight debounce and clear the dropdown immediately.
    suppressFetchRef.current = true;
    setSuggestions([]);
    Keyboard.dismiss();

    if (!MAPBOX_TOKEN) {
      onChangeText(suggestion.place_formatted
        ? `${suggestion.name}, ${suggestion.place_formatted}`
        : suggestion.name);
      return;
    }

    // Retrieve the full address (includes house number) via the retrieve endpoint.
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        session_token: sessionToken,
      });
      const response = await fetch(`${RETRIEVE_URL}/${suggestion.mapbox_id}?${params}`);
      if (!response.ok) throw new Error('Mapbox retrieve failed');

      const data = await response.json();
      const feature = data.features?.[0];
      const full =
        feature?.properties?.full_address ??
        feature?.properties?.name_preferred ??
        feature?.properties?.name ??
        (suggestion.place_formatted
          ? `${suggestion.name}, ${suggestion.place_formatted}`
          : suggestion.name);
      onChangeText(full);
    } catch {
      onChangeText(suggestion.place_formatted
        ? `${suggestion.name}, ${suggestion.place_formatted}`
        : suggestion.name);
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken, onChangeText]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Wait long enough for onPress to fire before clearing the list.
    // The isPressingSuggestion guard prevents clearing while the user is mid-tap.
    setTimeout(() => {
      if (!isPressingSuggestionRef.current) {
        setSuggestions([]);
      }
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Dropdown is visible whenever there are suggestions — independent of isFocused.
  // This is the critical detail: isFocused going false (onBlur) must NOT hide the
  // dropdown, because onPress fires after onBlur and the Pressable must still be mounted.
  const showSuggestions = suggestions.length > 0;

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
              onPressIn={() => { isPressingSuggestionRef.current = true; }}
              onPressOut={() => { isPressingSuggestionRef.current = false; }}
              onPress={() => void handleSelect(suggestion)}
              style={{ minHeight: 52 }}
              className={`flex-row items-center gap-3 px-4 active:bg-white/10 ${
                index < suggestions.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              <Ionicons name="location-outline" size={16} color="#67e8f9" />
              <View className="flex-1 py-3">
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
