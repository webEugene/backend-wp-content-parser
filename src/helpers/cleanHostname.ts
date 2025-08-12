export const cleanHostname = (urlName: string): string => {
  const parsedUrl: URL = new URL(urlName);
  const wwwRemoving: string = parsedUrl.hostname.replace('www.', '');
  return wwwRemoving.replace(/[.].*/, '');
};
