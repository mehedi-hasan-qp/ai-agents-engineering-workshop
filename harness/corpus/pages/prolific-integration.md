# Prolific Integration

<!-- source: https://www.questionpro.com/help/Prolific-Integration.html -->

## Prolific Integration

QuestionPro integrates with Prolific , allowing researchers to recruit participants via Prolific and collect their responses in QuestionPro. Through this integration, participant identifiers are automatically captured, associated with the corresponding survey responses, and returned to Prolific once the survey is completed.

How do I capture Prolific participant identifiers?

Prolific automatically passes participant information to QuestionPro through URL parameters. To capture these, append the parameters to your Study URL in Prolific:

- In QuestionPro, create custom variables to store the values passed from Prolific. For example, map PROLIFIC_PID to custom1 , STUDY_ID to custom2 , and SESSION_ID to custom3 .

- Add your QuestionPro survey URL as the study URL within Prolific.

- Append the parameters directly to your link.

For example: <https://www.questionpro.com/t/surveyURL?custom1={{%PROLIFIC_PID%}}&custom2={{%STUDY_ID%}}&custom3={{%SESSION_ID%}}> .

How do I store the participant identifiers from Prolific in the survey?

Go to your survey, fetch the PROLIFIC_PID from the custom variable in the study link say custom1. This would prepopulate the prolific ID in the field.

How to Redirect participants to the Completion URL at the end of your survey?

After respondents complete the survey, they should be redirected back to Prolific so that their submission is recorded successfully.

- In your Prolific study settings, navigate to the Completion paths section and select Redirect URL . Copy the generated Completion URL.

- In QuestionPro, open your survey and navigate to Edit >> Settings >> Finish Options .

- Select Automatic Redirect .

- Paste the Prolific Completion URL and save your changes.

How to redirect participants if there are multiple completion paths?

If there are multiple completion paths, in the Finish Options, you can use Panel Integration feature to redirect participants to different URLs.
For example, if a participants fails the attention check and the survey for them is terminated, you can add the attention check completion path in Terminates section.

License
This feature is available with the following license :

Research Edition

Was the article helpful?

Yes
No

How can we improve it?

Submit

Thank you for submitting feedback.

#### GET STARTED WITH YOUR FIRST SURVEY NOW

SIGN UP FREE
