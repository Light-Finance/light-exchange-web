export const parseDate = (date: number) => {
  const d = new Date(date*1);
  const year = d.getFullYear();
  const m = d.getMonth() + 1;
  const month = m < 10 ? `0${m}` : m;
  const days = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes() < 10 ? `0${d.getMinutes()}` : d.getMinutes();
  const seconds = d.getSeconds() < 10 ? `0${d.getSeconds()}` : d.getSeconds();
  return `${year}-${month}-${days} ${hours}h:${minutes}m:${seconds}s`;
};

export const parseHours = (numberOfmiliseconds: number) => {
  let seconds:any = Math.floor((numberOfmiliseconds / 1000) % 60),
  minutes:any = Math.floor((numberOfmiliseconds / (1000 * 60)) % 60),
  hours:any = Math.floor((numberOfmiliseconds / (1000 * 60 * 60)) );

hours = (hours < 10) ? "0" + hours : hours;
minutes = (minutes < 10) ? "0" + minutes : minutes;
seconds = (seconds < 10) ? "0" + seconds : seconds;

  return ` ${hours}:${minutes}:${seconds}`;
};
