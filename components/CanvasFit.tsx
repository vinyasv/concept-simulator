import React from "react";

/** Fits older generated layouts into the available canvas instead of exposing nested scroll areas. */
export function CanvasFit({ children }: { children: React.ReactNode }) {
  const host = React.useRef<HTMLDivElement>(null);
  const plane = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const container = host.current,
      content = plane.current;
    if (!container || !content) return;
    let pending = 0;
    let logicalWidth = 0,
      logicalHeight = 0;
    const fit = (reset = false) => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        const width = container.clientWidth,
          height = container.clientHeight;
        if (!width || !height) return;
        if (reset || !logicalWidth) {
          logicalWidth = width;
          logicalHeight = height;
        }
        content.style.width = `${logicalWidth}px`;
        content.style.height = `${logicalHeight}px`;
        // Bounded passes let flex descendants expand to their natural content height.
        for (let pass = 0; pass < 4; pass++) {
          let extraWidth = Math.max(0, content.scrollWidth - logicalWidth);
          let extraHeight = Math.max(0, content.scrollHeight - logicalHeight);
          for (const element of content.querySelectorAll<HTMLElement>("*")) {
            if (
              !(element instanceof HTMLElement) ||
              element.closest('[role="dialog"]')
            )
              continue;
            const style = getComputedStyle(element);
            if (style.textOverflow === "ellipsis") continue;
            if (
              style.position === "absolute" ||
              style.position === "fixed" ||
              style.display === "none"
            )
              continue;
            if (
              ["auto", "scroll", "hidden"].includes(style.overflowY) &&
              element.clientHeight > 0
            ) {
              extraHeight = Math.max(
                extraHeight,
                element.scrollHeight - element.clientHeight,
              );
            }
            if (
              ["auto", "scroll", "hidden"].includes(style.overflowX) &&
              element.clientWidth > 0
            ) {
              extraWidth = Math.max(
                extraWidth,
                element.scrollWidth - element.clientWidth,
              );
            }
          }
          if (extraHeight < 2 && extraWidth < 2) break;
          logicalWidth = Math.min(2400, logicalWidth + extraWidth);
          logicalHeight = Math.min(2000, logicalHeight + extraHeight);
          content.style.width = `${logicalWidth}px`;
          content.style.height = `${logicalHeight}px`;
        }
        const scale = Math.min(1, width / logicalWidth, height / logicalHeight);
        content.style.transform = `translate(${(width - logicalWidth * scale) / 2}px, ${(height - logicalHeight * scale) / 2}px) scale(${scale})`;
      });
    };
    const resize = new ResizeObserver(() => fit(true));
    resize.observe(container);
    const mutation = new MutationObserver(() => fit(true));
    mutation.observe(content, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    fit(true);
    return () => {
      resize.disconnect();
      mutation.disconnect();
      cancelAnimationFrame(pending);
    };
  }, []);
  return (
    <div className="sim-fit-host" ref={host}>
      <div className="sim-fit-plane" ref={plane}>
        {children}
      </div>
    </div>
  );
}
