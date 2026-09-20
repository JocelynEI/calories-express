import { parseProduct, ProductCandidate } from '../domain/foods';

// V2.4 : on demande aussi la photo du produit. Ce sont de vraies
// photographies, prises et versées par les contributeurs d'Open Food Facts —
// rien de dessiné, rien de généré. `small` fait 200 pixels de côté, ce qui
// suffit pour une vignette sans alourdir la recherche.
const FIELDS = 'code,product_name,product_name_fr,brands,quantity,nutrition,nutriments,nutrition_data_per,no_nutrition_data,image_front_small_url,image_front_thumb_url,image_front_url';
export function productSearchUrl(query: string, base = 'https://search.openfoodfacts.org') {
  const text = query.trim();
  // Search-a-licious treats quoted keyword queries differently: a live
  // "yaourt" request returned zero hits while plain yaourt returned matches.
  // Keep keywords as words and remove query operators; quote only barcode fields.
  const expression = /^\d{8,14}$/.test(text) ? `code:"${text}"` : text.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\b(?:AND|OR|NOT)\b/g, ' ').replace(/\s+/g, ' ').trim();
  return `${base}/search?q=${encodeURIComponent(expression)}&page_size=12&langs=fr,en&fields=${FIELDS}`;
}

export function createProductSearch(fetcher: typeof fetch = fetch, now: () => number = Date.now) {
  const cache = new Map<string, { at: number; values: ProductCandidate[] }>();
  const requests: number[] = [];
  return async function search(query: string, signal?: AbortSignal): Promise<ProductCandidate[]> {
    const q = query.trim();
    if (q.length < 3 || q.length > 80) throw new Error('Saisis au moins 3 caractères : produit, marque ou chiffres du code-barres.');
    const key = q.toLocaleLowerCase('fr-FR');
    const stored = cache.get(key);
    if (stored && now() - stored.at < 300000) return stored.values;
    while (requests.length && now() - requests[0] >= 60000) requests.shift();
    if (requests.length >= 8) throw new Error('Plusieurs recherches viennent d’être lancées. Attends une minute ou utilise les résultats hors ligne.');
    requests.push(now());
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    signal?.addEventListener('abort', abort);
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
    try {
      const response = await fetcher(productSearchUrl(q), { signal: controller.signal, headers: { 'User-Agent': 'CaloriesExpress/1.5 (private Expo prototype)', Accept: 'application/json' } });
      if (response.status === 429) throw new Error('La base limite temporairement les recherches. Les aliments Ciqual restent accessibles hors ligne.');
      if (response.status === 404 && /^\d{8,14}$/.test(q)) return [];
      if (!response.ok) throw new Error('La recherche de marques est momentanément indisponible. Les estimations Ciqual restent disponibles hors ligne.');
      let body;
      try { body = await response.json(); } catch { throw new Error('La base a renvoyé une réponse illisible. Les résultats hors ligne restent disponibles.'); }
      if (!body || typeof body !== 'object') throw new Error('La réponse de la base est incomplète. Les résultats hors ligne restent disponibles.');
      if (!Array.isArray(body.hits)) throw new Error('Réponse de la recherche de marques incomplète. Utilise les résultats hors ligne.');
      const raw = body.hits;
      const seen = new Set<string>();
      const values = raw.map(parseProduct).filter((p: ProductCandidate | null): p is ProductCandidate => {
        if (!p || seen.has(p.id) || (/^\d{8,14}$/.test(q) && p.id !== `off-${q}`)) return false; seen.add(p.id); return true;
      });
      if (cache.size >= 30) cache.delete(cache.keys().next().value!);
      cache.set(key, { at: now(), values });
      return values;
    } catch (error) {
      if (timedOut) throw new Error('La recherche prend trop de temps. Les estimations hors ligne sont disponibles ci-dessus.');
      if (signal?.aborted) throw error;
      if (error instanceof Error && !/fetch|network|abort/i.test(error.message)) throw error;
      throw new Error('Connexion à la base impossible. Les aliments Ciqual restent accessibles sans connexion.');
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  };
}

export const searchProducts = createProductSearch();
