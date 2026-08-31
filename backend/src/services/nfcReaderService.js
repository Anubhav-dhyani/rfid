import smartcard from 'smartcard';

const { Devices } = smartcard;

const state = {
  enabled: true,
  connected: false,
  readerName: null,
  error: null,
  lastCard: null
};

let devices;
let started = false;

export function startNfcReader() {
  state.enabled = process.env.NFC_READER_ENABLED !== 'false';
  if (started || !state.enabled) return;
  started = true;
  try {
    devices = new Devices();
    devices.on('reader-attached', (reader) => {
      state.connected = true;
      state.readerName = reader.name;
      state.error = null;
      console.log(`NFC reader connected: ${reader.name}`);
    });
    devices.on('reader-detached', (reader) => {
      if (state.readerName === reader.name) {
        state.connected = false;
        state.readerName = null;
      }
      console.log(`NFC reader disconnected: ${reader.name}`);
    });
    devices.on('card-inserted', async ({ reader, card }) => {
      try {
        const response = await card.transmit(Buffer.from([0xff, 0xca, 0x00, 0x00, 0x00]));
        if (response.length < 3 || response.at(-2) !== 0x90 || response.at(-1) !== 0x00) {
          throw new Error(`Reader returned ${response.toString('hex').toUpperCase()}`);
        }
        const uid = response.subarray(0, -2).toString('hex').toUpperCase();
        state.lastCard = { uid, readerName: reader.name, detectedAt: Date.now() };
        state.error = null;
        console.log(`NFC card detected on ${reader.name}: ${uid}`);
      } catch (error) {
        state.error = `Unable to read card UID: ${error.message}`;
        console.error(state.error);
      }
    });
    devices.on('error', (error) => {
      state.error = error.message;
      console.error(`NFC reader error: ${error.message}`);
    });
    devices.start();
  } catch (error) {
    state.error = error.message;
    console.error(`Unable to start NFC reader: ${error.message}`);
  }
}

export function stopNfcReader() {
  if (devices) devices.stop();
  devices = undefined;
  started = false;
  state.connected = false;
  state.readerName = null;
}

export function getNfcReaderState(after = 0) {
  const detectedAfter = Number(after) || 0;
  return {
    enabled: state.enabled,
    connected: state.connected,
    readerName: state.readerName,
    error: state.error,
    card: state.lastCard?.detectedAt > detectedAfter ? state.lastCard : null
  };
}
