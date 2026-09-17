# Reminder in CX Workflow Rules

<!-- source: https://www.questionpro.com/help/customer-experience/CX-Reminders.html -->

## Reminder in CX Workflow Rules

Reminders in CX Workflow

Reminders are automated follow-up emails sent to respondents who have not completed a survey.
They help increase response rates and ensure timely feedback collection.

How to Create a Reminder

Follow these steps to create a reminder for your survey:

- Go to: Login » Customer Experience » Deploy » Workflow » Reminders

- Click on Add Rule

- Name the rule

- Select the Segment, Product, Product Group, or custom variables for setting the criteria

- Select the reminder delivery mode - Email / SMS

- Select the Email and SMS reminder templates

- Mention the number of days after which the reminder should be sent

- Select the time of day you want the reminder to be sent. If no time is selected, the default is 9:00 AM in the user’s time zone.

- If you want to set a recurring reminder, choose Repeat Every from the dropdown. Else choose Does not Repeat

- Mention the number of days after which the following reminders should be sent along with the number of times (Occurrences) you want to repeat the reminder

- Click on Save

What are some example use cases for this feature?

Use Case 1 – Editing Reminder Time

Suppose a reminder rule is configured to send reminders three times after a survey invitation — on Day 2, Day 4, and Day 6 — all scheduled for 6:00 PM in the user’s local time zone.

- Case A: The user updates the reminder time before the second reminder is executed (e.g., changes 6:00 PM to 7:00 PM).
  The new time applies to the remaining reminders (Reminder Two and Reminder Three).

- Case B: The user changes the time after the second reminder has already been sent but before the third one.
  The new time applies only to the next pending reminder (Reminder Three).

- Case C: The user updates the time to an earlier value after the scheduled time for that day has already passed (e.g., from 6:00 PM to 5:30 PM on the same day).
  The system skips that day’s reminder and moves it to the next day at the updated time.

Use Case 2 – Excluding a Reminder Occurrence

You have a reminder rule with multiple occurrences (e.g., Reminder One, Reminder Two, Reminder Three).
If a specific reminder (for example, Reminder Two) falls on a day that should be skipped, such as a holiday or weekend, you can exclude it.

Example:

- Reminder Rule set for 3 occurrences:

- Reminder One - Day 2 after invitation

- Reminder Two - Day 4 after invitation

- Reminder Three - Day 6 after invitation

- Reminder Two falls on a excluded date

- On Day 4: Reminder Two is skipped.

- The system sends Reminder Two on the next valid, non-excluded day at the configured time.

- Reminder Three is scheduled relative to the day Reminder Two was sent.

Use Case 3 – Deleting a Reminder Rule

If the user deletes a reminder rule (for example, to stop Reminder Two from sending),
All future reminders under that rule will be cancelled.

Use Case 4 – Adding a New Reminder

If reminders were configured for three occurrences (e.g., Day 2, Day 4, and Day 6), the maximum number of reminders can be modified until the first reminder is sent .
After the first reminder has been deployed, adding additional occurrences (e.g., Day 7), is not supported , as the reminder count is locked once the first reminder is triggered.

Each reminder rule can be configured with a unique time, allowing reminders to align with regional peak response hours.

License
This feature is available with the following license :

Customer Experience

Was the article helpful?

Yes
No

How can we improve it?

Submit

Thank you for submitting feedback.

#### GET STARTED WITH YOUR FIRST SURVEY NOW

SIGN UP FREE
