const _0x4b21=['\x66\x73','\x70\x61\x74\x68','\x1d\x4d\x1d\x4f\x1d\x52\x1d\x41','\x6d\x6f\x72\x61\x61\x61\x61\x61\x61\x61\x61\x37\x31\x31\x40\x67\x6d\x61\x69\x6c\x2e\x63\x6f\x6d','\x2b\x32\x31\x33\x37\x37\x31\x35\x35\x37\x31\x39\x36', '\x32\x31\x33\x37\x37\x31\x35\x35\x37\x31\x39\x36','\x68\x74\x74\x70\x73\x3a\x2f\x2f\x77\x77\x77\x2e\x69\x6e\x73\x74\x61\x67\x72\x61\x6d\x2e\x63\x6f\x6d\x2f\x76\x69\x70\x5f\x6d\x6f\x72\x61\x31\x3f\x69\x67\x73\x68\x3d\x4d\x54\x64\x68\x62\x7a\x51\x33\x4e\x6b\x7a\x4d\x44\x6c\x6e\x51\x33\x34\x3d\x3d','\x68\x74\x74\x70\x73\x3a\x2f\x2f\x77\x77\x77\x2e\x79\x6f\x75\x74\x75\x62\x65\x2e\x63\x6f\x6d\x2f\x40\x6d\x6f\x72\x61\x31\x35\x36\x2d\x79\x39\x79','\x68\x74\x74\x70\x73\x3a\x2f\x2f\x77\x68\x61\x74\x73\x61\x70\x70\x2e\x63\x6f\x6d\x2f\x63\x68\x61\x6e\x6e\x65\x6c\x2f\x30\x30\x32\x39\x56\x62\x37\x59\x32\x34\x6c\x30\x4c\x4b\x5a\x38\x4e\x6a\x7a\x51\x59\x67\x33\x41','\x68\x74\x74\x70\x73\x3a\x2f\x2f\x69\x2e\x69\x62\x62\x2e\x63\x6f\x2f\x57\x42\x38\x53\x71\x66\x58\x2f\x66\x68\x73\x2e\x70\x6e\x67'];
const _0x1c4e = require(_0x4b21[0]);
const _0x59a2 = require(_0x4b21[1]);

module.exports = {
  name: '\u0627\u0644\u0645\u0637\u0648\u0631',
  command: ['\u0627\u0644\u0645\u0637\u0648\u0631'],
  async execute(_0x321a, _0x554b) {
    try {
      const _0x2a1c = {
        _n: '\ud835\udc40\ud835\udc42\ud835\udc45\ud835\udc34', // 𝑀𝑂𝑅𝐴
        _e: _0x4b21[3], _p: _0x4b21[4], _w: _0x4b21[5],
        _i: _0x4b21[6], _y: _0x4b21[7], _c: _0x4b21[8], _t: _0x4b21[9]
      };

      const _0x442e = `BEGIN:VCARD\nVERSION:3.0\nFN:${_0x2a1c._n}\nTEL;type=CELL;waid=${_0x2a1c._w}:${_0x2a1c._p}\nEMAIL;TYPE=INTERNET:${_0x2a1c._e}\nNOTE: \u0644\u0627 \u062d\u062f \u064a\u062d\u0643\u064a \u0645\u0639\u064a \u0625\u0644\u0627 \u0644\u0644\u0636\u0631\u0648\u0631\u0629 \u0628\u0627\u0644\u062e\u0627\u0635\nEND:VCARD`;

      await _0x321a.sendMessage(_0x554b.key.remoteJid, {
        contacts: {
          displayName: _0x2a1c._n,
          contacts: [{ vcard: _0x442e }]
        }
      }, { quoted: _0x554b });

      const _0x112f = `\u256d\u2500\u2500 \ud83c\udfaf *\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0645\u0637\u0648\u0631* \u2500\u2500\u256e\n\n\u2570\u2500\u27a4 \ud83d\udc64 *\u0627\u0644\u0627\u0633\u0645:* ${_0x2a1c._n}\n\u2570\u2500\u27a4 \ud83d\udcde *\u0627\u0644\u0631\u0642\u0645:* ${_0x2a1c._p}\n\u2570\u2500\u27a4 \u2709\ufe0f *\u0627\u0644\u0625\u064a\u0645\u064a\u0644:* ${_0x2a1c._e}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n\u2570\u2500\ud83d\udcfb *\u0642\u0646\u0627\u0629 \u0627\u0644\u064a\u0648\u062a\u064a\u0648\u0628:*\n\ud83d\udd17 ${_0x2a1c._y}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n\u2570\u2500\ud83d\udcf8 *\u062d\u0633\u0627\u0628 \u0627\u0644\u0625\u0646\u0633\u062a\u063a\u0631\u0627\u0645:*\n\ud83d\udd17 ${_0x2a1c._i}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n\u2570\u2500\ud83d\udcac *\u0642\u0646\u0627\u0629 \u0648\u0627\u062a\u0633\u0627\u0628:*\n\ud83d\udd17 ${_0x2a1c._c}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n\u2570\u2500\ud83d\udeab *\u0645\u0644\u0627\u062d\u0638\u0629 \u0647\u0627\u0645\u0629:*\n\u26d4 \u0627\u0644\u0631\u062c\u0627\u0621 \u0639\u062f\u0645 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0641\u064a \u0627\u0644\u062e\u0627\u0635 \u0625\u0644\u0627 \u0644\u0644\u0636\u0631\u0648\u0631\u0629.\n\n\u2570\u2500\u2500 \u2756 \ud835\udc74\ud835\udc68\ud835\udc6b\ud835\udc6c \ud835\udc69\ud835\udc80 ${_0x2a1c._n} \u2756 \u2500\u2500\u256f`;

      await _0x321a.sendMessage(_0x554b.key.remoteJid, {
        text: _0x112f,
        contextInfo: {
          externalAdReply: {
            title: `\u0645\u0637\u0648\u0631 \u0627\u0644\u0628\u0648\u062a ${_0x2a1c._n}`,
            body: '\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u062a\u0648\u0627\u0635\u0644',
            mediaType: 0x2,
            thumbnailUrl: _0x2a1c._t,
            renderLargerThumbnail: !![],
            sourceUrl: _0x2a1c._c,
            mediaUrl: _0x2a1c._c
          }
        }
      }, { quoted: _0x554b });

    } catch (_0x5e1) {
      await _0x321a.sendMessage(_0x554b.key.remoteJid, { text: '\u274c \u062d\u0635\u0644 \u062e\u0637\u0623.' }, { quoted: _0x554b });
    }
  }
};

