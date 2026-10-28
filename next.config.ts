import type { NextConfig } from "next";

/**
 * The Base44 sandbox preview serves the app through a proxy:
 *  - the browser's Origin is `https://3000-<BASE44_PUBLIC_HOST_SUFFIX>`
 *  - the request reaches the container with a sandbox `Host` header
 *    (`<port>-<sandbox id>.<BASE44_SANDBOX_HOST_DOMAIN>`)
 * Next gates dev assets/HMR on the Origin (`allowedDevOrigins`) and rejects
 * form Server Actions when Origin and forwarded host differ
 * (`experimental.serverActions.allowedOrigins`). Both lists are derived from
 * the platform-provided values below.
 *
 * Everything here is inactive unless BASE44_PREVIEW_MODE === "1", so outside
 * the sandbox Next keeps its stock behaviour.
 */
function previewHosts(): string[] {
  if (process.env.BASE44_PREVIEW_MODE !== "1") return [];

  const hosts: string[] = [];
  const suffix = process.env.BASE44_PUBLIC_HOST_SUFFIX;
  const sandboxDomain = process.env.BASE44_SANDBOX_HOST_DOMAIN;

  if (suffix) hosts.push(`3000-${suffix}`);
  if (sandboxDomain) hosts.push(`*.${sandboxDomain}`);

  return hosts;
}

const previewHostsList = previewHosts();

const nextConfig: NextConfig = previewHostsList.length
  ? {
      allowedDevOrigins: previewHostsList,
      experimental: {
        serverActions: {
          allowedOrigins: previewHostsList,
        },
      },
    }
  : {};

export default nextConfig;
