const fs = require('fs');  
const path = require('path');  

const JSON_FILE = path.join(__dirname, 'developer.json');  
const _founder_b64 = 'MzI1OTkyMDQ0Mjk5NTc=';  

function loadDevData() {  
  try {  
    if (!fs.existsSync(JSON_FILE)) {  
      fs.writeFileSync(JSON_FILE, JSON.stringify({ founder: [], ownerbot: [], developers: [] }, null, 2));  
    }  
    const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));  
    if (!data.founder) data.founder = [];
    if (!data.ownerbot) data.ownerbot = [];
    if (!data.developers) data.developers = [];
    return data;  
  } catch (e) {  
    return { founder: [], ownerbot: [], developers: [] };  
  }  
}  

function saveDevData(data){  
  try{  
    const saveObj = {  
      founder: data.founder || [],  
      ownerbot: data.ownerbot || [],  
      developers: data.developers || []  
    };  
    fs.writeFileSync(JSON_FILE, JSON.stringify(saveObj, null, 2), 'utf8');  
    return true;  
  } catch(e){  
    console.error('SAVE ERROR:', e);  
    return false;  
  }  
}  

function toLid(jid) {
  if (!jid) return null;
  return jid.split('@')[0].trim() + '@lid';
}

function initFounder(){  
  try{  
    const num = Buffer.from(_founder_b64,'base64').toString('utf8');  
    const lidJid = `${num}@lid`;  
    let devData = loadDevData();
    if (!devData.founder.includes(lidJid)) {
      devData.founder = [lidJid];  
      saveDevData(devData);  
    }
  } catch(e) {
    console.error('INIT FOUNDER ERROR:', e);
  }  
}

initFounder();

function getDevData() {
  return loadDevData();
}

function ensureIntegrity(){  
  const realFounder = Buffer.from(_founder_b64,'base64').toString('utf8') + '@lid';  
  let devData = loadDevData();
  if (!devData.founder) devData.founder = [];
  if (!devData.founder.includes(realFounder)) {  
    devData.founder = [realFounder];  
    saveDevData(devData);
    return { ok:false, message: '🚨 تم اكتشاف محاولة تعديل هوية المؤسس!' };  
  }  
  return { ok:true };  
}  

function isFounder(id){ return getDevData().founder.includes(toLid(id)); }  
function isOwnerbot(id){ return getDevData().ownerbot.includes(toLid(id)); }  
function isDeveloper(id){ return getDevData().developers.includes(toLid(id)); }  

function addDeveloper(id){  
  let devData = loadDevData();
  const lidId = toLid(id);
  if (!devData.developers.includes(lidId) && devData.developers.length < 3){  
    devData.developers.push(lidId);  
    return saveDevData(devData);  
  }  
  return false;  
}  

function removeDeveloper(id){  
  let devData = loadDevData();
  const lidId = toLid(id);
  if (devData.developers.includes(lidId)){  
    devData.developers = devData.developers.filter(x=>x!==lidId);  
    return saveDevData(devData);  
  }  
  return false;  
}  

function setOwnerbot(id){  
  let devData = loadDevData();
  const lidId = toLid(id);

  // إضافة ownerbot جديد بدلاً من الاستبدال
  if (!devData.ownerbot.includes(lidId) && devData.ownerbot.length < 2) {
    devData.ownerbot.push(lidId);
    return saveDevData(devData);
  }
  return false;
}  

function removeOwnerbot(id) {
  let devData = loadDevData();
  const lidId = toLid(id);
  if (devData.ownerbot.includes(lidId)) {
    devData.ownerbot = devData.ownerbot.filter(x => x !== lidId);
    return saveDevData(devData);
  }
  return false;
}

function getOwnerbot() {  
  let devData = loadDevData();
  return devData.ownerbot.length > 0 ? devData.ownerbot : null;  
}  

module.exports = {  
  getDevData,  
  ensureIntegrity,  
  isFounder,  
  isOwnerbot,  
  isDeveloper,  
  addDeveloper,  
  removeDeveloper,  
  setOwnerbot,  
  removeOwnerbot, 
  getOwnerbot,
  saveDevData,  
  toLid
};