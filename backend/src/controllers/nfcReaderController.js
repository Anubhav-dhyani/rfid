import { getNfcReaderState } from '../services/nfcReaderService.js';

export function readerStatus(req, res) {
  res.json(getNfcReaderState(req.query.after));
}
