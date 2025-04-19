export function epochToTimestamp(epoch: number): string {
  const date = new Date(epoch); // multiply by 1000 if in seconds
  return date.toISOString(); // or use toLocaleString() for human-friendly format
}
