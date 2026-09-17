# Conjoint Scripting

<!-- source: https://www.questionpro.com/help/Conjoint-Scripting.html -->

## Conjoint Scripting

Branching a Conjoint question to different questions based on the concept that is selected and not selected:

Example:

In the above example, Vizio was selected, so the flow of the question should be as below:

- Q1. Conjoint Question

- Q2. Presentation Text Question

- Q3. Why did you select Vizio?

- Q4. Why did you not select Sony?

To set this branching, set up the entire survey, along with all the follow-up questions and add a presentation text question after Conjoint question type and follow the below steps:

- Go to the presentation text question.

- Click on Logic and select JavaScript Logic from drop-down.

- Turn on the option for Pre JavaScript Logic .

- Enter the below JavaScript code.

- Click on Save Logic .

// concept selected in first step
var Q1_first_concept_selected_text = $survey.getQuestionByCode('Q1').getTask(0).getSelectedConcept().getLevelForFeature(0).levelText;

// concept not selected in first step
var Q1_first_concept_not_selected_text = $survey.getQuestionByCode('Q1').getTask(0).getNotSelectedConcepts()[0].getLevelForFeature(0).levelText;

$survey.updateCustomVariable(1,Q1_first_concept_selected_text);
$survey.updateCustomVariable(2,Q1_first_concept_not_selected_text);

// auto-submit page
document.forms.runForm.onsubmit();

How can I ensure that Q3 shows the option that is selected in Q1? For example, in this case above, Q3 shows Vizio as it was selected in Q1.

To do this, use ${custom1} in the question text, as we are saving selected text in custom variable 1 using above JavaScript code.

For example, Why did you select ${custom1}?

For further assistance in the custom variables, you may contact our representative directly, as the code may vary depending on the requirement.

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
