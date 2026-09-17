# HMAC-SHA1 (Single Sign On)

<!-- source: https://www.questionpro.com/help/communities/HMAC-SH1-SSO.html -->

## HMAC-SHA1 (Single Sign On)

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
