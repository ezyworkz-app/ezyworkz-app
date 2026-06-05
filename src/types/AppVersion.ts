export interface AppVersion {
  id?: string;
  appId: string;
  platform: "android" | "ios";
  latestVersion: string;
  minSupportedVersion: string;
  forceUpdate: boolean;
  storeUrl: string;
  updatedAt?: string;
  createdAt?: string;
}
