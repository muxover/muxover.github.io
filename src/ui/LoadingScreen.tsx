import { useEffect } from "react";
import { useStore } from "../store";

export function LoadingScreen() {
  const setPhase = useStore((s) => s.setPhase);

  useEffect(() => {
    const id = setTimeout(() => setPhase("play"), 1800);
    return () => clearTimeout(id);
  }, [setPhase]);

  return (
    <div className="loading">
      <div className="loading-ring">
        <img className="loading-duck" src="/favicon.png" alt="" />
      </div>
      <div className="loading-text">
        NOW LOADING<span className="loading-dots" />
      </div>
      <div className="loading-bar">
        <i />
      </div>
      <div className="loading-sub dim">a duck will be with you shortly</div>
    </div>
  );
}
