// import { authOptions } from "@/app/api/auth/[...nextauth]/options";
// import dbConnect from "@/lib/dbConnect";
// import BoardModel from "@/models/Board.model";
// import ListModel from "@/models/List.model";
// import { ApiResponse } from "@/utils/ApiResponse";
// import mongoose from "mongoose";
// import { getServerSession, User } from "next-auth";

// export async function PATCH(req: Request, { params }: { params: { listId: string, boardId: string } }) {
//     await dbConnect()
//     const session = await getServerSession(authOptions);
//     const user: User = session?.user as User

//     if (!session || !session.user) {
//         const errResponse = new ApiResponse(401, null, "Not authenticated");
//         return new Response(JSON.stringify(errResponse), {
//             status: errResponse.statusCode,
//             headers: { "Content-Type": "application/json" },
//         });
//     }

//     const { listId, boardId } = params
//     const { searchParams } = new URL(req.url)

//     const pos = Number(searchParams.get('pos'))

//     if (isNaN(pos) || pos < 0) {
//         const errResponse = new ApiResponse(400, null, "Invalid position index");
//         return new Response(JSON.stringify(errResponse), {
//             status: errResponse.statusCode,
//             headers: { "Content-Type": "application/json" },
//         });
//     }

//     if (!mongoose.Types.ObjectId.isValid(listId)) {
//         const errResponse = new ApiResponse(400, null, "Invalid list ID");
//         return new Response(JSON.stringify(errResponse), {
//             status: errResponse.statusCode,
//             headers: { "Content-Type": "application/json" },
//         });
//     }
//     if (!mongoose.Types.ObjectId.isValid(boardId)) {
//         const errResponse = new ApiResponse(400, null, "Invalid board ID");
//         return new Response(JSON.stringify(errResponse), {
//             status: errResponse.statusCode,
//             headers: { "Content-Type": "application/json" },
//         });
//     }

//     try {
//         const board = await BoardModel.findById(boardId)
//         if (!board) {
//             const errResponse = new ApiResponse(404, null, "Board not found");
//             return new Response(JSON.stringify(errResponse), {
//                 status: errResponse.statusCode,
//                 headers: { "Content-Type": "application/json" },
//             });
//         }

//         if (!board.members.some((memberId: mongoose.Types.ObjectId) => memberId.equals(user._id))) {
//             const errResponse = new ApiResponse(403, null, "You are not authorised to update list position");
//             return new Response(JSON.stringify(errResponse), {
//                 status: errResponse.statusCode,
//                 headers: { "Content-Type": "application/json" },
//             });
//         }

//         const lists = await ListModel.find({ board: boardId })
//         if (!lists) {
//             const errResponse = new ApiResponse(404, null, "No lists found");
//             return new Response(JSON.stringify(errResponse), {
//                 status: errResponse.statusCode,
//                 headers: { "Content-Type": "application/json" },
//             });
//         }
//         if (lists.length <= pos) {
//             const errResponse = new ApiResponse(400, null, `Position should be less than ${lists.length}`);
//             return new Response(JSON.stringify(errResponse), {
//                 status: errResponse.statusCode,
//                 headers: { "Content-Type": "application/json" },
//             });
//         }

//         const session = await mongoose.startSession();
//         session.startTransaction()

//         const list = await ListModel.findById(listId).session(session);
//         if (!list) {
//             const errResponse = new ApiResponse(404, null, "List not found");
//             return new Response(JSON.stringify(errResponse), {
//                 status: errResponse.statusCode,
//                 headers: { "Content-Type": "application/json" },
//             });
//         }

//         const oldListPos = await ListModel.findOne({ board: boardId, position: pos }).session(session)
//         if (!oldListPos) {
//             const errResponse = new ApiResponse(404, null, "List not found");
//             return new Response(JSON.stringify(errResponse), {
//                 status: errResponse.statusCode,
//                 headers: { "Content-Type": "application/json" },
//             });
//         }

//         oldListPos.position = list.position
//         await oldListPos.save({ session })

//         list.position = pos
//         await list.save({ session })

//         await session.commitTransaction()
//         session.endSession()

//         const successResponse = new ApiResponse(200, list, "List position updated successfully");
//         return new Response(JSON.stringify(successResponse), {
//             status: successResponse.statusCode,
//             headers: { "Content-Type": "application/json" },
//         });
//     } catch (error) {
//         console.log("Error updating list name", error);
//         const errResponse = new ApiResponse(500, null, "Internal server error");
//         return new Response(JSON.stringify(errResponse), {
//             status: errResponse.statusCode,
//             headers: { "Content-Type": "application/json" },
//         });
//     }
// }









import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import BoardModel from "@/models/Board.model";
import ListModel from "@/models/List.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function PATCH(req: Request, { params }: { params: { listId: string, boardId: string } }) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user: User = session?.user as User;

    if (!session || !session.user) {
        return new Response(JSON.stringify(new ApiResponse(401, null, "Not authenticated")), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { listId, boardId } = params;
    const { searchParams } = new URL(req.url);
    const newPos = Number(searchParams.get("pos"));

    if (isNaN(newPos) || newPos < 0) {
        return new Response(JSON.stringify(new ApiResponse(400, null, "Invalid position index")), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    if (!mongoose.Types.ObjectId.isValid(listId) || !mongoose.Types.ObjectId.isValid(boardId)) {
        return new Response(JSON.stringify(new ApiResponse(400, null, "Invalid ID(s)")), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const board = await BoardModel.findById(boardId);
        if (!board) {
            return new Response(JSON.stringify(new ApiResponse(404, null, "Board not found")), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!board.members.some((memberId: mongoose.Types.ObjectId) => memberId.equals(user._id))) {
            return new Response(JSON.stringify(new ApiResponse(403, null, "Not authorized")), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }

        const lists = await ListModel.find({ board: boardId }).sort({ position: 1 }).lean();
        const listToMove = lists.find((l) => l._id.toString() === listId);

        if (!listToMove) {
            return new Response(JSON.stringify(new ApiResponse(404, null, "List not found")), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        const oldPos = listToMove.position;

        if (newPos >= lists.length) {
            return new Response(JSON.stringify(new ApiResponse(400, null, "Position out of bounds")), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const reorderedLists = lists.filter(l => l._id.toString() !== listId);
        reorderedLists.splice(newPos, 0, listToMove);

        const sessionDb = await mongoose.startSession();
        sessionDb.startTransaction();

        await Promise.all(
            reorderedLists.map((list, index) =>
                ListModel.updateOne(
                    { _id: list._id },
                    { $set: { position: index } },
                    { session: sessionDb }
                )
            )
        );

        await sessionDb.commitTransaction();
        sessionDb.endSession();

        return new Response(JSON.stringify(new ApiResponse(200, null, "List reordered successfully")), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error updating list position:", error);
        return new Response(JSON.stringify(new ApiResponse(500, null, "Internal server error")), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

