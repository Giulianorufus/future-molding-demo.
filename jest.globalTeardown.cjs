module.exports = async () => {
  if (!process.env.DEBUG_HANDLES) return;

  const handles = process._getActiveHandles?.() ?? [];
  const requests = process._getActiveRequests?.() ?? [];

  const filtered = handles.filter((h) => {
    const name = h?.constructor?.name ?? 'unknown';
    return name !== 'WriteStream' && name !== 'ReadStream';
  });

  // eslint-disable-next-line no-console
  console.log('\n[DEBUG_HANDLES] Active handles:', filtered.map((h) => h?.constructor?.name));
  // eslint-disable-next-line no-console
  console.log('[DEBUG_HANDLES] Active requests:', requests.map((r) => r?.constructor?.name));

  filtered.forEach((h, i) => {
    const name = h?.constructor?.name ?? 'unknown';
    // eslint-disable-next-line no-console
    console.log(`[DEBUG_HANDLES] #${i} ${name}`, h);
  });
};
