# Login Authentication

<!-- source: https://www.questionpro.com/help/communities/Login-Authentication.html -->

## Login Authentication

Introduction

Login Authentication provides multiple options for securing member access to the community. The default method allows users to sign up or log in using a username and password.

For a more seamless experience, HMAC-SHA1 (Single Sign-On) can be used, where a secure session is created by hashing request data with private keys known only to the client and server.

Another advanced option is Single Sign-On (SSO), where users can log in using their existing credentials from other trusted platforms, ideal for employee surveys where only verified company members should have access. SSO simplifies access, eliminates the need for new credentials, and boosts participation rates.

HMAC-SHA1 (Single Sign On)

HMAC- SHA1( Single Sign-On) is a session and user authentication service that permits a user to use one set of login credentials to access multiple applications.

Hash-based message authentication code (HMAC) provides the server and the client each with a private key that is known only to that specific server and that specific client. The client creates a unique HMAC, or hash, per request to the server by hashing the request data with the private keys and sending it as part of a request. What makes HMAC more secure than Message Authentication Code (MAC) is that the key and the message are hashed in separate steps. In addition to that the url request can also contain hashed profile field data of any member such as age, gender etc. which would then be mapped to appropriate profile field of the community member.

How do I set up SSO for my community?

we use HMAC-SHA1 for this and the authentication works by passing tokens to a pre-specified endpoint using which the community admin can grant access to their members to the community portal.

For setting up the authentication, please follow below steps:

- Go to Communities

- Under Communities listing page select the community

- Go to Settings

- Go to Login Authentication section

- Select HMACSHA1 from the dropdown

- Key: 8 characters key that is used for hashing the time in seconds.

- Timestamp: The time window for which the survey URL will be valid.

- Referer(Optional): This field needs an URL. This will only allow requests originated from this referer URL. In case it is empty, it will allow all requests.

In order to initiate the handshake, the admin will have to pass the following tokens to the endpoint:

- ID_STRING: encryptDES(Current_Timestamp_In_Seconds|First_Name|Last_Name|Member_Email_Address)

- SIGNATURE: HMAC-SHA1 hash of (Current_Timestamp_In_Seconds|First_Name|Last_Name|Member_Email_Address)

- id: Panel_Id

The DES encryption and the HMAC-SHA1 hash will be generated using the preset key.

Once the system receives the tokens, it checks if the ID_STRING matches the Signature. If there's a match, the handshake is authenticated and the member will be logged in.

Example: <https://www.questionpro.com/a/panelsso?ID_STRING=DES> encryption String&SIGNATURE=HMAC-SHA1 string&id=panel ID

Single sign-on (SSO) is an authentication scheme that allows users to use the same login credentials to log in into multiple platforms. If you are doing employee survey across your company you would want to restrict the access to your employees only, and restrict anonymous users from accessing the survey. There are various options to achieve this, you can use login/ password model where you will have to set unique login and password for all your employees and then distribute it via email. Smarter way of doing it would be to use SSO, so that they can only access the survey through your company login credentials. This way, you don't have to introduce another set of login credentials in the equation. SSO will also ensure higher response rates as users can take the survey seamlessly.

SAML stands for Security Assertion Markup Language.It is an XML-based open standard data format for exchanging authentication and authorization data between parties, in particular, between an identity provider and a service provider. And you will have to enter the issuer.

How to enable SAML SSO for community portal?

To set up SAML SSO communities login authentication, follow the steps below:

- Login to your QuestionPro account

- Click on the User Profile Icon and then from the dropdown menu click on Global Settings

- Under SSO Authentication select SAML (Signed) from the dropdown menu and then select Metadata URL or Metadata File as the configuration type. For Metadata URL option paste the Issuer URL (ID) and for Metadata File option select the Issuer metadata (XML file) to upload, and paste the Single Sign On URL which you can get from your IDP and click on Save Changes

- Go to the Community>> Settings>> Login Authentication , select SAML option from the dropdown and click on Save Changes

- Now, your community is SAML SSO enabled and the users can use their company credentials for athentication to log into the community portal.

Was the article helpful?

Yes
No

How can we improve it?

Submit

Thank you for submitting feedback.

#### GET STARTED WITH YOUR FIRST SURVEY NOW

SIGN UP FREE
