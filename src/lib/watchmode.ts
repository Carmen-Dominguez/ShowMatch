import {
  WatchmodeTitle,
  WatchmodeListResponse,
  WatchmodeListTitle,
  ContentFilters,
} from '@/types';

const BASE_URL = 'https://api.watchmode.com/v1';

function getApiKey(): string {
  const key = process.env.NEXT_PUBLIC_WATCHMODE_API_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_WATCHMODE_API_KEY environment variable is not set');
  }
  return key;
}

export async function fetchTitlesList(
  sourceIds: number[],
  region: string,
  filters: ContentFilters,
  page: number = 1
): Promise<WatchmodeListResponse> {
  const apiKey = getApiKey();
  const params = new URLSearchParams({
    apiKey,
    source_ids: sourceIds.join(','),
    regions: region,
    page: page.toString(),
    limit: '20',
  });

  if (filters.contentType !== 'all') {
    params.set('types', filters.contentType === 'movie' ? 'movie' : 'tv_series');
  }

  if (filters.genres.length > 0) {
    params.set('genres', filters.genres.join(','));
  }

  const response = await fetch(`${BASE_URL}/list-titles/?${params.toString()}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Watchmode API error ${response.status}: ${errorText}`);
  }
  return response.json() as Promise<WatchmodeListResponse>;
}

export async function fetchTitleDetails(titleId: number, region: string): Promise<WatchmodeTitle> {
  const apiKey = getApiKey();
  const params = new URLSearchParams({
    apiKey,
    append_to_response: 'sources',
    regions: region,
  });

  const response = await fetch(`${BASE_URL}/title/${titleId}/details/?${params.toString()}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Watchmode API error ${response.status}: ${errorText}`);
  }
  return response.json() as Promise<WatchmodeTitle>;
}

export async function fetchTitlesWithDetails(
  sourceIds: number[],
  region: string,
  filters: ContentFilters,
  minRating: number = 0
): Promise<WatchmodeTitle[]> {
  const listResponse = await fetchTitlesList(sourceIds, region, filters);

  const detailPromises = listResponse.titles.map(t =>
    fetchTitleDetails(t.id, region).catch(() => null)
  );

  const details = await Promise.all(detailPromises);

  return details
    .filter((d): d is WatchmodeTitle => d !== null)
    .filter(t => !minRating || t.imdb_rating >= minRating);
}

export async function fetchMoreTitles(
  sourceIds: number[],
  region: string,
  filters: ContentFilters,
  page: number
): Promise<WatchmodeListTitle[]> {
  const response = await fetchTitlesList(sourceIds, region, filters, page);
  return response.titles;
}
