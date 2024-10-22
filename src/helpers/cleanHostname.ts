export const cleanHostname = (urlName) => {
  const parsedUrl: URL = new URL(urlName);
  const wwwRemoving: string = parsedUrl.hostname.replace('www.', '');
  return wwwRemoving.replace(/[.].*/, '');
};
