let ss = SpreadsheetApp.openById("1motBqK3t874KSGT9erJBU4HChFW2OCd0-AfU15hU7JA");

function doPost(e) {
    let responseData = { success: false };
    // CORSを回避しつつVercel(外部)からJSONを受け取るため、
    // フロントエンド側で text/plain として送られた JSON をパースして受け取ります。
    try {
        let params = JSON.parse(e.postData.contents);
        let action = params.action;
        let data = params.data;

        if (action === "saveData") {
            saveData(data);
            responseData = { success: true, action: "saveData" };
        } else if (action === "saveCsv") {
            saveCsv(data);
            responseData = { success: true, action: "saveCsv" };
        } else if (action === "undoLastRow") {
            undoLastRow();
            responseData = { success: true, action: "undoLastRow" };
        } else {
            responseData = { success: false, error: "Invalid action" };
        }
    } catch (err) {
        responseData = { success: false, error: err.message };
    }

    // 結果をJSONとして返却
    let output = ContentService.createTextOutput(JSON.stringify(responseData));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
}

function doGet() {
    // 既存のGAS画面を残す場合はここを使います
    const template = HtmlService.createTemplateFromFile('コード'); // 既存のhtmlファイル名に変更してください
    const htmlOutput = template.evaluate();

    htmlOutput
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setTitle('大喜利採点ボタン')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    return htmlOutput;
}

function saveData(result) {
    let register_sheet = ss.getSheetByName('シート1');
    if (register_sheet) {
        register_sheet.appendRow(result);
    }
}

function saveCsv(result) {
    let register_sheet = ss.getSheetByName('シート2');
    if (register_sheet) {
        register_sheet.getRange(register_sheet.getLastRow() + 1, 1, 2, 6).setValues(result);
    }
}

function undoLastRow() {
    let register_sheet = ss.getSheetByName('シート1');
    if (register_sheet) {
        const lastRow = register_sheet.getLastRow();
        if (lastRow > 1) {
            register_sheet.deleteRow(lastRow);
        }
    }
}
