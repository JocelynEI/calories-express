import React, { useEffect, useMemo, useRef } from 'react';
import { ocrMessage, ocrPage, OcrProps } from '../services/ocr/page';
export function OcrReader(props: OcrProps) {
  const frame = useRef<HTMLIFrameElement>(null), latest = useRef(props); latest.current = props;
  const html = useMemo(() => ocrPage(props.base64), [props.base64]);
  useEffect(() => {
    const receive = (event: MessageEvent) => { if (event.source === frame.current?.contentWindow && typeof event.data === 'string') ocrMessage(event.data, latest.current); };
    window.addEventListener('message', receive);
    const timer = setTimeout(() => latest.current.onError('La lecture prend trop de temps. Vérifie la connexion ou recopie les valeurs.'), 120000);
    return () => { window.removeEventListener('message', receive); clearTimeout(timer); };
  }, [html]);
  return <iframe ref={frame} title="Lecture locale de l’étiquette" aria-hidden tabIndex={-1} sandbox="allow-scripts" srcDoc={html} style={{ border: 0, width: 1, height: 1, position: 'absolute', opacity: 0 }} />;
}
