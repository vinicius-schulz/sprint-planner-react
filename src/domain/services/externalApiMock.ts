export type ExternalSaveResult = {
  ok: boolean;
  message: string;
};

export async function savePlanningToExternalApi(payload: unknown): Promise<ExternalSaveResult> {
  // Mock: simulate a network call.
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Intentionally unused for now (mock).
  void payload;

  return {
    ok: true,
    message: 'Planejamento salvo na API externa (mock).',
  };
}
