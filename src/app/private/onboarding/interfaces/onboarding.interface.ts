export interface OnboardingStatus {
  hasWorkspaces: boolean;
  hasFolders: boolean;
  requiresOnboarding: boolean;
}

export interface InitialSetupPayload {
  workspaceTitle: string;
  folderTitle: string;
}

export interface InitialSetupResult {
  workspace: {
    id: string;
    name: string;
    slug?: string;
    [key: string]: any;
  };
  folder: {
    id: string;
    name: string;
    slug?: string;
    [key: string]: any;
  };
}

