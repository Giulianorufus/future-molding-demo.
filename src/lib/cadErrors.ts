// Centralized CAD error codes and normalization helper
export type CadErrorCode =
  | 'CAD_ERR_TIMEOUT'
  | 'CAD_ERR_OCCT_UNAVAILABLE'
  | 'CAD_ERR_PARSE_FAILED'
  | 'CAD_ERR_UNSUPPORTED_FORMAT'
  | 'CAD_ERR_EMPTY_GEOMETRY';

export interface CadError {
  code: CadErrorCode;
  message: string; // short user-facing message
  hint?: string; // actionable hint for operator
  recoverable: boolean; // if a fallback was applied or possible
  context?: any; // optional debug info (not shown in UI)
}

export function normalizeCadError(err: any, context?: any): CadError {
  const raw = (err && (err.message || String(err))) || 'unknown error';

  // Empty geometry detected by callers via context
  if (context && Array.isArray(context.meshes) && context.meshes.length === 0) {
    return {
      code: 'CAD_ERR_EMPTY_GEOMETRY',
      message: 'Geometry empty after parsing',
      hint: 'Try a different file or check for corrupt STEP/IGES content.',
      recoverable: true,
      context,
    };
  }

  const m = raw.toLowerCase();
  if (m.includes('timeout') || m.includes('parsecad timeout')) {
    return {
      code: 'CAD_ERR_TIMEOUT',
      message: 'Parsing timed out',
      hint: 'Increase parser timeout or use a smaller file.',
      recoverable: true,
      context,
    };
  }

  if (m.includes('occt') || m.includes('occt-unavailable') || m.includes('occt import')) {
    return {
      code: 'CAD_ERR_OCCT_UNAVAILABLE',
      message: 'OCCT engine unavailable',
      hint: 'OCCT may be temporarily unavailable — retry or use fallback parsing.',
      recoverable: true,
      context,
    };
  }

  if (m.includes('unsupported') || m.includes('non supportato') || m.includes('format')) {
    return {
      code: 'CAD_ERR_UNSUPPORTED_FORMAT',
      message: 'Unsupported CAD format',
      hint: 'Supported: STEP, IGES, STL. Convert file to one of these formats.',
      recoverable: false,
      context,
    };
  }

  // Generic parse failures mapped here
  return {
    code: 'CAD_ERR_PARSE_FAILED',
    message: 'Parsing failed',
    hint: 'Check file integrity or try a different parser.',
    recoverable: false,
    context: { raw: raw, ...context },
  };
}

export default { normalizeCadError };

// Minimal parse result shape used by callers when failing softly
export type CadParseResult = {
  volume_cm3: number;
  area_cm2: number;
  thickness_mm?: number | null;
  features?: string[];
  meshes?: any[];
  error?: CadError;
};

export function failSoftResult(err: CadError): CadParseResult {
  return {
    volume_cm3: 0,
    area_cm2: 0,
    thickness_mm: null,
    features: [err.code],
    meshes: [],
    error: err,
  };
}
