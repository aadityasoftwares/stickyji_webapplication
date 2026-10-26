export interface WorkspaceDropdownFolder {
  id: string;
  name: string;
}

export interface WorkspaceDropdownItem {
  id: string;
  name: string;
  folders: WorkspaceDropdownFolder[];
}

export interface WorkspaceDropdownResponse {
  success: boolean;
  message: string;
  data: WorkspaceDropdownItem[];
}

export interface WorkspaceDropdownQuery {
  search?: string;
}

// Aliases matching backend interface names
export type IWorkspaceDropdownFolder = WorkspaceDropdownFolder;
export type IWorkspaceDropdownItem = WorkspaceDropdownItem;
