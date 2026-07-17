// GitHub Contents API 客户端：读取和提交 reviews.json，零依赖。
// Token 只保存在浏览器 localStorage，绝不写入代码或仓库。

const OWNER = "liyongzheng666";
const REPO = "gold-journal";
const BRANCH = "main";
const FILE_PATH = "src/content/reviews.json";

export const TOKEN_KEY = "goldJournal.githubToken";
export const ACTIONS_URL = `https://github.com/${OWNER}/${REPO}/actions`;

const CONTENTS_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;

function apiHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export class GitHubApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function describeError(status) {
  if (status === 401) {
    return "Token 无效或已过期，请重新填写。";
  }
  if (status === 403) {
    return "请求被拒绝，可能是 Token 权限不足或触发了接口限流。";
  }
  if (status === 404) {
    return "无权限或文件不存在，请检查 Token 是否授权 gold-journal 仓库的 Contents 读写。";
  }
  if (status === 409 || status === 422) {
    return "内容已被其他提交修改，请重新保存一次。";
  }
  return `GitHub 接口返回 ${status}，请稍后重试。`;
}

function decodeBase64Utf8(base64) {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function getReviewsFile(token) {
  const response = await fetch(`${CONTENTS_URL}?ref=${BRANCH}`, {
    headers: apiHeaders(token),
  });
  if (!response.ok) {
    throw new GitHubApiError(response.status, describeError(response.status));
  }
  const payload = await response.json();
  return {
    sha: payload.sha,
    reviews: JSON.parse(decodeBase64Utf8(payload.content)),
  };
}

export async function putReviewsFile(token, reviews, sha, message) {
  const response = await fetch(CONTENTS_URL, {
    method: "PUT",
    headers: apiHeaders(token),
    body: JSON.stringify({
      message,
      content: encodeBase64Utf8(`${JSON.stringify(reviews, null, 2)}\n`),
      sha,
      branch: BRANCH,
    }),
  });
  if (!response.ok) {
    throw new GitHubApiError(response.status, describeError(response.status));
  }
  return response.json();
}
