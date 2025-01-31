import type { NextApiRequest, NextApiResponse } from "next";

import { fetcher } from "utils/fetcher";
import type { SpotifyTrack } from "types";

export const getNewAccessTokenFromRefreshToken = async (refreshToken: string) => {
  const params = new URLSearchParams();
  params.append("client_id", process.env.SPOTIFY_CLIENT_ID as string);
  params.append("client_secret", process.env.SPOTIFY_CLIENT_SECRET as string);
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

  try {
    const tokens = await fetcher(`https://accounts.spotify.com/api/token?${params.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    process.env.SPOTIFY_ACCESS_TOKEN = tokens.access_token;
  } catch (e) {
    console.log(e);
  }
};

export const fetchLastPlayedSong = async () => {
  await getNewAccessTokenFromRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN as string);

  const { items }: { items: { track: SpotifyTrack; played_at: string }[] } = await fetcher(
    `https://api.spotify.com/v1/me/player/recently-played`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.SPOTIFY_ACCESS_TOKEN as string}`,
      },
    },
  );

  return { track: items[0].track };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await getNewAccessTokenFromRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN as string);

    const { track } = await fetchLastPlayedSong();

    return res.status(200).json({ track });
  } catch (e) {
    console.log(e);

    return res.status(400).json({ message: "Bad request!" });
  }
}
