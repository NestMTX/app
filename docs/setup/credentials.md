# Credentials

<script setup>
import { useData } from 'vitepress'
import { computed } from 'vue'

const { isDark } = useData()
const overview = computed(() => isDark.value ? '/screenshots/credentials-overview-dark.png' : '/screenshots/credentials-overview-light.png')
const overviewInsecure = computed(() => isDark.value ? '/screenshots/credentials-overview-insecure-dark.png' : '/screenshots/credentials-overview-insecure-light.png')
const addCredentialsButton = computed(() => isDark.value ? '/screenshots/add-credentials-dark.png' : '/screenshots/add-credentials-light.png')
const addCredentialsForm = computed(() => isDark.value ? '/screenshots/add-credentials-form-dark.png' : '/screenshots/add-credentials-form-light.png')
</script>

The **Credentials** page in NestMTX is where you manage the credentials necessary to access and control your Google Nest and Google Cloud Platform (GCP) resources. This page allows you to configure the OAuth credentials required for integrating with Google services, ensuring that NestMTX can retrieve your camera's streams.

<img :src="overview" />

## Google OAuth Redirection URL

At the top of the page, you will see the **Google OAuth Redirection URL** section. This section displays the URL that needs to be added to your Google OAuth2.0 Redirect URIs in your Google Cloud Platform Console. This is a crucial step in setting up OAuth credentials, as it ensures that after authorization, Google can redirect back to the correct endpoint within NestMTX.

- **Redirect URL**: Displays the URL you need to add to your Google OAuth2.0 Redirect URIs.
- **Google Cloud Platform Console Button**: This button directs you to the Google Cloud Platform Console, where you can manage your OAuth credentials and ensure that the redirect URI is correctly configured.

### Handling Insecure Connections

If you are accessing the NestMTX interface from an insecure URL (`http` instead of `https`) a warning will show with the following message:

> You are currently accessing NestMTX from an insecure connection. The redirect URL provided uses a secure protocol. If you have not configured your server to use HTTPS, you will need to manually change the address after redirection from `https://` to `http://`.

<img :src="overviewInsecure" />

NestMTX does **not** require `https`, however Google does require that the URL's used as the OAuth redirection destination be secured by HTTPS - however they do not check that the URL is accessible. This means that if you are hosting NestMTX under the URL `http://mynestmtx.local`, the redirection URL which you will need to install in Google will still need to be `https://mynestmtx.local`. After authenticating, you will be redirected to a page which doesn't load. All that you will need to do is change the URL in your browser's address bar from starting with `https://` to starting with `http://`.

![HTTPS to HTTP](/screenshots/httpsToHttp.gif)

## Credentials List

Below the OAuth information, the **Credentials List** section provides an overview of the stored credentials that NestMTX uses to interact with Google services.

- **Search Bar**: Allows you to search for specific credentials by their description or other metadata.
- **Description**: Each entry in the list shows a description of the credential, making it easy to identify what each set of credentials is used for.
- **Action Buttons**:
  - **Edit**: Takes you to the Google Smart Device API Management Dashboard for the credentials.
  - **Delete**: Enables you to remove the selected credential from the system.

## Adding Credentials

To add a new set of credentials, press the "Add Credentials" button on the top of the Credentials List Table:

<img :src="addCredentialsButton" />

You will be shown a form with the following fields:

| Field                                   | Description                                                                                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Description                             | The name you want to use to identify this set of credentials                                                                                  |
| OAuth Client ID                         | The Client ID of Google OAuth2.0 Credentials which are used to <br />authenticate API access to the Smart Device Management API               |
| OAuth Client Secret                     | The Client Secret of the Google OAuth2.0 Credentials which are <br />used to authenticate API access to the <br />Smart Device Management API |
| Google Device Access Console Project ID | The Project ID used to authenticate API access to the <br />Smart Device Managment API                                                        |

<img :src="addCredentialsForm" />

:::info Tip

Need help figuring out how to get the credentials needed? Check out these tutorials:

- [How to get Google Cloud Platform OAuth Credentials](/guides/gcp)
- [How to get your Device Access Console Project ID](/guides/dac)

:::

## Authorizing Credentials

Now that you've added credentials, you'll need to Authorize API access. To start this process, you'll need to press on the shield with a checkmark next to the credentials that you want to authorize. Once pressed, you will be redirected to the Google Account login and taken through the process of authenticating your NestMTX access to the Google Smart Device Management API's.

:::info Tip

Getting errors about invalid redirect URL even though you set the right one? That's a common issue caused by a long cacheing interval on Google's end. **You may need to wait up to an hour for an update to the credentials to be applied by Google** but usually it's closer to about 5 minutes.

:::
