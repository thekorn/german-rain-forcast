import type { RainForecastResponse } from './forecast.ts';

const EMBEDDED_FORECAST_SCRIPT_ID = 'rain-forecast-data';
let embeddedForecastUsed = false;

export async function fetchRainForecast(): Promise<RainForecastResponse> {
  const embeddedForecast = readEmbeddedRainForecast();
  if (embeddedForecast) return embeddedForecast;

  const response = await fetch('/api/rain-forecast');

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new Error(
      detail
        ? `Regenradar-Daten sind derzeit nicht verfügbar: ${detail}`
        : 'Regenradar-Daten sind derzeit nicht verfügbar',
    );
  }

  return (await response.json()) as RainForecastResponse;
}

function readEmbeddedRainForecast(): RainForecastResponse | undefined {
  if (embeddedForecastUsed || typeof document === 'undefined') return undefined;

  const element = document.getElementById(EMBEDDED_FORECAST_SCRIPT_ID);
  const value = element?.textContent;
  if (!value) return undefined;

  embeddedForecastUsed = true;
  element.remove();

  return JSON.parse(value) as RainForecastResponse;
}

async function readErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { error?: { detail?: string; message?: string } };
    return body.error?.detail ?? body.error?.message;
  } catch {
    return undefined;
  }
}
