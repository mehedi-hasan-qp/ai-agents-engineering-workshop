# Communities - Twitch Authentication

<!-- source: https://www.questionpro.com/help/communities/Twitch-Authentication.html -->

## Communities - Twitch Authentication

QuestionPro Community offers authentication using twitch platform. You can use this option to offer your members a simple way to sign in with their Twitch account.

How to set up Twitch Authentication?

Following are the steps to set-up Twitch authentication for your community.

- Log-in or Register to dev.twitch.tv from your web browser. Authorize Twitch developer console to use your account.

- After logging-in click on “Applications”.

- In the next page, under Apps tab click on “Register Your Application” button.

- On the application register page enter the following details in the form:

Name: Name of your Application.

- OAuth Redirect URI: Here you will need the URL of your QuestionPro community and append it with “/a/twitchCallback”. For example your Community URL is https:opinionquestionpro.com, the OAuth Redirect URI will be <https://opinionquestionpro.com/a/twitchCallback>. The second part of the below image will help you know your community URL.

- Application Category: In this drop-down select “Website Integration” option.

- Client ID: This will be generated automatically.

- Client Secret: To generate secret key, click on “New Secret” button.

- Submit: Copy Client ID and Client Secret key, and Submit the form.
  Note: If you generate the new Client Secret key, the older ones does not work, so it should be updated with the latest one.

- Select your Community in your QuestionPro account. Under ‘Community’ tab, go to ‘Settings’. Toggle ‘Twitch’ option to ON status, under ‘Social Login’ heading.

- Enter the generated Client ID and Client Secret Key in the ‘App ID’ and ‘App Secret’ fields respectively and click on Save button.

How will it look on the member portal?

License
This feature is available with the following license :

Communities

Was the article helpful?

Yes
No

How can we improve it?

Submit

Thank you for submitting feedback.

#### GET STARTED WITH YOUR FIRST SURVEY NOW

SIGN UP FREE
