/** Only a clear downward pull, or a deliberate downward flick, closes a sheet. */
export function shouldDismissSheet(distance: number, velocity: number): boolean {
  'worklet';
  return distance >= 104 || (distance >= 28 && velocity >= 900);
}
