# Branching from a multiple select question using custom scripting

<!-- source: https://www.questionpro.com/help/Branching.html -->

## Branching from a multiple select question using custom scripting

Consider the following scenario:

Q1: Which games do you play?

Baseball
Basketball
Soccer
Tennis

The above question is a Multiple Select type question. Now, if respondents select the answer option Baseball and Basketball you want to branch them to Q2, else you want them to branch to Q3.

The script for the above example is as follows:

# if (${Q1_1} == "1" && ${Q1_2} == "1")

$survey.branchTo("Q2")

# else

$survey.branchTo("Q3")

# end

What is the difference between referencing a multiple select type question (Check Box) versus single select question (Radio Button)?

Question code for the question is Q1
If the question is a Multiple Select type question then the answer options are referenced as follows:

- First answer option: ${Q1_1} == "1", Second answer option: ${Q1_2} == "1", Third answer option: ${Q1_3} == "1" and so on...

- To check if the answer option was selected, check if it equals to "1" for example: #if (${Q1_1} == "1"). Unlike single select question type 1 should be within quotes.

If the question is a single select type question then the answer options are referenced as follows:

- First answer option: #if (${Q1} == 1), Second answer option: #if (${Q1} == 2), Third answer option: #if (${Q1} == 3) and so on...

- To check if the answer option is selected, check it with the position of the answer option. Quotes are not necessary in this case.

License
This feature is available with the following licenses :

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
