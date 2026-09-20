// Pinned open-source OCR engine. Images are processed in the local WebView / iframe.
// jsDelivr serves code + French model only, never receives the image.
export function ocrPage(base64: string): string {
  if (!/^[A-Za-z0-9+/=]+$/.test(base64) || base64.length > 12000000) throw new Error('Cette photo est trop grande ou invalide. Reprends une photo centrée sur le tableau.');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net; worker-src blob: https://cdn.jsdelivr.net; connect-src https://cdn.jsdelivr.net blob: data:; img-src data: blob:; style-src 'unsafe-inline'"></head><body><script>
  var worker=null, ended=false;
  function send(type,value){var message=JSON.stringify({channel:'calories-label-ocr',type:type,value:value});if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(message);else window.parent.postMessage(message,'*');}
  function fail(){if(ended)return;ended=true;send('error','Lecture indisponible. Vérifie ta connexion ou recopie les valeurs du tableau.');if(worker)worker.terminate();}
  window.addEventListener('error',fail);window.addEventListener('unhandledrejection',fail);
  var script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';script.onerror=fail;
  script.onload=async function(){try{
    send('progress',5);
    worker=await Tesseract.createWorker('fra',1,{
      workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',
      corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0',
      langPath:'https://cdn.jsdelivr.net/npm/@tesseract.js-data/fra@1.0.0/4.0.0_best_int',
      cacheMethod:'none',
      logger:function(m){if(m.status==='recognizing text')send('progress',Math.round(30+m.progress*70));},errorHandler:fail
    });
    if(ended){await worker.terminate();return;}
    await worker.setParameters({tessedit_pageseg_mode:'6'});
    var result=await worker.recognize('data:image/jpeg;base64,${base64}');
    if(!ended){ended=true;send('done',String(result.data.text||'').slice(0,30000));}
    await worker.terminate();worker=null;
  }catch(e){fail();}};document.head.appendChild(script);
  </script></body></html>`;
}
export type OcrProps = { base64: string; onText: (text: string) => void; onError: (error: string) => void; onProgress: (progress: number) => void };
export function ocrMessage(data: string, callbacks: OcrProps) {
  try { const value = JSON.parse(data); if (value.channel !== 'calories-label-ocr') return;
    if (value.type === 'done' && typeof value.value === 'string') callbacks.onText(value.value.slice(0, 30000));
    else if (value.type === 'error') callbacks.onError('La lecture n’a pas abouti. Réessaie avec une photo nette ou saisis les valeurs ci-dessous.');
    else if (value.type === 'progress' && Number.isFinite(value.value)) callbacks.onProgress(Math.max(0, Math.min(100, value.value)));
  } catch { /* Ignore malformed bridge events. */ }
}
