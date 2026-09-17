# How the Salesforce.com Link Works

<!-- source: https://www.questionpro.com/help/SalerforceSystem.html -->

## How the Salesforce.com Link Works

When generating a link from the Salesforce.com system, you will need to include the link to the QuestionPro system along with some custom variables that have been populated from the Salesforce.com system. The link should appear as follows:

Example URL:

<https://www.questionpro.com/a/TakeSurvey?tt=xxxxxxxx&custom1=Case&custom2={!Case_ID}>

The link can include up to 5 custom variables that the QuestionPro system will automatically capture when the respondent clicks on the link. These variables will be populated by the Salesforce.com system when generating the email using email templates.

The url of the survey (required):

<https://www.questionpro.com/a/TakeSurvey?tt=xxxxxxxx>

is the actual URL to the survey provided by the QuestionPro system. The xxxxxxxx in the survey URL needs to be replaced with the encrypted ID of the survey hosted at QuestionPro.

The string of text (required):

&custom1=Case

defines the name of the object in Salesforce.com which is required by the QuestionPro system to identify the object in Salesforce.com to post survey data. This can be a standard Salesforce.com object as well as a custom object. Please note that custom objects have a double underscore and the letter c appended, e.g. Custom_Object_Name__c. The link must contain the name of the object accurately for the integration to function properly.

The string of text (required):

&custom2={!Case_ID}

is a Salesforce.com variable that will get populated with the Salesforce.com case ID when sending the email from Salesforce. This must be a valid object ID for an object in your Salesforce.com system. The QuestionPro system will populate the object in your Salesforce.com system with this object ID.

The string of text (optional):

&custom3={!Salesforce_Custom_Variable}

is included as an example of adding any other Salesforce.com custom field to the URL. An example may be the customer service representative ID.

The link is provided by QuestionPro for each survey:

Add this link to an outbound campaign in Salesforce.com and use the mapping tool in QuestionPro to map survey responses to Salesforce.com data fields:

When a respondent clicks on the link in an email with the survey ID and custom variables configured as in the example URL, all of the custom fields will be automatically captured and associated with the responses for that respondent. Subsequently, analysis may be done that groups survey responses by custom variables.

License
This feature is available with the following licenses :

Advanced

Team Edition

Research Edition

Was the article helpful?

Yes
No

How can we improve it?

Submit

Thank you for submitting feedback.

#### GET STARTED WITH YOUR FIRST SURVEY NOW

SIGN UP FREE
