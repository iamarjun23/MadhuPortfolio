export function isUploadThingConfigured() {
  const token = process.env.UPLOADTHING_TOKEN;
  return Boolean(token && !token.includes("replace_me"));
}
