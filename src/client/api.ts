import type { RainForecastResponse } from './forecast.ts';

export async function fetchRainForecast(): Promise<RainForecastResponse> {
  const response = await fetch('/api/rain-forecast');

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new Error(
      detail ? `Rain forecast data is unavailable: ${detail}` : 'Rain forecast data is unavailable',
    );
  }

  return (await response.json()) as RainForecastResponse;
}

async function readErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { error?: { detail?: string; message?: string } };
    return body.error?.detail ?? body.error?.message;
  } catch {
    return undefined;
  }
}
