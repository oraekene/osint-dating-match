export interface HttpPort {
  get(url: string): Promise<string>;
}

export interface LlmPort {
  complete(prompt: string): Promise<string>;
}

export interface BrowserSessionPort {
  visit(url: string): Promise<string>;
}

export interface ExternalPorts {
  http: HttpPort;
  llm: LlmPort;
  browser: BrowserSessionPort;
}
