import { useEffect, useRef, useState } from 'react';

export function usePhoneNfc(onCard) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef(null);
  const onCardRef = useRef(onCard);
  onCardRef.current = onCard;

  useEffect(() => () => controller.current?.abort(), []);

  const stop = () => {
    controller.current?.abort();
    controller.current = null;
    setActive(false);
  };

  const start = async () => {
    if (!('NDEFReader' in window)) {
      setError('Phone NFC scanning is available in Chrome on compatible Android phones.');
      return;
    }
    stop();
    setError('');
    const nextController = new AbortController();
    controller.current = nextController;
    try {
      const reader = new window.NDEFReader();
      reader.addEventListener('reading', (event) => {
        const uid = (event.serialNumber || '').replace(/[^0-9a-f]/gi, '').toUpperCase();
        if (!uid) {
          setError('This card did not provide a readable UID to the phone browser.');
          return;
        }
        setError('');
        onCardRef.current(uid);
      });
      reader.addEventListener('readingerror', () => {
        setError('The phone cannot read this card. Try an NDEF-compatible card or an ACR122U reader.');
      });
      await reader.scan({ signal: nextController.signal });
      if (!nextController.signal.aborted) setActive(true);
    } catch (scanError) {
      if (scanError.name !== 'AbortError') setError(`Phone NFC could not start: ${scanError.message}`);
      if (controller.current === nextController) controller.current = null;
      setActive(false);
    }
  };

  return { supported: typeof window !== 'undefined' && 'NDEFReader' in window, active, error, clearError: () => setError(''), start, stop };
}
