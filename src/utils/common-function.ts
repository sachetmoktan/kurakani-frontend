export const dateTimeFormatter = (dateInput: Date | string) => {
  const date = new Date(dateInput);

  const formattedDateAndTime = `${date.getFullYear()} ${date.toLocaleDateString('en-US', {
    // month: 'long',
    month: 'short',
    day: 'numeric',
  })}, ${date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })}`;

  return formattedDateAndTime;
  //   2026 September 2, 2:35:42 PM
};
