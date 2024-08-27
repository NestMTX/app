# How to Get Google Cloud Platform OAuth Credentials

In order to use NestMTX, you'll need a [Google Cloud Platform](https://cloud.google.com) account and a [Google Device Access Console](https://device-access.cloud.google.com) account.

## Create and Configure Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. If this is your first time, you might need to create a new Google Cloud project. Click **Select a project** in the top header.

   ![Select a project in the Google Cloud Console](/screenshots/gcp/api_project_needed.png)

3. Give your Cloud Project a name and then click **CREATE**.

4. From the **APIs & Services** library, select the **Smart Device Management API** and click **ENABLE**.

   ![Enable Smart Device Management API](/screenshots/gcp/enable_sdm_api.png)

## Configure OAuth Consent Screen

1. Open the [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent) page.
2. Select **External** and the only choice if you are not a GSuite user; then click **CREATE**.

   ![Select external OAuth consent screen](/screenshots/gcp/oauth_consent_create.png)

3. The **App Information** section includes required items like **App Name** and **User Support Email**. Enter your email again under **Developer Contact Email**. This email is only shown while you go through the OAuth flow to authorize NestMTX to access your account. Click **SAVE AND CONTINUE**. **Other unnecessary information (e.g., logo) is optional and can be skipped**.

   ![App information setup](/screenshots/gcp/app_information_setup.jpg)

4. On the **Scopes** step, click **SAVE AND CONTINUE**.

5. On the **Test Users** step, you need to add your Google Account (e.g., your organization’s address) to the test list. Click **SAVE** and your test account can now access the consent flow.

   ![Test users setup](/screenshots/gcp/oauth_consent_test_users.png)

6. Navigate back to the OAuth Consent Screen and click **PUBLISH APP** to set the **Publishing Status** to **Production**.

   ![Set OAuth consent to production](/screenshots/gcp/oauth_consent_production_status.png)

7. The warning says your app will be available to your test/developer account without Google’s Approval and invites you to click on the App Verification screen if someone finds the URL. This does not require your Google Account to host this app.

   ![OAuth warning](/screenshots/gcp/oauth_warning.png)

## Obtaining OAuth `client_id` and `client_secret`

1. Open the **Credentials** page and click **CREATE CREDENTIALS**.

   ![Create credentials in Google Cloud](/screenshots/gcp/create_credentials.png)

2. Select **OAuth client ID**.

    ![Select OAuth client ID](/screenshots/gcp/oauth_client_id.png)

3. Choose **Web Application** as the Application Type.
4. Give your credentials a unique name which is meaningful to you.
5. Add a **Redirect URI** where users are redirected after a successful OAuth authorization. When using NestMTX, you can obtain the redirect URL from the [Credentials Management](/setup/credentials) screen.

6. You should now be presented with the OAuth `client_id` and `client_secret`. Take note of your `Client ID` and `Client Secret` as you will need them in order to configure credentials in the [Credentials Management](/setup/credentials) screen.

   ![Note the client ID and client secret](/screenshots/gcp/note_the_client_id_and_client_secret.jpg)
