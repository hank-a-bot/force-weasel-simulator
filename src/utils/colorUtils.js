// Color distance helper & jersey conflict resolution utility
export function getHexColorDistance(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 255;

  const rDiff = rgb1.r - rgb2.r;
  const gDiff = rgb1.g - rgb2.g;
  const bDiff = rgb1.b - rgb2.b;

  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

export function hexToRgb(hex) {
  if (!hex) return { r: 0, g: 0, b: 0 };
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function getContrastTextColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#FFFFFF";
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 140 ? "#000000" : "#FFFFFF";
}

// Determines if Team B needs to wear their secondary color / away uniform
export function resolveJerseyColors(teamA, teamB) {
  const dist = getHexColorDistance(teamA.primaryColor, teamB.primaryColor);

  // Sensitive threshold (135) to catch similar colors (Blue vs Navy, Red vs Crimson, Orange vs Yellow)
  if (dist < 135) {
    let secondary = teamB.secondaryColor || "#FFFFFF";
    
    // If Team B's secondary color is also too close to Team A's primary, use pure white
    if (getHexColorDistance(teamA.primaryColor, secondary) < 80) {
      secondary = "#FFFFFF";
    }

    return {
      teamAJersey: teamA.primaryColor,
      teamAText: getContrastTextColor(teamA.primaryColor),
      teamBJersey: secondary,
      teamBText: getContrastTextColor(secondary),
      isConflict: true
    };
  }

  return {
    teamAJersey: teamA.primaryColor,
    teamAText: getContrastTextColor(teamA.primaryColor),
    teamBJersey: teamB.primaryColor,
    teamBText: getContrastTextColor(teamB.primaryColor),
    isConflict: false
  };
}
