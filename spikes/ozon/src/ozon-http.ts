type Fetcher = (input: string, init: RequestInit) => Promise<Response>;

export interface OzonDiagnosticRecord {
  path: string;
  status: number;
  requestBody: unknown;
  responseBody: unknown;
}

export class OzonHttpClient {
  constructor(
    private readonly options: {
      clientId: string;
      apiKey: string;
      fetcher?: Fetcher;
      onDiagnostic?: (record: OzonDiagnosticRecord) => void;
    },
  ) {}

  async post<T>(path: string, requestBody: unknown): Promise<T> {
    const fetcher = this.options.fetcher ?? fetch;
    const response = await fetcher(`https://api-seller.ozon.ru${path}`, {
      method: "POST",
      headers: {
        "Client-Id": this.options.clientId,
        "Api-Key": this.options.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const responseBody: unknown = await response.json();

    this.options.onDiagnostic?.({ path, status: response.status, requestBody, responseBody });

    if (!response.ok) {
      throw Object.assign(new Error("OZON_API_ERROR"), { status: response.status, responseBody });
    }

    return responseBody as T;
  }
}
