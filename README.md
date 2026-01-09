# Trigger Airtable to automatically create Google Drive folders

This script automates the creation of Google Drive folders based on Airtable records. It’s designed to run inside an Airtable automation, grabbing a folder name from a specific field and saving the resulting Drive link back to your table.

### What it does
When a record is triggered in Airtable, this script:

- Uses a Google Refresh Token to generate a temporary access token (so your connection doesn't break every hour).

- Creates a new folder in a specific Google Drive location.

- Names that folder based on a field in your Airtable record ("Company Name").

- Writes the folder’s URL back to Airtable and updates a status field to "Synced."

### How to set it up
1. Google Cloud APIs
You’ll need a project in the Google Cloud console with the Google Drive API enabled. Generate OAuth 2.0 credentials to get your Client ID and Client Secret. You will also need to generate a Refresh Token (this is what allows the script to stay logged in without you having to manually re-authenticate). Warning: If you've never done this before, it's going to be a headache. I'll update this guide eventually with step by step guidance.

2. Airtable Environment Variables (Secrets)
Airtable provides a secure way to handle credentials so you aren't hardcoding secrets into your script. In the Airtable Script editor, look for the Secrets menu in the left sidebar.

3. Add three secrets:

- GOOGLE_CLIENT_ID

- GOOGLE_CLIENT_SECRET

- GOOGLE_REFRESH_TOKEN

4. Automation Trigger & Input
- Set up an Airtable Automation ("When a record matches conditions").

- Add a run script action.

- In the Input variables section on the left sidebar, add a variable named recordId and map it to the "Airtable record ID" from your trigger.

- **Copy/paste the code from this repo (airtable-gdrive.js) into the script editor.**

5. Script Configuration
At the top of the script, there is a CONFIG object. Update these values to match your specific table and field names:

- tableName: The name of the table you’re working in.

- folderNameField: The field used to name the new folder.

- outputUrlField: The URL field where the Drive link will be saved.

- driveStatusField: A single-select or text field to track sync status.

- parentFolderId: The ID of the Google Drive folder where you want these new folders to live (found in the URL of the folder in your browser).

### Why this approach?
Most simple scripts use a static Access Token that expires quickly. This script includes a helper function that talks to Google’s OAuth endpoint to refresh the token on every run. This makes the automation "set it and forget it"—as long as your refresh token remains valid, the automation won't break. It also saves you from having to learn, pay for and manage a third party orchestrator (like Zapier).

## Photos

**Airtable Trigger Setup**
<img width="3348" height="1554" alt="image" src="https://github.com/user-attachments/assets/d401a1f4-c009-45ec-a6fc-d5585035d7a1" />

**Airtable Code Editor**
<img width="3300" height="1700" alt="image" src="https://github.com/user-attachments/assets/e56fc902-e315-4fb3-ab25-69681b506618" />

