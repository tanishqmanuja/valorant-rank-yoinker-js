import { CLR_PASTEL_GREEN, CLR_PASTEL_RED } from "./constants";
import { HexColor } from "./types";

export function colorMix(
  color1: HexColor,
  color2: HexColor,
  ratio: number,
): HexColor {
  if (ratio < 0 || isNaN(ratio)) {
    return color1;
  }
  if (ratio > 1) {
    return color2;
  }

  const color1R = parseInt(color1.substring(1, 3), 16);
  const color1G = parseInt(color1.substring(3, 5), 16);
  const color1B = parseInt(color1.substring(5, 7), 16);
  const color2R = parseInt(color2.substring(1, 3), 16);
  const color2G = parseInt(color2.substring(3, 5), 16);
  const color2B = parseInt(color2.substring(5, 7), 16);
  const resultR = Math.round((1 - ratio) * color1R + ratio * color2R);
  const resultG = Math.round((1 - ratio) * color1G + ratio * color2G);
  const resultB = Math.round((1 - ratio) * color1B + ratio * color2B);
  return `#${resultR.toString(16).padStart(2, "0")}${resultG
    .toString(16)
    .padStart(2, "0")}${resultB.toString(16).padStart(2, "0")}`;
}

export function colorInterpolate(
  ratio: number,
  colors: HexColor[] = [CLR_PASTEL_RED, CLR_PASTEL_GREEN],
): HexColor {
  if (colors.length < 2) {
    throw new Error("At least 2 colors are required");
  }

  if (ratio < 0 || isNaN(ratio)) {
    return colors[0]!;
  }
  if (ratio > 1) {
    return colors[colors.length - 1]!;
  }

  const color = ratio * (colors.length - 1);
  const lowerColor = colors[Math.floor(color)]!;
  const upperColor = colors[Math.ceil(color)]!;
  const interpolation = color - Math.floor(color);
  return colorMix(lowerColor, upperColor, interpolation);
}
