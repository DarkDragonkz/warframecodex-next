import { useEffect, useRef, useState } from "react";

export default function useThrottledValue(value, interval = 200) {
  const [throttled, setThrottled] = useState(value);
  const lastRan = useRef(0);
  const trailing = useRef(null);

  useEffect(() => {
    const now = Date.now();
    const remaining = interval - (now - lastRan.current);

    if (remaining <= 0) {
      lastRan.current = now;
      setThrottled(value);
    } else {
      if (trailing.current) clearTimeout(trailing.current);
      trailing.current = setTimeout(() => {
        lastRan.current = Date.now();
        setThrottled(value);
      }, remaining);
    }

    return () => {
      if (trailing.current) clearTimeout(trailing.current);
    };
  }, [value, interval]);

  return throttled;
}
