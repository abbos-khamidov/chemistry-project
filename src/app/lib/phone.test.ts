import { describe, it, expect } from 'vitest';
import { formatPhoneDisplay } from './phone';

describe('formatPhoneDisplay', () => {
  it('formats compact E.164 with spacing (not a continuous +998… string)', () => {
    const out = formatPhoneDisplay('+998950000065');
    expect(out.length).toBeGreaterThan('+998950000065'.length);
    expect(out).toContain('998');
  });

  it('preserves em dash placeholder', () => {
    expect(formatPhoneDisplay('—')).toBe('—');
  });
});
