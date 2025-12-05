export function logInput(input: any) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[calc] input', input)
  }
}

export function logOutput(output: any) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[calc] output', output)
  }
}

export default { logInput, logOutput }
