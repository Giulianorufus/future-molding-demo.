import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RaccoltaDati from '../RaccoltaDati';
import { useCaseStore } from '../../stores/caseStore';

beforeEach(() => {
  // reset store
  useCaseStore.getState().clearCases();
});

test('Calcola Gate Freeze - default grouping fingerprint', async () => {
  const now = new Date().toISOString();
  const sample = {
    id: 'case-1',
    createdAt: now,
    recipeFingerprint: 'fp-ABC',
    recipeSnapshot: { meta: { timestampISO: now, appVersion: 'test', pressCatalogVersion: 'v', materialsVersion: 'v', recipeFingerprint: 'fp-ABC', projectName: 'Part-A' } },
    materialId: 'MAT-1',
    outcome: { holdingTime_s: 3, partWeight_g: 10 },
  };

  useCaseStore.getState().bulkAddCases([sample as any]);

  render(<RaccoltaDati />);

  // Click the compute button
  const btn = screen.getByText('Calcola Gate Freeze');
  fireEvent.click(btn);

  // Expect group key (fingerprint) to appear
  const grp = await screen.findByText('fp-ABC');
  expect(grp).toBeInTheDocument();

  // Expect the holding time to be displayed (3.00)
  const ht = await screen.findByText(/3\.00/);
  expect(ht).toBeInTheDocument();
});
