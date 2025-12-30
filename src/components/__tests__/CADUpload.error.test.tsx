// Mock analyzeCADFile to simulate a fail-soft result with error
jest.mock('@/lib/cadAnalysis', () => ({
  analyzeCADFile: jest.fn(() => Promise.reject({
    // simulate fail/throw with embedded error shape
    error: { code: 'CAD_ERR_TIMEOUT', message: 'Parsing timed out', hint: 'Increase timeout', recoverable: true }
  }))
}));

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CADUpload } from '@/components/CADUpload';

describe('CADUpload error display', () => {
  it('renders cad-error-code when parser returns error', async () => {
    const onAnalysisComplete = jest.fn();
    render(<CADUpload onAnalysisComplete={onAnalysisComplete} />);

    // Simulate selecting a file by calling the input directly
    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    const file = new File(['dummy'], 'model.step', { type: 'application/octet-stream' });
    await waitFor(() => {
      fireEvent.change(input, { target: { files: [file] } as any });
    });

    // Wait for the code to appear
    const badge = await screen.findByTestId('cad-error-code');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toBe('CAD_ERR_TIMEOUT');
  });
});
