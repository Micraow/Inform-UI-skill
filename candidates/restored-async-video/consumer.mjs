/** Attach to the mount host before interaction. This local receipt always cancels provider navigation. */
export function attachVideoReceipt(host, output) {
  const receive = event => {
    event.preventDefault();
    const { video, videos, index } = event.detail;
    output.textContent = `Supplied record ${index + 1} of ${videos.length}: ${video.title}`;
  };
  host.addEventListener('iui:video-open', receive);
  return () => host.removeEventListener('iui:video-open', receive);
}
