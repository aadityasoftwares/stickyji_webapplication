import { vi } from 'vitest';
import { AppErrorHandler } from './app-error-handler.service';

describe('AppErrorHandler', () => {
  const handler = new AppErrorHandler();

  afterEach(() => vi.restoreAllMocks());

  it('logs the fields of a plain-object rejection and keeps the original object', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const rejection = { code: 'EDITOR_LOAD_FAILED', body: { detail: 'Request failed' } };

    handler.handleError(rejection);

    expect(log).toHaveBeenCalledWith('ERROR', expect.stringContaining('EDITOR_LOAD_FAILED'), rejection);
    expect(log.mock.calls[0][1]).toContain('Request failed');
  });

  it('preserves native errors and their stack traces', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Failed to render');

    handler.handleError(error);

    expect(log).toHaveBeenCalledExactlyOnceWith('ERROR', error);
  });

  it('can log a circular rejection without throwing another error', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const rejection: { message: string; reason?: unknown } = { message: 'Request failed' };
    rejection.reason = rejection;

    expect(() => handler.handleError(rejection)).not.toThrow();
    expect(log).toHaveBeenCalledWith('ERROR', expect.stringContaining('Request failed'), rejection);
  });
});
