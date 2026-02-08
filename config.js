import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

global.owner = ['6282184455955'];
global.prefa = ['', '!', '.', ',', '🐤', '🗿'];
global.thumbnail = "https://img2.pixhost.to/images/5468/690922749_vynna-valerie.jpg";

fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename);
  console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m');
});