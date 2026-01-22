/**
 * Formats program names for display
 * Replaces "Handler" with "Rabbi Hendler's Minyan" for user-facing text
 */
export function formatProgramName(programName: string): string {
  if (programName === 'Handler') {
    return "Rabbi Hendler's Minyan";
  }
  return programName;
}
