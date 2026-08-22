# Publishing the Web Version

## What Public Deployment Does—and Does Not Do

Publishing makes the Offline Knowledge Graph interface available at a public web address. It **does not publish a visitor’s graph**: graph data remains in that visitor’s browser storage unless they explicitly export and share a backup. Because browser storage is scoped to a browser profile and site address, users should export a current ZIP or JSON backup before changing browsers, clearing site data, or moving to a new domain.

## Recommended Route: EAS Hosting

Expo documents EAS Hosting as a deployment option for an exported Expo web build, with preview and production URLs.[^expo-hosting] The following commands should be run by the project owner from the `mobile` directory after reviewing the release.

```bash
# Authenticate with the owner’s Expo account.
npx eas-cli@latest login
npx eas-cli@latest whoami

# Create the production web bundle in ./dist.
pnpm web:export

# Create the first EAS Hosting deployment.
npx eas-cli@latest deploy
```

On the first deployment, the EAS command prompts for project linking and a preview subdomain. It then returns a preview URL and a production URL. Keep the generated production URL private until the final functional review is complete; then share that URL for open access.[^expo-hosting]

## Alternative Static Hosts

The generated `dist/` directory can also be uploaded to a static host such as Netlify, Vercel, Firebase Hosting, AWS Amplify, or GitHub Pages.[^expo-publishing] Configure the host to serve the generated static files over HTTPS and preserve application routes. For a static host, every later release follows the same sequence: run the export command, validate the result locally, then deploy the refreshed `dist/` directory.

## Owner Release Checklist

| Step | Owner action |
| --- | --- |
| 1 | Review the latest checkpoint and open the browser preview at desktop and mobile widths. |
| 2 | Create an export, then confirm the downloaded archive is stored in a location you control. |
| 3 | Run `pnpm web:export` from `mobile/`. |
| 4 | Test the production bundle locally with `npx expo serve`. |
| 5 | Deploy through EAS Hosting or upload `dist/` to the selected static host. |
| 6 | Open the public URL in a fresh browser profile, create a test concept, export it, and confirm the graph is not visible in a different browser profile. |

[^expo-hosting]: [Expo, “Deploy your first Expo Router and React app.”](https://docs.expo.dev/eas/hosting/get-started/)
[^expo-publishing]: [Expo, “Publish websites.”](https://docs.expo.dev/guides/publishing-websites/)
