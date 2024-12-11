export function delay(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export function formatTime(milliseconds: number) {
  const seconds = Math.floor((milliseconds / 1000) % 60);
  const minutes = Math.floor((milliseconds / 1000 / 60) % 60);
  const hours = Math.floor((milliseconds / 1000 / 3600) % 24);
  const days = Math.floor(milliseconds / (1000 * 3600 * 24));
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
