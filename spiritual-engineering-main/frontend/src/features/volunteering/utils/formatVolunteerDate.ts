export const formatVolunteerDate = (dateString: string) => {
  const datePart = dateString.slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);

  if (!year || !month || !day) {
    return dateString;
  }

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatVolunteerTime = (timeString: string) => {
  const [hours, minutes] = timeString.slice(0, 5).split(':').map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return timeString;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const volunteerDurationMinutes = (startTime: string, endTime: string) => {
  const [startHours, startMinutes] = startTime.slice(0, 5).split(':').map(Number);
  const [endHours, endMinutes] = endTime.slice(0, 5).split(':').map(Number);

  if (
    [startHours, startMinutes, endHours, endMinutes].some((value) =>
      Number.isNaN(value)
    )
  ) {
    return 0;
  }

  return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
};

export const formatVolunteerDuration = (startTime: string, endTime: string) => {
  const minutes = volunteerDurationMinutes(startTime, endTime);

  if (minutes <= 0) {
    return '';
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (hours === 0) {
    return `${remaining} min`;
  }

  if (remaining === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remaining} min`;
};
