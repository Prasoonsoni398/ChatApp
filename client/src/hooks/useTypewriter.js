import { useState, useEffect } from "react";

/**
 * Simulates a typewriter effect by revealing `fullText` character by character.
 *
 * @param {string} fullText   - The complete text to type out.
 * @param {number} startDelay - Milliseconds to wait before typing begins.
 * @param {number} speed      - Milliseconds between each character (default 35ms).
 * @returns {{ displayed: string, done: boolean }}
 */
function useTypewriter(fullText, startDelay, speed = 35) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= fullText.length) {
      setDone(true); // eslint-disable-line
      return;
    }
    const t = setTimeout(
      () => setDisplayed(fullText.slice(0, displayed.length + 1)),
      speed,
    );
    return () => clearTimeout(t);
  }, [started, displayed, fullText, speed]);

  return { displayed, done };
}

export default useTypewriter;
