import { NextRequest, NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";

const secret = process.env.LIVEBLOCKS_SECRET_KEY;
if (!secret) {
  throw new Error("LIVEBLOCKS_SECRET_KEY is not defined");
}

const liveblocks = new Liveblocks({
    secret
});  

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = session.user;

  if (!user._id || !user.username) {
    return new NextResponse("Missing user ID or username", { status: 400 });
  }

  const { room } = await req.json();

  if (!room) {
    return new NextResponse("Missing room ID", { status: 400 });
  }

  const liveblocksSession = liveblocks.prepareSession(user._id, {
    userInfo: {
      name: user.username,
      avatar: user.image || "",
    },
  });

  liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);

  const { body, status } = await liveblocksSession.authorize();

  let parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch (error) {
    return new NextResponse("Failed to parse authorization response", { status: 500 });
  }

  return NextResponse.json(parsedBody, { status });
}
