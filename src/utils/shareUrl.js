// URL sharing utility to encode and decode matchup parameters
export function getShareUrl(teamAId, teamBId, teamAProb, seed) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("teamA", teamAId);
  url.searchParams.set("teamB", teamBId);
  url.searchParams.set("probA", teamAProb);
  url.searchParams.set("seed", seed);
  return url.toString();
}

export function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const teamA = params.get("teamA");
  const teamB = params.get("teamB");
  const probA = params.get("probA");
  const seed = params.get("seed");

  if (teamA && teamB) {
    return {
      teamAId: teamA,
      teamBId: teamB,
      teamAProb: probA ? parseInt(probA, 10) : 50,
      seed: seed ? parseInt(seed, 10) : Math.floor(Math.random() * 100000)
    };
  }
  return null;
}
