export function getPartyHost(): string {
  const fromEnv = import.meta.env.VITE_PARTYKIT_HOST;
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();
  return `${window.location.hostname}:1999`;
}
