import { mutationOptions } from "@tanstack/react-query";
import { checkInClubAttendance } from "@/app/lib/clubs";

export function checkInAttendanceMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: () => checkInClubAttendance(clubId),
  });
}
