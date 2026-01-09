/*
 * AIRTABLE SCRIPT: Create Drive Folder with Auto-Refreshing Auth
 * * SETUP INSTRUCTIONS:
 * 1. Go to the "Secrets" menu on the left sidebar.
 * 2. Add the following secrets with your Google Cloud credentials:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_REFRESH_TOKEN
 * 3. Ensure your Input Variable 'recordId' is still set on the left.
 */

// ==========================================
// 1. CONFIGURATION
// ==========================================
const CONFIG = {
    tableName: 'Companies',
    folderNameField: 'Company Name',
    outputUrlField: 'Drive Folder',
    driveStatusField: 'Drive Status',
    
    // Optional: ID of the parent folder in Drive. Leave empty '' for root directory.
    parentFolderId: '' // Your GDrive drive folder ID
};

// ==========================================
// 2. HELPER: REFRESH ACCESS TOKEN
// ==========================================
async function getNewAccessToken() {
    console.log("🔄 Requesting new Access Token from Google...");

    // We use the input.config() to read the secrets securely
    // Note: We don't read secrets directly into variables until we need them
    // to keep them out of logs.
    //const clientId = input.config().clientId; // We will map these in the sidebar later? 
    // actually, secrets are accessed via specific API, let's do it the clean way:
    
    // NOTE: In Airtable scripts, secrets are best accessed directly via string literals 
    // or passed in if you set them as input variables. 
    // However, the standard pattern is using the 'input.config()' if mapped, 
    // OR using the newer cursor context if available. 
    // Let's assume standard API fetch for simplicity:
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: input.secret('GOOGLE_CLIENT_ID'), 
            client_secret: input.secret('GOOGLE_CLIENT_SECRET'),
            refresh_token: input.secret('GOOGLE_REFRESH_TOKEN'),
            grant_type: 'refresh_token'
        })
    });

    if (!response.ok) {
        console.error("❌ Failed to refresh token.");
        console.error(await response.text());
        throw new Error("Auth Refresh Failed");
    }

    const data = await response.json();
    console.log("✅ New Access Token acquired!");
    return data.access_token;
}

// ==========================================
// 3. MAIN SCRIPT
// ==========================================
// Setup Inputs from the UI
// IMPORTANT: You must add these to the "Inputs" sidebar!
// Name: recordId              -> Value: Record ID
// Name: GOOGLE_CLIENT_ID      -> Value: Secret: GOOGLE_CLIENT_ID
// Name: GOOGLE_CLIENT_SECRET  -> Value: Secret: GOOGLE_CLIENT_SECRET
// Name: GOOGLE_REFRESH_TOKEN  -> Value: Secret: GOOGLE_REFRESH_TOKEN
const inputConfig = input.config();

console.log(`🚀 Starting execution for record: ${inputConfig.recordId}`);

if (!inputConfig.recordId) throw new Error("Missing input: recordId");

// Get the Record
const table = base.getTable(CONFIG.tableName);
const record = await table.selectRecordAsync(inputConfig.recordId);

if (!record) throw new Error("Record not found in table");

const newFolderName = record.getCellValue(CONFIG.folderNameField);

if (!newFolderName) {
    console.log("⚠️ Company Name is empty. Skipping folder creation.");
} else {
    try {
        // STEP A: Get a fresh token
        // We pass the credentials from the inputConfig we set up
        const accessToken = await getRefreshTokenDirectly();

        // STEP B: Create the folder
        console.log(`📂 Creating folder: "${newFolderName}"`);
        
        const fileMetadata = {
            'name': newFolderName,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': CONFIG.parentFolderId ? [CONFIG.parentFolderId] : []
        };

        const createResponse = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fileMetadata)
        });

        if (!createResponse.ok) {
            throw new Error(await createResponse.text());
        }

        const fileData = await createResponse.json();
        const folderUrl = fileData.webViewLink;

        console.log(`✅ Success! Folder created at: ${folderUrl}`);

        // STEP C: Save folder URL back to Airtable
        await table.updateRecordAsync(inputConfig.recordId, { 
            [CONFIG.outputUrlField]: folderUrl,
            [CONFIG.driveStatusField]: {name: "Synced"} // this was unintuitive and cost a whole hour to figure out
        });
        
        console.log("💾 Airtable record updated.");

    } catch (err) {
        console.error("❌ Error:", err);
    }
}

// ==========================================
// 4. AUTH FUNCTION (Fixed for Airtable Inputs)
// ==========================================
async function getRefreshTokenDirectly() {
    // We use the secrets passed into the inputConfig object
    const params = new URLSearchParams();
    params.append('client_id', input.secret('GOOGLE_CLIENT_ID'));
    params.append('client_secret', input.secret('GOOGLE_CLIENT_SECRET'));
    params.append('refresh_token', input.secret('GOOGLE_REFRESH_TOKEN'));
    params.append('grant_type', 'refresh_token');

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    if (!res.ok) {
        console.error("Auth Error Body:", await res.text());
        throw new Error("Failed to refresh Google Token");
    }

    const json = await res.json();
    return json.access_token;
}
