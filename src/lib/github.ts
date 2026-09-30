export const REPO = 'netbox-community/devicetype-library';
export const REPO_URL = `https://github.com/${REPO}`;

export const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');

export const rawUrl = (sha: string, path: string) =>
	`https://raw.githubusercontent.com/${REPO}/${sha}/${encodePath(path)}`;

export const blobUrl = (sha: string, path: string) => `${REPO_URL}/blob/${sha}/${encodePath(path)}`;

export const commitUrl = (sha: string) => `${REPO_URL}/commit/${sha}`;

export const compareUrl = (base: string, head = 'master') =>
	`https://api.github.com/repos/${REPO}/compare/${base}...${head}`;
