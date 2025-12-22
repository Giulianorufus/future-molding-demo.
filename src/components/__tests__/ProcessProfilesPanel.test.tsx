import React from 'react';
import { ProcessProfilesPanel } from '../ProcessProfilesPanel';

function collectByType(node: any, type: any, out: any[] = []) {
  if (!node) return out;
  if (Array.isArray(node)) {
    for (const ch of node) collectByType(ch, type, out);
    return out;
  }
  if (node.type === type) out.push(node);
  const children = node.props && node.props.children;
  if (children) collectByType(children, type, out);
  return out;
}

describe('ProcessProfilesPanel', () => {
  test('renders correct number of injection and packing steps from CalculationResultWithProfiles', () => {
    const fakeResult: any = {
      injectionProfile: {
        steps: [
          { step: 1, speed_cm3_s: 10, endBy: { kind: 'volumePercent', value: 20 } },
          { step: 2, speed_cm3_s: 20, endBy: { kind: 'volumePercent', value: 80 } },
        ],
      },
      packingProfile: {
        steps: [
          { step: 1, pressure_bar: 100, time_s: 1.2 },
        ],
      },
      switchover: 95,
    };

    const el = ProcessProfilesPanel({ result: fakeResult });
    expect(el).not.toBeNull();

    // collect the two tables in order
    const tables = collectByType(el, 'table');
    expect(tables.length).toBeGreaterThanOrEqual(2);

    const injTable = tables[0];
    const packTable = tables[1];

    const injTbody = collectByType(injTable, 'tbody')[0];
    const packTbody = collectByType(packTable, 'tbody')[0];

    const injRows = injTbody && injTbody.props && injTbody.props.children ? injTbody.props.children.filter((n: any) => n) : [];
    const packRows = packTbody && packTbody.props && packTbody.props.children ? packTbody.props.children.filter((n: any) => n) : [];

    expect(injRows.length).toBe(2);
    expect(packRows.length).toBe(1);
  });
});
