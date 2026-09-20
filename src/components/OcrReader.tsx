import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { ocrMessage, ocrPage, OcrProps } from '../services/ocr/page';
export function OcrReader(props: OcrProps) {
  const latest = useRef(props); latest.current = props;
  const html = useMemo(() => ocrPage(props.base64), [props.base64]);
  useEffect(() => { const timer = setTimeout(() => latest.current.onError('La lecture prend trop de temps. Vérifie la connexion, reprends la photo ou saisis les valeurs.'), 120000); return () => clearTimeout(timer); }, [html]);
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: 1, width: 1, overflow: 'hidden' }}><WebView style={{ height: 1, width: 1 }} originWhitelist={['*']} source={{ html, baseUrl: 'https://localhost/' }} javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback={false} onMessage={event => ocrMessage(event.nativeEvent.data, latest.current)} onError={() => latest.current.onError('La lecture n’a pas pu démarrer. Réessaie ou saisis les valeurs.')} onContentProcessDidTerminate={() => latest.current.onError('Lecture interrompue. Essaie une photo plus rapprochée.')} onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url === 'https://localhost/'} /></View>;
}
