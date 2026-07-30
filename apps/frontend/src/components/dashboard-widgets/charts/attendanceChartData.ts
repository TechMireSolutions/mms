import { formatShortWeekdayLabels } from "@mms/shared";

export interface AttendancePoint {
  day: string;
  rate: number;
}

export function buildWeeklyAttendancePoints(
  attendanceRecords: Array<{ date?: string; status?: string }>,
): AttendancePoint[] {
  const uniqueDates = [...new Set(attendanceRecords.map((attendanceRecord) => attendanceRecord.date as string))].sort().reverse().slice(0, 7).reverse();
  const days = formatShortWeekdayLabels();
  return days.map((dayLabel, index) => {
    const targetDate = uniqueDates.find((attendanceDate) => {
      const dateObj = new Date(attendanceDate);
      const dayIndex = (dateObj.getDay() + 6) % 7; // Mon=0, Sun=6
      return dayIndex === index;
    });

    if (targetDate) {
      const dayRecords = attendanceRecords.filter((attendanceRecord) => attendanceRecord.date === targetDate);
      const total = dayRecords.length;
      const present = dayRecords.filter((attendanceRecord) => attendanceRecord.status === "present" || attendanceRecord.status === "late").length;
      return {
        day: dayLabel,
        rate: total > 0 ? Math.round((present / total) * 100) : 0
      };
    }

    return {
      day: dayLabel,
      rate: 0
    };
  });
}
