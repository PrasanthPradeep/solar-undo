import { toPng } from "html-to-image";

/**
 * Captures an HTML element and downloads it as a PNG image.
 * Uses a pixel ratio of 2 to ensure sharp and readable text.
 */
export async function downloadExportCard(
  element: HTMLElement,
  filename: string = "solar-undo-result.png"
): Promise<void> {
  try {
    // Wait for any pending fonts or images to load fully
    await document.fonts.ready;

    // Convert element to PNG data URL
    const dataUrl = await toPng(element, {
      pixelRatio: 2.5, // optimal compromise between quality and file size
      cacheBust: true,
      style: {
        transform: "scale(1)",
        transformOrigin: "top left",
      },
    });

    // Create a temporary anchor element and trigger download
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Failed to render and download element as PNG:", error);
    throw new Error("Failed to generate image. Please try again.");
  }
}
