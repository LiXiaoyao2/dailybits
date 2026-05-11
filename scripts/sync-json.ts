export function parseJsonText(text: string, fileName: string): unknown {
  try {
    return JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new SyntaxError(`${fileName}: ${error.message}`);
    }
    throw error;
  }
}
