const WRITE_TOKEN = PropertiesService.getScriptProperties().getProperty('EVENTMAP_WRITE_TOKEN');

function doPost(e) {
  const token = e.parameter && e.parameter.token; // Apps Script does not reliably expose custom headers.
  const body = JSON.parse(e.postData.contents || '{}');
  if (!WRITE_TOKEN || body.token !== WRITE_TOKEN || body.action !== 'saveMapLayout') {
    return json({ ok:false, error:'Unauthorized' });
  }
  const sheet = SpreadsheetApp.getActive().getSheetByName('MapLayout');
  if (!sheet) return json({ ok:false, error:'MapLayout sheet not found' });
  sheet.getRange('A1').setValue('layout_json');
  sheet.getRange('A2').setValue(JSON.stringify(body.layout));
  return json({ ok:true });
}

function json(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
