import type { TestRoundResult, TestMode } from '@/../shared/types';

const CSV_HEADERS = ['test_date', 'mode', 'round', 'reaction_time_ms', 'is_foul', 'stimulus_detail'];

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportToCsv(
  data: TestRoundResult[],
  mode: TestMode,
  sessionId: string,
): void {
  const now = new Date().toISOString();
  const rows = data.map((r) => [
    now,
    mode,
    String(r.round),
    r.reactionTime !== null ? String(r.reactionTime) : '',
    String(r.isFoul),
    r.stimulusDetail ?? '',
  ]);

  const csvContent = [
    CSV_HEADERS.map(escapeCsvField).join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reaction-test-${mode}-${sessionId}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
