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

const PERMISSION_HINT =
  "创建 Token 时需要：Repository access 选 Only select repositories 并勾选 " +
  "gold-journal；Permissions 里把 Contents 设为 Read and write。" +
  "（页面默认的 Public repositories read-only 只能读、不能提交。）";

function describeError(status) {
  if (status === 401) {
    return "Token 无效或已过期，请重新填写。";
  }
  if (status === 403) {
    return `Token 没有写入权限或触发了接口限流。${PERMISSION_HINT}`;
  }
  if (status === 404) {
    return `Token 无权访问该仓库或文件不存在。${PERMISSION_HINT}`;
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

// 校验 Token 是否具备 Contents 写入权限，但不产生任何真实提交：
// 用一个必然不匹配的全零 sha 发起 PUT，有写权限时 GitHub 会先通过鉴权、
// 再因 sha 冲突返回 409/422；没有写权限则直接返回 403/404。
export async function verifyWriteAccess(token) {
  const response = await fetch(CONTENTS_URL, {
    method: "PUT",
    headers: apiHeaders(token),
    body: JSON.stringify({
      message: "write-permission probe (never lands)",
      content: "",
      sha: "0000000000000000000000000000000000000000",
      branch: BRANCH,
    }),
  });
  if (response.ok || response.status === 409 || response.status === 422) {
    return;
  }
  if (response.status === 403 || response.status === 404) {
    throw new GitHubApiError(
      response.status,
      `这个 Token 只能读取、不能提交。${PERMISSION_HINT}`,
    );
  }
  throw new GitHubApiError(response.status, describeError(response.status));
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
