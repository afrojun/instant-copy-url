# Releasing to the Chrome Web Store

The GitHub workflow packages the tagged commit, uploads it to the existing
Chrome Web Store item, and requests `DEFAULT_PUBLISH`. Chrome reviews the update;
it becomes live automatically if approved. This does not change the listing's
text, screenshots, or visibility.

## One-time authentication setup

1. In Google Cloud, create or select a project and enable the **Chrome Web Store
   API**. Create a service account for publishing. It needs no project role just
   for access to the Web Store API. Do not create a JSON key.
2. In the Chrome Web Store Developer Dashboard, open **Account** and add the
   service account's email address. Google currently allows one service account
   per publisher. Find the publisher ID under **Publisher → Settings**.
3. In Google Cloud, configure a Workload Identity Pool and OIDC provider for
   `https://token.actions.githubusercontent.com`. Map `google.subject` to
   `assertion.sub` and `attribute.repository` to `assertion.repository`. Restrict
   the provider to `assertion.repository == 'afrojun/instant-copy-url' &&
   assertion.ref.startsWith('refs/tags/v')`. Grant that repository principal
   `roles/iam.workloadIdentityUser` on the service account. Follow the
   [Google authentication action's setup](https://github.com/google-github-actions/auth#workload-identity-federation-through-a-service-account)
   for the pool/provider and IAM commands.
4. In the GitHub repository, create an environment named `chrome-web-store`.
   Limit deployments to tags matching `v*`. Add these **environment variables**:

   | Variable | Value |
   | --- | --- |
   | `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full provider resource name: `projects/NUMBER/locations/global/workloadIdentityPools/POOL/providers/PROVIDER` |
   | `GCP_SERVICE_ACCOUNT` | Service account email address |
   | `CWS_PUBLISHER_ID` | Chrome Web Store publisher ID |
   | `CWS_EXTENSION_ID` | Existing extension ID from its Web Store URL |

The workflow uses GitHub OIDC to request a short-lived token with the
`chromewebstore` scope. No Google credential is stored in GitHub.

## Each release

1. Increase `version` in `manifest.json`; update and test the extension.
2. Complete the live Chrome checks in [testing.md](testing.md). The workflow's
   Node checks do not yet exercise Chrome, the shortcut, or the clipboard.
3. Merge the release commit to `main`, then tag that commit and push the tag:

   ```sh
   git tag v1.5.1
   git push origin v1.5.1
   ```

   Replace `1.5.1` with the new manifest version. The workflow rejects a tag
   that does not match it.
4. Watch the GitHub Actions run and Chrome Web Store Developer Dashboard. A
   successful workflow means the update was **submitted**, not yet approved or
   live. The Store review happens afterward.

The Store API requires a higher manifest version than the currently published
one. Store listing changes remain manual. See Google's
[service-account guide](https://developer.chrome.com/docs/webstore/service-accounts)
and [Web Store API guide](https://developer.chrome.com/docs/webstore/using-api).
