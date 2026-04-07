"use client";

import React, { useEffect, useRef } from "react";
import "./TargetCursor.css";

interface TargetCursorProps {
  spinDuration?: number;
  hideDefaultCursor?: boolean;
  parallaxOn?: boolean;
  hoverDuration?: number;
}

export default function TargetCursor({
  hideDefaultCursor = false,
}: TargetCursorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<HTMLDivElement>(null);
  const trRef = useRef<HTMLDivElement>(null);
  const brRef = useRef<HTMLDivElement>(null);
  const blRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hideDefaultCursor) {
      document.body.style.cursor = "none";
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let hoveredElement: Element | null = null;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      const target = document.elementFromPoint(mouseX, mouseY)?.closest(".cursor-target");
      if (target && target !== hoveredElement) {
         hoveredElement = target;
      } else if (!target && hoveredElement) {
         hoveredElement = null;
         
         // Clear inline transforms to gracefully fall back to CSS default Reticle
         if (tlRef.current) tlRef.current.style.transform = "";
         if (trRef.current) trRef.current.style.transform = "";
         if (brRef.current) brRef.current.style.transform = "";
         if (blRef.current) blRef.current.style.transform = "";
         if (dotRef.current) dotRef.current.style.transform = "translate(-50%, -50%) scale(1)";
         if (dotRef.current) dotRef.current.style.opacity = "1";
      }
    };

    window.addEventListener("mousemove", onMouseMove);

    const loop = () => {
      if (hoveredElement) {
        const rect = hoveredElement.getBoundingClientRect();
        
        // Dest distances: Center to center of target
        const destX = rect.left + rect.width / 2;
        const destY = rect.top + rect.height / 2;
        
        currentX += (destX - currentX) * 0.2;
        currentY += (destY - currentY) * 0.2;

        // Framing margins
        const pad = 8;
        const hw = rect.width / 2 + pad;
        const hh = rect.height / 2 + pad;

        if (tlRef.current) tlRef.current.style.transform = `translate(-${hw}px, -${hh}px)`;
        if (trRef.current) trRef.current.style.transform = `translate(calc(${hw}px - 100%), -${hh}px)`;
        if (brRef.current) brRef.current.style.transform = `translate(calc(${hw}px - 100%), calc(${hh}px - 100%))`;
        if (blRef.current) blRef.current.style.transform = `translate(-${hw}px, calc(${hh}px - 100%))`;

        if (dotRef.current) {
            dotRef.current.style.transform = "translate(-50%, -50%) scale(0)";
            dotRef.current.style.opacity = "0";
        }
      } else {
        // Natural follow
        currentX += (mouseX - currentX) * 0.2;
        currentY += (mouseY - currentY) * 0.2;
      }

      if (wrapperRef.current) {
        wrapperRef.current.style.left = `${currentX}px`;
        wrapperRef.current.style.top = `${currentY}px`;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
      if (hideDefaultCursor) {
        document.body.style.cursor = "auto";
      }
    };
  }, [hideDefaultCursor]);

  return (
    <div ref={wrapperRef} className="target-cursor-wrapper">
      <div ref={dotRef} className="target-cursor-dot" />
      <div ref={tlRef} className="target-cursor-corner corner-tl" />
      <div ref={trRef} className="target-cursor-corner corner-tr" />
      <div ref={brRef} className="target-cursor-corner corner-br" />
      <div ref={blRef} className="target-cursor-corner corner-bl" />
    </div>
  );
}
