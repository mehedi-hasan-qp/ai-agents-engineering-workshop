# Communities - HMAC-SHA1 Authentication Model

<!-- source: https://www.questionpro.com/help/communities/Communities-HMAC-SHA1.html -->

## Communities - HMAC-SHA1 Authentication Model

What is HMAC-SHA1?

HMAC stands for hash-based message authentication code. This authentication is a product of a hash function applied to the body of a message along with a secret key. So rather than sending the authentication data via a Web service request, you send some identifier for the private key and an HMAC. When the server receives the request, it looks up the user's private key and uses it to create an HMAC for the incoming request. If the HMAC submitted with the request matches the one calculated by the server, then the request is authenticated.

How to set-up HMAC-SHA1 for my community?

The security identifiers/tokens will be sent to QuestionPro via the Community URL parameters.
HMAC-SHA1 authentication can be set up for your Community from Community>> Log-in Authentication
While setting up the authentication, you will have to enter:

1. Key: A 36 character key that is used for hashing the time in seconds. This Key should be 8 characters long.
2. Timestamp: The time window for which the survey URL will be valid. The value entered here is in minutes.
   Refer below screenshot to know where to make changes:

You'll need to pass the following security token fields via the URL:

|
Name

|
Description / Value

|
Required

|
surveyID

|
Survey ID

|
✔

|
ts

|
When the token was created in UTC time (seconds).

|
✔

|
hash

|
HMAC-SHA1 hash of the seconds (UTC)

|
✔

|
mode

|
Value for this parameter is always hmacSha1

|
✔

|
Name

|
Description / Value

|
Required

|
surveyID

|
Survey ID

|
✔

|
ts

|
When the token was created in UTC time (seconds).

|
✔

|
hash

|
HMAC-SHA1 hash of the seconds (UTC)

|
✔

|
mode

|
Value for this parameter is always hmacSha1

|
✔

Java
PHP

Sample code:

public String getAuthURL(String surveyID, String hashKey){
long ms = getUTCMillis();
long seconds = (ms/1000);
String hash = hmacSha1(String.valueOf(seconds),hashKey);
String params = "surveyID="+surveyID+"&ts=" + seconds + "&hash=" + hash + "&mode=hmacSha1"
return "<https://www.questionpro.com/a/TakeSurveyAuth?"+params>;
}

Sample code:

function getAuthURL($surveyID,$hashKey){
$seconds = time();
$hash = hash_hmac('sha1', $seconds, $hashKey);
$params = "surveyID=".$surveyID. "&ts=" . $seconds . "&hash=" . $hash . "&mode=hmacSha1";
return "<https://www.questionpro.com/a/TakeSurveyAuth?".$params>;
}

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
